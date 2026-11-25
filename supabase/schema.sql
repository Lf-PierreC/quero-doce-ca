-- =====================================================================
-- QUERO DOCE CA • ESQUEMA COMPLETO DO BANCO (SUPABASE / POSTGRESQL)
-- ---------------------------------------------------------------------
-- Como usar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole este arquivo inteiro e clique em "Run"
--   3. O script é idempotente (pode rodar mais de uma vez sem quebrar)
--
-- Depois de rodar:
--   • Crie a conta da administradora em Authentication → Users
--     (ex: admin@querodoceca.com.br) e execute:
--       update public.profiles set role = 'ADMIN'
--       where email = 'admin@querodoceca.com.br';
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 0. FUNÇÕES UTILITÁRIAS
-- =====================================================================

-- Atualiza automaticamente a coluna updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. PERFIS DE ACESSO (vinculados ao Supabase Auth)
--    role = 'ADMIN' libera o Painel Admin; 'CUSTOMER' = cliente comum
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  whatsapp text,
  role text not null default 'CUSTOMER' check (role in ('ADMIN', 'CUSTOMER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Verifica se o usuário logado é administradora (usado nas políticas RLS)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Cria o perfil automaticamente quando alguém se cadastra no site
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, whatsapp)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'whatsapp'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Impede que um cliente se promova a ADMIN editando o próprio perfil
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Somente a administração pode alterar o tipo de acesso.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- =====================================================================
-- 2. REGRAS DOS PLANOS (Office P/M/G e Home P/G) — editáveis no Admin
-- =====================================================================
create table if not exists public.subscription_plans (
  id text primary key,                                   -- OFFICE_P, OFFICE_M, OFFICE_G, HOME_P, HOME_G
  category text not null check (category in ('OFFICE', 'HOME')),
  name text not null,                                    -- "Office M"
  marketing_name text not null,                          -- "Clínica & Equipe"
  subtitle text,
  capacity_label text not null,                          -- "De 11 a 25 pessoas"
  units_per_delivery integer not null default 1 check (units_per_delivery > 0),

  -- OFFICE: valor mensal base (entrega 1x/semana)
  base_monthly_price numeric(10,2),
  -- HOME: valor mensal por frequência
  price_semanal numeric(10,2),
  price_quinzenal numeric(10,2),

  -- Descontos por período de fidelidade (%)
  discount_mensal numeric(5,2) not null default 0,
  discount_trimestral numeric(5,2) not null default 0,   -- usado no HOME
  discount_semestral numeric(5,2) not null default 0,    -- usado no OFFICE
  discount_anual numeric(5,2) not null default 0,        -- usado no OFFICE

  features jsonb not null default '[]'::jsonb,           -- itens do card do plano
  badge text,                                            -- "Mais Escolhido por Clínicas"
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_plan_prices check (
    (category = 'OFFICE' and base_monthly_price is not null)
    or (category = 'HOME' and price_semanal is not null and price_quinzenal is not null)
  )
);

drop trigger if exists trg_plans_updated_at on public.subscription_plans;
create trigger trg_plans_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. CARDÁPIO DE BOLOS (avulsos e base da Surpresa da Chef)
-- =====================================================================
create table if not exists public.cake_flavors (
  id text primary key,                                   -- slug: "cenoura-brigadeiro"
  name text not null,
  tag text,
  description text,
  category text not null default 'CLASSICO' check (category in ('CLASSICO', 'ESPECIAL', 'SAZONAL')),
  price_familia numeric(10,2) not null check (price_familia >= 0),
  price_individual numeric(10,2) not null check (price_individual >= 0),
  extra_syrup_price numeric(10,2) not null default 0,
  extra_syrup_name text,
  available_avulso boolean not null default true,
  available_subscription boolean not null default true,
  is_cake_of_the_week boolean not null default false,
  highlight_color text,
  dietary_info text,                                     -- "Opção Zero Lactose"
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_flavors_updated_at on public.cake_flavors;
create trigger trg_flavors_updated_at
  before update on public.cake_flavors
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. CLIENTES (CRM unificado: assinantes, compradores avulsos e leads)
-- =====================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null, -- null = comprou sem criar conta
  full_name text not null,
  company_or_clinic_name text,
  document_cpf_cnpj text,                                -- obrigatório só ao assinar (Asaas/NFS-e)
  email text,
  whatsapp text not null,
  address text,
  neighborhood text,
  city text not null default 'Mogi das Cruzes',
  delivery_notes text,                                   -- "Entregar na recepção com a Fernanda"

  -- Preferências para a Surpresa da Chef
  favorite_styles text[] not null default '{}',
  dietary_restrictions text,

  -- Origem / marketing
  origin_note text,                                      -- "Conheceu no consultório parceiro"
  marketing_opt_in boolean not null default true,

  asaas_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_customers_email
  on public.customers (lower(email)) where email is not null;
create index if not exists idx_customers_whatsapp on public.customers (whatsapp);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. ASSINATURAS (Office e Home)
-- =====================================================================
create table if not exists public.subscriptions (
  id text primary key default ('SUB-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0')),
  customer_id uuid not null references public.customers(id) on delete cascade,
  category text not null check (category in ('OFFICE', 'HOME')),
  plan_code text not null references public.subscription_plans(id),
  plan_name text not null,                               -- snapshot: "Office M (De 11 a 25 pessoas)"
  frequency text not null check (frequency in ('SEMANAL', 'QUINZENAL')),
  units_per_delivery integer not null default 1,
  period text not null check (period in ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
  monthly_value numeric(10,2) not null check (monthly_value >= 0),
  status text not null default 'ATIVA' check (status in ('ATIVA', 'PAUSADA', 'ATRASADA', 'CANCELADA')),

  -- Logística
  delivery_day text not null check (delivery_day in ('TERCA', 'QUINTA', 'SEXTA', 'SABADO')),
  delivery_shift text not null check (delivery_shift in ('MANHA', 'TARDE', 'NOITE')),
  delivery_address text,                                 -- se vazio, usa o endereço do cliente
  delivery_neighborhood text,
  next_delivery_date date,

  -- Curadoria definida pelo ateliê para a próxima entrega
  selected_flavors_next_delivery text[] not null default '{}',

  -- Viagem inteligente: pular entrega e acumular bolos na próxima
  rescheduled_deliveries_count integer not null default 0,
  skipped_dates date[] not null default '{}',

  completed_deliveries_count integer not null default 0,

  -- Pagamento (Asaas)
  payment_method text not null check (payment_method in ('PIX', 'CREDIT_CARD', 'BOLETO')),
  asaas_subscription_id text unique,
  card_last4 text,
  card_brand text,

  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Turno noturno é exclusivo do Plano Home
  constraint chk_noite_only_home check (delivery_shift <> 'NOITE' or category = 'HOME'),
  -- Office é sempre semanal
  constraint chk_office_semanal check (category <> 'OFFICE' or frequency = 'SEMANAL')
);

create index if not exists idx_subscriptions_customer on public.subscriptions (customer_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);
create index if not exists idx_subscriptions_next_delivery on public.subscriptions (next_delivery_date);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. LINHA DO TEMPO DA ASSINATURA (adesão, upgrades, pausas, viagens…)
-- =====================================================================
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id text not null references public.subscriptions(id) on delete cascade,
  event_type text not null check (event_type in (
    'ADESAO', 'UPGRADE', 'DOWNGRADE', 'MUDANCA_FREQUENCIA', 'MUDANCA_PERIODO',
    'PAUSA', 'REATIVACAO', 'CANCELAMENTO', 'PULO_VIAGEM', 'PULO_DESFEITO',
    'MUDANCA_PAGAMENTO', 'OUTRO'
  )),
  title text not null,
  description text,
  old_value jsonb,
  new_value jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sub_events_subscription
  on public.subscription_events (subscription_id, created_at desc);

-- Registra automaticamente adesão e mudanças de plano/frequência/período/status
create or replace function public.log_subscription_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  old_units integer;
begin
  if tg_op = 'INSERT' then
    insert into public.subscription_events (subscription_id, event_type, title, description, new_value, created_by)
    values (
      new.id, 'ADESAO',
      'Adesão Inicial • ' || new.plan_name || ' (' || new.period || ')',
      'Assinatura iniciada com ' || new.units_per_delivery || ' bolo(s) por entrega, frequência ' || lower(new.frequency) || '.',
      jsonb_build_object('plan_code', new.plan_code, 'period', new.period, 'frequency', new.frequency, 'monthly_value', new.monthly_value),
      auth.uid()
    );
    return new;
  end if;

  if new.plan_code is distinct from old.plan_code then
    old_units := old.units_per_delivery;
    insert into public.subscription_events (subscription_id, event_type, title, old_value, new_value, created_by)
    values (
      new.id,
      case when new.monthly_value >= old.monthly_value then 'UPGRADE' else 'DOWNGRADE' end,
      case when new.monthly_value >= old.monthly_value then 'Upgrade de Plano • ' else 'Alteração de Plano • ' end
        || old.plan_name || ' → ' || new.plan_name,
      jsonb_build_object('plan_code', old.plan_code, 'monthly_value', old.monthly_value, 'units', old_units),
      jsonb_build_object('plan_code', new.plan_code, 'monthly_value', new.monthly_value, 'units', new.units_per_delivery),
      auth.uid()
    );
  end if;

  if new.frequency is distinct from old.frequency then
    insert into public.subscription_events (subscription_id, event_type, title, old_value, new_value, created_by)
    values (new.id, 'MUDANCA_FREQUENCIA',
      'Frequência alterada • ' || old.frequency || ' → ' || new.frequency,
      to_jsonb(old.frequency), to_jsonb(new.frequency), auth.uid());
  end if;

  if new.period is distinct from old.period then
    insert into public.subscription_events (subscription_id, event_type, title, old_value, new_value, created_by)
    values (new.id, 'MUDANCA_PERIODO',
      'Ciclo alterado • ' || old.period || ' → ' || new.period,
      to_jsonb(old.period), to_jsonb(new.period), auth.uid());
  end if;

  if new.status is distinct from old.status then
    insert into public.subscription_events (subscription_id, event_type, title, old_value, new_value, created_by)
    values (new.id,
      case new.status
        when 'CANCELADA' then 'CANCELAMENTO'
        when 'PAUSADA' then 'PAUSA'
        when 'ATIVA' then 'REATIVACAO'
        else 'OUTRO' end,
      'Status • ' || old.status || ' → ' || new.status,
      to_jsonb(old.status), to_jsonb(new.status), auth.uid());

    if new.status = 'CANCELADA' then
      new.cancelled_at := now();
    elsif old.status = 'CANCELADA' then
      new.cancelled_at := null;
    end if;
  end if;

  if new.payment_method is distinct from old.payment_method then
    insert into public.subscription_events (subscription_id, event_type, title, old_value, new_value, created_by)
    values (new.id, 'MUDANCA_PAGAMENTO',
      'Forma de pagamento • ' || old.payment_method || ' → ' || new.payment_method,
      to_jsonb(old.payment_method), to_jsonb(new.payment_method), auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_subscription_insert on public.subscriptions;
create trigger trg_log_subscription_insert
  after insert on public.subscriptions
  for each row execute function public.log_subscription_changes();

drop trigger if exists trg_log_subscription_update on public.subscriptions;
create trigger trg_log_subscription_update
  before update on public.subscriptions
  for each row execute function public.log_subscription_changes();

-- Clientes só podem editar preferências/logística. Valores, status de cobrança
-- e plano são alterados pela administração ou pelas rotas /api (service role).
create or replace function public.guard_subscription_customer_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service role (API/webhook) ou administradora
  end if;

  if new.monthly_value is distinct from old.monthly_value
     or new.plan_code is distinct from old.plan_code
     or new.units_per_delivery is distinct from old.units_per_delivery
     or new.period is distinct from old.period
     or new.asaas_subscription_id is distinct from old.asaas_subscription_id
     or new.completed_deliveries_count is distinct from old.completed_deliveries_count
     or new.customer_id is distinct from old.customer_id
     or new.selected_flavors_next_delivery is distinct from old.selected_flavors_next_delivery
     or (new.status is distinct from old.status and new.status not in ('CANCELADA', 'ATIVA'))
  then
    raise exception 'Esta alteração precisa ser feita pelo checkout/atendimento da Quero Doce Ca.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_subscription_customer_update on public.subscriptions;
create trigger trg_guard_subscription_customer_update
  before update on public.subscriptions
  for each row execute function public.guard_subscription_customer_update();

-- =====================================================================
-- 7. PEDIDOS / ENTREGAS (assinaturas da semana + encomendas avulsas)
-- =====================================================================
create table if not exists public.delivery_orders (
  id text primary key default ('PED-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0')),
  customer_id uuid references public.customers(id) on delete set null,
  subscription_id text references public.subscriptions(id) on delete set null,
  order_type text not null check (order_type in ('ASSINATURA_OFFICE', 'ASSINATURA_HOME', 'AVULSO')),

  -- Snapshot do cliente no momento do pedido (mantém o histórico íntegro)
  customer_name text not null,
  company_name text,
  whatsapp text not null,
  address text not null,
  neighborhood text not null,

  delivery_date date not null,
  delivery_day_label text,                               -- "Quinta-feira"
  shift text not null check (shift in ('MANHA', 'TARDE', 'NOITE')),

  production_status text not null default 'FILA'
    check (production_status in ('FILA', 'NO_FORNO', 'FINALIZADO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO')),
  total_value numeric(10,2) not null default 0,

  -- Pagamento (avulsos são cobrados por pedido; assinaturas pela recorrência)
  payment_method text check (payment_method in ('PIX', 'CREDIT_CARD', 'BOLETO')),
  payment_status text not null default 'PENDENTE'
    check (payment_status in ('PENDENTE', 'PAGO', 'INCLUSO_ASSINATURA', 'ESTORNADO', 'CANCELADO')),
  asaas_payment_id text,

  delivered_at timestamptz,
  feedback_note text,                                    -- "Recebido pela Fernanda na recepção"
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_delivery_date on public.delivery_orders (delivery_date);
create index if not exists idx_orders_status on public.delivery_orders (production_status);
create index if not exists idx_orders_customer on public.delivery_orders (customer_id);
create index if not exists idx_orders_subscription on public.delivery_orders (subscription_id);

drop trigger if exists trg_orders_updated_at on public.delivery_orders;
create trigger trg_orders_updated_at
  before update on public.delivery_orders
  for each row execute function public.set_updated_at();

-- Itens de cada pedido (base do Consolidado de Forno)
create table if not exists public.delivery_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.delivery_orders(id) on delete cascade,
  flavor_id text references public.cake_flavors(id) on delete set null,
  flavor_name text not null,                             -- snapshot do nome
  size text not null check (size in ('FAMILIA', 'INDIVIDUAL', 'P_HOME', 'G_HOME', 'G_OFFICE')),
  quantity integer not null default 1 check (quantity > 0),
  extra_syrup boolean not null default false,
  unit_price numeric(10,2) not null default 0,
  extra_syrup_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.delivery_order_items (order_id);

-- Ao marcar ENTREGUE: grava horário e soma no contador da assinatura
create or replace function public.handle_order_delivered()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.production_status = 'ENTREGUE' and old.production_status is distinct from 'ENTREGUE' then
    new.delivered_at := coalesce(new.delivered_at, now());
    if new.subscription_id is not null then
      update public.subscriptions
        set completed_deliveries_count = completed_deliveries_count + 1
        where id = new.subscription_id;
    end if;
  elsif old.production_status = 'ENTREGUE' and new.production_status <> 'ENTREGUE' then
    new.delivered_at := null;
    if new.subscription_id is not null then
      update public.subscriptions
        set completed_deliveries_count = greatest(0, completed_deliveries_count - 1)
        where id = new.subscription_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_delivered on public.delivery_orders;
create trigger trg_order_delivered
  before update of production_status on public.delivery_orders
  for each row execute function public.handle_order_delivered();

-- =====================================================================
-- 8. PAGAMENTOS ASAAS (cobranças de assinaturas e avulsos)
-- =====================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  asaas_payment_id text unique not null,
  customer_id uuid references public.customers(id) on delete set null,
  subscription_id text references public.subscriptions(id) on delete set null,
  order_id text references public.delivery_orders(id) on delete set null,
  billing_type text check (billing_type in ('PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED')),
  value numeric(10,2) not null,
  net_value numeric(10,2),
  status text not null default 'PENDING',               -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED...
  due_date date,
  payment_date date,
  description text,
  invoice_url text,                                      -- link da fatura Asaas
  bank_slip_url text,                                    -- boleto PDF
  pix_copy_paste text,
  nfse_url text,                                         -- nota fiscal emitida
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_customer on public.payments (customer_id);
create index if not exists idx_payments_subscription on public.payments (subscription_id);
create index if not exists idx_payments_status on public.payments (status, due_date);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Log bruto dos webhooks Asaas (idempotência e auditoria)
create table if not exists public.asaas_webhook_events (
  id text primary key,                                   -- id do evento enviado pelo Asaas
  event text not null,                                   -- PAYMENT_RECEIVED, PAYMENT_OVERDUE...
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- =====================================================================
-- 9. CAMPANHAS / PROMOÇÕES ENVIADAS (ex.: convite de plano via WhatsApp)
-- =====================================================================
create table if not exists public.promo_sends (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  channel text not null default 'WHATSAPP' check (channel in ('WHATSAPP', 'EMAIL', 'SMS')),
  campaign text not null default 'CONVITE_ASSINATURA',
  message text,
  converted_subscription_id text references public.subscriptions(id) on delete set null,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now()
);

create index if not exists idx_promo_sends_customer on public.promo_sends (customer_id, sent_at desc);

-- =====================================================================
-- 10. VIEWS PARA OS DASHBOARDS DO ADMIN
--     (security_invoker = respeitam o RLS de quem consulta)
-- =====================================================================

-- Consolidado de forno por sabor e tamanho (entregas de hoje em diante)
create or replace view public.v_weekly_baking_summary
with (security_invoker = true) as
select
  o.delivery_date,
  i.flavor_name,
  sum(i.quantity) as total_units,
  sum(i.quantity) filter (where i.size = 'G_OFFICE') as office_g,
  sum(i.quantity) filter (where i.size in ('FAMILIA', 'P_HOME', 'G_HOME')) as familia_home,
  sum(i.quantity) filter (where i.size = 'INDIVIDUAL') as individual
from public.delivery_orders o
join public.delivery_order_items i on i.order_id = o.id
where o.production_status <> 'CANCELADO'
  and o.delivery_date >= date_trunc('week', current_date)::date
  and o.delivery_date < (date_trunc('week', current_date) + interval '7 days')::date
group by o.delivery_date, i.flavor_name;

-- KPIs financeiros (MRR, contratos e ticket médio)
create or replace view public.v_financial_kpis
with (security_invoker = true) as
select
  coalesce(sum(monthly_value) filter (where status = 'ATIVA'), 0) as mrr_total,
  coalesce(sum(monthly_value) filter (where status = 'ATIVA' and category = 'OFFICE'), 0) as mrr_office,
  coalesce(sum(monthly_value) filter (where status = 'ATIVA' and category = 'HOME'), 0) as mrr_home,
  count(*) filter (where status = 'ATIVA') as active_subscriptions,
  count(*) filter (where status = 'ATIVA' and category = 'OFFICE') as active_office,
  count(*) filter (where status = 'ATIVA' and category = 'HOME') as active_home,
  count(*) filter (where status = 'ATRASADA') as overdue_subscriptions,
  case when count(*) filter (where status = 'ATIVA') > 0
    then round(sum(monthly_value) filter (where status = 'ATIVA') / count(*) filter (where status = 'ATIVA'), 2)
    else 0 end as average_ticket
from public.subscriptions;

-- Carteira de clientes (CRM): assinantes + compradores avulsos
create or replace view public.v_customers_crm
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.company_or_clinic_name,
  c.email,
  c.whatsapp,
  c.neighborhood,
  c.favorite_styles,
  c.origin_note,
  c.created_at,
  s.id as subscription_id,
  s.category as subscription_category,
  s.plan_name,
  s.status as subscription_status,
  s.monthly_value,
  case when s.id is not null and s.status <> 'CANCELADA' then 'ASSINANTE' else 'AVULSO' end as customer_type,
  coalesce(av.orders_count, 0) as avulso_orders_count,
  coalesce(av.total_spent, 0) as avulso_total_spent,
  av.last_order_date,
  (select max(p.sent_at) from public.promo_sends p where p.customer_id = c.id) as last_promo_sent_at
from public.customers c
left join lateral (
  select * from public.subscriptions s2
  where s2.customer_id = c.id
  order by (s2.status = 'ATIVA') desc, s2.created_at desc
  limit 1
) s on true
left join lateral (
  select count(*) as orders_count, sum(o.total_value) as total_spent, max(o.delivery_date) as last_order_date
  from public.delivery_orders o
  where o.customer_id = c.id and o.order_type = 'AVULSO' and o.production_status <> 'CANCELADO'
) av on true;

-- =====================================================================
-- 11. ROW LEVEL SECURITY (RLS)
--     • Visitantes: leem planos e cardápio
--     • Clientes: veem/editam apenas os próprios dados
--     • ADMIN: acesso total
--     • Rotas /api com SERVICE_ROLE_KEY ignoram RLS (checkout e webhook)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.cake_flavors enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.delivery_orders enable row level security;
alter table public.delivery_order_items enable row level security;
alter table public.payments enable row level security;
alter table public.asaas_webhook_events enable row level security;
alter table public.promo_sends enable row level security;

-- Recria as políticas de forma idempotente
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in (
      'profiles', 'subscription_plans', 'cake_flavors', 'customers', 'subscriptions',
      'subscription_events', 'delivery_orders', 'delivery_order_items', 'payments',
      'asaas_webhook_events', 'promo_sends'
    )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PROFILES
create policy "profiles: ver o próprio" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: editar o próprio" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- PLANOS (vitrine pública)
create policy "plans: leitura pública" on public.subscription_plans
  for select using (active or public.is_admin());
create policy "plans: admin gerencia" on public.subscription_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- CARDÁPIO (vitrine pública)
create policy "flavors: leitura pública" on public.cake_flavors
  for select using (true);
create policy "flavors: admin gerencia" on public.cake_flavors
  for all using (public.is_admin()) with check (public.is_admin());

-- CLIENTES
create policy "customers: ver o próprio" on public.customers
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "customers: criar o próprio" on public.customers
  for insert with check (profile_id = auth.uid() or public.is_admin());
create policy "customers: editar o próprio" on public.customers
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());
create policy "customers: admin exclui" on public.customers
  for delete using (public.is_admin());

-- ASSINATURAS
create policy "subscriptions: ver as próprias" on public.subscriptions
  for select using (
    public.is_admin()
    or customer_id in (select id from public.customers where profile_id = auth.uid())
  );
create policy "subscriptions: cliente edita preferências" on public.subscriptions
  for update using (
    public.is_admin()
    or customer_id in (select id from public.customers where profile_id = auth.uid())
  )
  with check (
    public.is_admin()
    or customer_id in (select id from public.customers where profile_id = auth.uid())
  );
create policy "subscriptions: admin cria/exclui" on public.subscriptions
  for insert with check (public.is_admin());
create policy "subscriptions: admin exclui" on public.subscriptions
  for delete using (public.is_admin());

-- LINHA DO TEMPO
create policy "sub_events: ver os próprios" on public.subscription_events
  for select using (
    public.is_admin()
    or subscription_id in (
      select s.id from public.subscriptions s
      join public.customers c on c.id = s.customer_id
      where c.profile_id = auth.uid()
    )
  );
create policy "sub_events: admin gerencia" on public.subscription_events
  for all using (public.is_admin()) with check (public.is_admin());

-- PEDIDOS / ENTREGAS
create policy "orders: ver os próprios" on public.delivery_orders
  for select using (
    public.is_admin()
    or customer_id in (select id from public.customers where profile_id = auth.uid())
  );
create policy "orders: admin gerencia" on public.delivery_orders
  for all using (public.is_admin()) with check (public.is_admin());

create policy "order_items: ver os próprios" on public.delivery_order_items
  for select using (
    public.is_admin()
    or order_id in (
      select o.id from public.delivery_orders o
      join public.customers c on c.id = o.customer_id
      where c.profile_id = auth.uid()
    )
  );
create policy "order_items: admin gerencia" on public.delivery_order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- PAGAMENTOS
create policy "payments: ver os próprios" on public.payments
  for select using (
    public.is_admin()
    or customer_id in (select id from public.customers where profile_id = auth.uid())
  );
create policy "payments: admin gerencia" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- WEBHOOKS e PROMOÇÕES: somente administração
create policy "webhooks: somente admin" on public.asaas_webhook_events
  for all using (public.is_admin()) with check (public.is_admin());
create policy "promo_sends: somente admin" on public.promo_sends
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 12. DADOS INICIAIS (planos e cardápio fictícios — edite pelo Admin)
--     "on conflict do nothing" preserva o que já foi alterado no painel
-- =====================================================================
insert into public.subscription_plans
  (id, category, name, marketing_name, subtitle, capacity_label, units_per_delivery,
   base_monthly_price, price_semanal, price_quinzenal,
   discount_mensal, discount_trimestral, discount_semestral, discount_anual,
   features, badge, sort_order)
values
  ('OFFICE_P', 'OFFICE', 'Office P', 'Cuidado Boutique', 'Recepção & Consultórios Compactos', 'Até 10 pessoas', 1,
   239.90, null, null, 0, 0, 10, 18,
   '["1 Bolo Caseiro Grande toda semana (4 bolos/mês)","Assado horas antes da entrega (ainda morno)","Embalagem corporativa higienizada pronta para servir","Nota Fiscal (NFS-e) e boleto/PIX recorrente automático"]'::jsonb,
   null, 1),
  ('OFFICE_M', 'OFFICE', 'Office M', 'Clínica & Equipe', 'Clínicas Médicas, Odontológicas e Escritórios', 'De 11 a 25 pessoas', 2,
   439.90, null, null, 0, 0, 10, 18,
   '["2 Bolos Caseiros Grandes toda semana (8 bolos/mês)","Assado horas antes da entrega (ainda morno)","Embalagem corporativa higienizada pronta para servir","Cada paciente e colaborador alcançado vive a experiência da sua empresa","Nota Fiscal (NFS-e) e boleto/PIX recorrente automático"]'::jsonb,
   'Mais Escolhido por Clínicas', 2),
  ('OFFICE_G', 'OFFICE', 'Office G', 'Corporate & Centros Médicos', 'Clínicas de Grande Porte e Empresas', 'Acima de 25 pessoas', 3,
   619.90, null, null, 0, 0, 12, 20,
   '["3 Bolos Caseiros Grandes toda semana (12 bolos/mês)","Assado horas antes da entrega (ainda morno)","Embalagem corporativa higienizada pronta para servir","Transforma o café da equipe e o acolhimento VIP","Atendimento dedicado via WhatsApp","Nota Fiscal (NFS-e) e boleto/PIX recorrente automático"]'::jsonb,
   null, 3),
  ('HOME_P', 'HOME', 'Home P', 'Ritual a Dois', 'Para casais e pequenas famílias', 'Até 4 pessoas', 1,
   null, 164.90, 89.90, 0, 10, 0, 0,
   '["1 Unidade (Bolo Caseiro P - até 4 pessoas) por entrega","Escolha entre frequência Semanal ou Quinzenal","Experiência Surpresa da Chef baseada nas suas preferências de sabores","Entregas Manhã, Tarde ou Noite para adoçar o seu fim de semana","Vai viajar? Pule a entrega e receba os bolos acumulados na próxima"]'::jsonb,
   null, 4),
  ('HOME_G', 'HOME', 'Home G', 'Mesa Cheia em Família', 'Para famílias maiores ou quem ama receber visitas', 'Mais de 4 pessoas (4 a 8 fatias generosas)', 1,
   null, 259.90, 139.90, 0, 12, 0, 0,
   '["1 Unidade (Bolo Caseiro G - mais de 4 pessoas) por entrega","Escolha entre frequência Semanal ou Quinzenal","Experiência Surpresa da Chef baseada nas suas preferências de sabores","Entregas Manhã, Tarde ou Noite fresquinho saído do forno","Vai viajar? Pule a entrega e receba os bolos acumulados na próxima"]'::jsonb,
   'Preferido das Famílias', 5)
on conflict (id) do nothing;

insert into public.cake_flavors
  (id, name, tag, description, category, price_familia, price_individual,
   extra_syrup_price, extra_syrup_name, is_cake_of_the_week, highlight_color, dietary_info, sort_order)
values
  ('cenoura-brigadeiro', 'Cenoura & Brigadeiro Belga', 'O Clássico Absoluto',
   'Massa leve e macia de cenoura fresca ralada na hora, coberta com uma camada generosa de brigadeiro tradicional aveludado.',
   'CLASSICO', 68.00, 24.00, 7.00, 'Potinho Extra de Brigadeiro Quente (50ml)', true, '#C89F5A', null, 1),
  ('double-chocolate', 'Double Chocolate Intenso', 'Intenso & Úmido',
   'Massa intensa e úmida de cacau 70%, finalizada com cobertura aveludada de ganache meio amargo e raspas nobres.',
   'ESPECIAL', 74.00, 26.00, 8.00, 'Potinho Extra de Ganache Meio Amargo (50ml)', false, '#4A2B1D', null, 2),
  ('fuba-goiabada', 'Fubá Cremoso com Goiabada Cascão', 'Memória Afetiva',
   'Fubá artesanal moidinho na hora com toque de erva-doce opcional e pedaços generosos de goiabada cascão derretida no centro.',
   'CLASSICO', 62.00, 22.00, 6.00, 'Potinho Extra de Calda de Goiabada Rústica (50ml)', true, '#b45309', null, 3),
  ('limao-siciliano-mirtilo', 'Limão Siciliano & Glacê Real', 'Queridinho dos Consultórios',
   'Massa amanteigada perfumada com raspas de limão siciliano fresco e cobertura cítrica delicada que encanta qualquer recepção.',
   'ESPECIAL', 72.00, 25.00, 7.00, 'Potinho Extra de Coulis Cítrico (50ml)', true, '#ca8a04', null, 4),
  ('laranja-calda-perfumada', 'Laranja da Fazenda em Calda', 'Perfeito com Café',
   'Bolo fofíssimo regado ainda quente com calda natural de laranja Bahia e cravo suave. Sem lactose na composição.',
   'CLASSICO', 59.00, 20.00, 6.00, 'Potinho Extra de Redução de Laranja (50ml)', false, '#d97706', 'Opção Zero Lactose', 5),
  ('coco-leite-condensado', 'Toalha Felpuda Artesanal', 'Suave & Molhadinho',
   'Massa branca super aerada embebida em calda três leites com flocos de coco fresco queimado na finalização.',
   'SAZONAL', 69.00, 24.00, 7.00, 'Potinho Extra de Calda Três Leites (50ml)', false, '#a16207', null, 6)
on conflict (id) do nothing;

-- =====================================================================
-- 13. PERMISSÕES DE ACESSO (GRANTS para PostgREST / API do Supabase)
--     As políticas RLS da seção 11 continuam controlando linha a linha.
-- =====================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select on public.subscription_plans, public.cake_flavors to anon;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant select on public.v_weekly_baking_summary, public.v_financial_kpis, public.v_customers_crm to authenticated, service_role;

-- =====================================================================
-- FIM • Quero Doce Ca
-- =====================================================================
