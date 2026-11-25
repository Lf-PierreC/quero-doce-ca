import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * API unificada de sincronização entre o Portal Quero Doce Ca e o Supabase.
 *
 * GET  /api/portal/sync  -> Carrega planos, sabores, assinaturas (com eventos) e pedidos/entregas (com itens)
 * POST /api/portal/sync  -> Persiste ações (update_office_plan, update_home_plan, upsert_flavor,
 *                           delete_flavor, create_subscription, update_subscription,
 *                           create_order, update_order_status, register_customer)
 */
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { connected: false, reason: "Supabase não configurado no .env.local" },
      { status: 200 }
    );
  }

  try {
    const [plansRes, flavorsRes, subsRes, eventsRes, ordersRes, itemsRes] =
      await Promise.all([
        supabaseAdmin
          .from("subscription_plans")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("cake_flavors")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("subscriptions")
          .select("*, customers(*)")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("subscription_events")
          .select("*")
          .order("created_at", { ascending: true }),
        supabaseAdmin
          .from("delivery_orders")
          .select("*")
          .order("delivery_date", { ascending: false }),
        supabaseAdmin.from("delivery_order_items").select("*"),
      ]);

    const firstError =
      plansRes.error ||
      flavorsRes.error ||
      subsRes.error ||
      eventsRes.error ||
      ordersRes.error ||
      itemsRes.error;

    if (firstError) {
      return NextResponse.json(
        {
          connected: false,
          error: firstError.message,
          code: firstError.code,
          hint: firstError.hint,
        },
        { status: 200 }
      );
    }

    // Mapeia planos OFFICE e HOME para o formato usado pelo frontend
    const officePlans = (plansRes.data || [])
      .filter((p) => p.category === "OFFICE")
      .map((p) => ({
        id: p.id,
        name: p.name,
        marketingName: p.marketing_name,
        subtitle: p.subtitle || "",
        capacityLabel: p.capacity_label,
        unitsPerWeek: p.units_per_delivery,
        baseMonthlyPrice: Number(p.base_monthly_price || 0),
        discounts: {
          MENSAL: Number(p.discount_mensal || 0),
          SEMESTRAL: Number(p.discount_semestral || 0),
          ANUAL: Number(p.discount_anual || 0),
        },
        features: Array.isArray(p.features) ? p.features : [],
        badge: p.badge || undefined,
      }));

    const homePlans = (plansRes.data || [])
      .filter((p) => p.category === "HOME")
      .map((p) => ({
        id: p.id,
        name: p.name,
        marketingName: p.marketing_name,
        subtitle: p.subtitle || "",
        capacityLabel: p.capacity_label,
        unitsPerDelivery: p.units_per_delivery,
        basePrices: {
          SEMANAL: Number(p.price_semanal || 0),
          QUINZENAL: Number(p.price_quinzenal || 0),
        },
        discounts: {
          MENSAL: Number(p.discount_mensal || 0),
          TRIMESTRAL: Number(p.discount_trimestral || 0),
        },
        features: Array.isArray(p.features) ? p.features : [],
        badge: p.badge || undefined,
      }));

    const cakeFlavors = (flavorsRes.data || []).map((f) => ({
      id: f.id,
      name: f.name,
      tag: f.tag || "",
      description: f.description || "",
      category: f.category || "CLASSICO",
      priceFamilia: Number(f.price_familia || 0),
      priceIndividual: Number(f.price_individual || 0),
      extraSyrupPrice: Number(f.extra_syrup_price || 0),
      extraSyrupName: f.extra_syrup_name || "",
      availableAvulso: Boolean(f.available_avulso),
      availableSubscription: Boolean(f.available_subscription),
      isCakeOfTheWeek: Boolean(f.is_cake_of_the_week),
      highlightColor: f.highlight_color || "#B88B4A",
      dietaryInfo: f.dietary_info || undefined,
    }));

    // Agrupa eventos por assinatura
    const eventsBySub: Record<
      string,
      { date: string; title: string; description: string }[]
    > = {};
    for (const ev of eventsRes.data || []) {
      if (!eventsBySub[ev.subscription_id]) {
        eventsBySub[ev.subscription_id] = [];
      }
      eventsBySub[ev.subscription_id].push({
        date: String(ev.created_at || "").split("T")[0],
        title: ev.title,
        description: ev.description || "",
      });
    }

    const subscriptions = (subsRes.data || []).map((s) => {
      const cust = Array.isArray(s.customers) ? s.customers[0] : s.customers;
      return {
        id: s.id,
        customerName: cust?.full_name || "Cliente",
        companyOrClinicName: cust?.company_or_clinic_name || undefined,
        email: cust?.email || "",
        whatsapp: cust?.whatsapp || "",
        document: cust?.document_cpf_cnpj || "",
        category: s.category,
        planCode: s.plan_code,
        planName: s.plan_name,
        frequency: s.frequency,
        unitsPerDelivery: s.units_per_delivery,
        period: s.period,
        monthlyValue: Number(s.monthly_value || 0),
        status: s.status,
        deliveryDay: s.delivery_day,
        deliveryShift: s.delivery_shift,
        address: s.delivery_address || cust?.address || "",
        neighborhood: s.delivery_neighborhood || cust?.neighborhood || "",
        selectedFlavorsNextDelivery: Array.isArray(
          s.selected_flavors_next_delivery
        )
          ? s.selected_flavors_next_delivery
          : [],
        favoriteStyles: Array.isArray(cust?.favorite_styles)
          ? cust.favorite_styles
          : [],
        dietaryRestrictions: cust?.dietary_restrictions || "",
        rescheduledDeliveriesCount: s.rescheduled_deliveries_count || 0,
        skippedDates: Array.isArray(s.skipped_dates) ? s.skipped_dates : [],
        completedDeliveriesCount: s.completed_deliveries_count || 0,
        planHistory: eventsBySub[s.id] || [],
        asaasSubscriptionId: s.asaas_subscription_id || undefined,
        paymentMethod: s.payment_method,
        cardLast4: s.card_last4 || undefined,
        cardBrand: s.card_brand || undefined,
        createdAt: String(s.created_at || "").split("T")[0],
        nextDeliveryDate: s.next_delivery_date || "",
        notes: s.notes || undefined,
      };
    });

    // Agrupa itens por pedido
    const itemsByOrder: Record<
      string,
      {
        flavorName: string;
        size: string;
        quantity: number;
        extraSyrup?: boolean;
      }[]
    > = {};
    for (const it of itemsRes.data || []) {
      if (!itemsByOrder[it.order_id]) {
        itemsByOrder[it.order_id] = [];
      }
      itemsByOrder[it.order_id].push({
        flavorName: it.flavor_name,
        size: it.size,
        quantity: it.quantity,
        extraSyrup: Boolean(it.extra_syrup),
      });
    }

    const allOrders = (ordersRes.data || []).map((o) => ({
      id: o.id,
      subscriptionId: o.subscription_id || undefined,
      orderType: o.order_type,
      customerName: o.customer_name,
      companyName: o.company_name || undefined,
      whatsapp: o.whatsapp,
      deliveryDate: o.delivery_date,
      deliveryDayLabel: o.delivery_day_label || "Entrega Agendada",
      shift: o.shift,
      items: itemsByOrder[o.id] || [],
      address: o.address,
      neighborhood: o.neighborhood,
      productionStatus: o.production_status,
      totalValue: Number(o.total_value || 0),
      deliveredAt: o.delivered_at
        ? new Date(o.delivered_at).toLocaleString("pt-BR")
        : undefined,
      feedbackNote: o.feedback_note || undefined,
    }));

    const weeklyDeliveries = allOrders.filter(
      (o) => o.productionStatus !== "ENTREGUE" && o.productionStatus !== "CANCELADO"
    );
    const deliveryHistory = allOrders.filter(
      (o) => o.productionStatus === "ENTREGUE"
    );

    return NextResponse.json({
      connected: true,
      officePlans,
      homePlans,
      cakeFlavors,
      subscriptions,
      weeklyDeliveries,
      deliveryHistory,
    });
  } catch (err) {
    console.error("[Supabase Sync GET]", err);
    return NextResponse.json(
      { connected: false, error: "Erro ao consultar o Supabase" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, reason: "Supabase não configurado" },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case "update_office_plan": {
        const { error } = await supabaseAdmin
          .from("subscription_plans")
          .update({
            name: payload.name,
            marketing_name: payload.marketingName,
            subtitle: payload.subtitle,
            capacity_label: payload.capacityLabel,
            units_per_delivery: payload.unitsPerWeek,
            base_monthly_price: payload.baseMonthlyPrice,
            discount_mensal: payload.discounts?.MENSAL ?? 0,
            discount_semestral: payload.discounts?.SEMESTRAL ?? 0,
            discount_anual: payload.discounts?.ANUAL ?? 0,
            features: payload.features || [],
          })
          .eq("id", payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "update_home_plan": {
        const { error } = await supabaseAdmin
          .from("subscription_plans")
          .update({
            name: payload.name,
            marketing_name: payload.marketingName,
            subtitle: payload.subtitle,
            capacity_label: payload.capacityLabel,
            units_per_delivery: payload.unitsPerDelivery,
            price_semanal: payload.basePrices?.SEMANAL ?? 0,
            price_quinzenal: payload.basePrices?.QUINZENAL ?? 0,
            discount_mensal: payload.discounts?.MENSAL ?? 0,
            discount_trimestral: payload.discounts?.TRIMESTRAL ?? 0,
            features: payload.features || [],
          })
          .eq("id", payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "upsert_flavor": {
        const { error } = await supabaseAdmin.from("cake_flavors").upsert({
          id: payload.id,
          name: payload.name,
          tag: payload.tag,
          description: payload.description,
          category: payload.category || "CLASSICO",
          price_familia: payload.priceFamilia,
          price_individual: payload.priceIndividual,
          extra_syrup_price: payload.extraSyrupPrice,
          extra_syrup_name: payload.extraSyrupName,
          available_avulso: payload.availableAvulso ?? true,
          available_subscription: payload.availableSubscription ?? true,
          is_cake_of_the_week: payload.isCakeOfTheWeek ?? false,
          highlight_color: payload.highlightColor || "#B88B4A",
          dietary_info: payload.dietaryInfo || null,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "delete_flavor": {
        const { error } = await supabaseAdmin
          .from("cake_flavors")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "register_customer": {
        const { error } = await supabaseAdmin.from("customers").upsert(
          {
            profile_id: payload.profileId || null,
            full_name: payload.name,
            email: payload.email?.toLowerCase() || null,
            whatsapp: payload.whatsapp || "",
            address: payload.address || null,
            neighborhood: payload.neighborhood || null,
            favorite_styles: payload.favoriteStyles || [],
            dietary_restrictions: payload.dietaryRestrictions || null,
          },
          { onConflict: "email" }
        );
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "create_subscription": {
        const { sub, delivery } = payload;

        // 1. Cria ou busca o cliente pelo e-mail
        let customerId: string | null = null;
        if (sub.email) {
          const { data: existingCust } = await supabaseAdmin
            .from("customers")
            .select("id")
            .ilike("email", sub.email)
            .maybeSingle();
          customerId = existingCust?.id || null;
        }

        if (customerId) {
          await supabaseAdmin
            .from("customers")
            .update({
              full_name: sub.customerName,
              company_or_clinic_name: sub.companyOrClinicName || null,
              document_cpf_cnpj: sub.document || null,
              whatsapp: sub.whatsapp,
              address: sub.address,
              neighborhood: sub.neighborhood,
              favorite_styles: sub.favoriteStyles || [],
              dietary_restrictions: sub.dietaryRestrictions || null,
            })
            .eq("id", customerId);
        } else {
          const { data: insertedCust, error: custErr } = await supabaseAdmin
            .from("customers")
            .insert({
              full_name: sub.customerName,
              company_or_clinic_name: sub.companyOrClinicName || null,
              document_cpf_cnpj: sub.document || null,
              email: sub.email?.toLowerCase() || null,
              whatsapp: sub.whatsapp,
              address: sub.address,
              neighborhood: sub.neighborhood,
              favorite_styles: sub.favoriteStyles || [],
              dietary_restrictions: sub.dietaryRestrictions || null,
            })
            .select("id")
            .single();
          if (custErr) throw custErr;
          customerId = insertedCust.id;
        }

        // 2. Insere assinatura
        const { error: subErr } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            id: sub.id,
            customer_id: customerId,
            category: sub.category,
            plan_code: sub.planCode,
            plan_name: sub.planName,
            frequency: sub.frequency,
            units_per_delivery: sub.unitsPerDelivery,
            period: sub.period,
            monthly_value: sub.monthlyValue,
            status: sub.status,
            delivery_day: sub.deliveryDay,
            delivery_shift: sub.deliveryShift,
            delivery_address: sub.address,
            delivery_neighborhood: sub.neighborhood,
            next_delivery_date: sub.nextDeliveryDate || null,
            selected_flavors_next_delivery:
              sub.selectedFlavorsNextDelivery || [],
            payment_method: sub.paymentMethod,
            asaas_subscription_id: sub.asaasSubscriptionId || null,
            card_last4: sub.cardLast4 || null,
            card_brand: sub.cardBrand || null,
            notes: sub.notes || null,
          });
        if (subErr) throw subErr;

        // 3. Insere primeira entrega programada da semana
        if (delivery) {
          const { error: ordErr } = await supabaseAdmin
            .from("delivery_orders")
            .insert({
              id: delivery.id,
              customer_id: customerId,
              subscription_id: sub.id,
              order_type: delivery.orderType,
              customer_name: delivery.customerName,
              company_name: delivery.companyName || null,
              whatsapp: delivery.whatsapp,
              address: delivery.address,
              neighborhood: delivery.neighborhood,
              delivery_date: delivery.deliveryDate,
              delivery_day_label: delivery.deliveryDayLabel,
              shift: delivery.shift,
              production_status: delivery.productionStatus || "FILA",
              total_value: delivery.totalValue,
              payment_status: "INCLUSO_ASSINATURA",
            });
          if (ordErr) throw ordErr;

          if (Array.isArray(delivery.items) && delivery.items.length > 0) {
            await supabaseAdmin.from("delivery_order_items").insert(
              delivery.items.map(
                (it: {
                  flavorName: string;
                  size: string;
                  quantity: number;
                  extraSyrup?: boolean;
                }) => ({
                  order_id: delivery.id,
                  flavor_name: it.flavorName,
                  size: it.size,
                  quantity: it.quantity,
                  extra_syrup: Boolean(it.extraSyrup),
                })
              )
            );
          }
        }

        return NextResponse.json({ ok: true });
      }

      case "update_subscription": {
        const { id, updates } = payload;
        const dbSubUpdates: Record<string, unknown> = {};
        if (updates.status !== undefined) dbSubUpdates.status = updates.status;
        if (updates.planCode !== undefined)
          dbSubUpdates.plan_code = updates.planCode;
        if (updates.planName !== undefined)
          dbSubUpdates.plan_name = updates.planName;
        if (updates.frequency !== undefined)
          dbSubUpdates.frequency = updates.frequency;
        if (updates.unitsPerDelivery !== undefined)
          dbSubUpdates.units_per_delivery = updates.unitsPerDelivery;
        if (updates.period !== undefined) dbSubUpdates.period = updates.period;
        if (updates.monthlyValue !== undefined)
          dbSubUpdates.monthly_value = updates.monthlyValue;
        if (updates.deliveryDay !== undefined)
          dbSubUpdates.delivery_day = updates.deliveryDay;
        if (updates.deliveryShift !== undefined)
          dbSubUpdates.delivery_shift = updates.deliveryShift;
        if (updates.address !== undefined)
          dbSubUpdates.delivery_address = updates.address;
        if (updates.neighborhood !== undefined)
          dbSubUpdates.delivery_neighborhood = updates.neighborhood;
        if (updates.nextDeliveryDate !== undefined)
          dbSubUpdates.next_delivery_date = updates.nextDeliveryDate;
        if (updates.rescheduledDeliveriesCount !== undefined)
          dbSubUpdates.rescheduled_deliveries_count =
            updates.rescheduledDeliveriesCount;
        if (updates.skippedDates !== undefined)
          dbSubUpdates.skipped_dates = updates.skippedDates;
        if (updates.paymentMethod !== undefined)
          dbSubUpdates.payment_method = updates.paymentMethod;
        if (updates.cardLast4 !== undefined)
          dbSubUpdates.card_last4 = updates.cardLast4;
        if (updates.cardBrand !== undefined)
          dbSubUpdates.card_brand = updates.cardBrand;
        if (updates.notes !== undefined) dbSubUpdates.notes = updates.notes;

        if (Object.keys(dbSubUpdates).length > 0) {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update(dbSubUpdates)
            .eq("id", id);
          if (error) throw error;
        }

        // Atualiza campos do cliente se vierem no updates
        const dbCustUpdates: Record<string, unknown> = {};
        if (updates.customerName !== undefined)
          dbCustUpdates.full_name = updates.customerName;
        if (updates.document !== undefined)
          dbCustUpdates.document_cpf_cnpj = updates.document;
        if (updates.email !== undefined) dbCustUpdates.email = updates.email;
        if (updates.whatsapp !== undefined)
          dbCustUpdates.whatsapp = updates.whatsapp;
        if (updates.address !== undefined)
          dbCustUpdates.address = updates.address;
        if (updates.neighborhood !== undefined)
          dbCustUpdates.neighborhood = updates.neighborhood;
        if (updates.favoriteStyles !== undefined)
          dbCustUpdates.favorite_styles = updates.favoriteStyles;
        if (updates.dietaryRestrictions !== undefined)
          dbCustUpdates.dietary_restrictions = updates.dietaryRestrictions;

        if (Object.keys(dbCustUpdates).length > 0) {
          const { data: subRow } = await supabaseAdmin
            .from("subscriptions")
            .select("customer_id")
            .eq("id", id)
            .maybeSingle();
          if (subRow?.customer_id) {
            await supabaseAdmin
              .from("customers")
              .update(dbCustUpdates)
              .eq("id", subRow.customer_id);
          }
        }

        return NextResponse.json({ ok: true });
      }

      case "create_order": {
        const order = payload;
        // Vincula ou cria cliente avulso pelo WhatsApp
        let customerId: string | null = null;
        if (order.whatsapp) {
          const { data: existing } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("whatsapp", order.whatsapp)
            .maybeSingle();
          customerId = existing?.id || null;
        }
        if (!customerId) {
          const { data: insertedCust } = await supabaseAdmin
            .from("customers")
            .insert({
              full_name: order.customerName,
              whatsapp: order.whatsapp,
              address: order.address,
              neighborhood: order.neighborhood,
              origin_note: "Pedido avulso pelo site",
            })
            .select("id")
            .single();
          customerId = insertedCust?.id || null;
        }

        const { error: ordErr } = await supabaseAdmin
          .from("delivery_orders")
          .insert({
            id: order.id,
            customer_id: customerId,
            subscription_id: order.subscriptionId || null,
            order_type: order.orderType || "AVULSO",
            customer_name: order.customerName,
            company_name: order.companyName || null,
            whatsapp: order.whatsapp,
            address: order.address,
            neighborhood: order.neighborhood,
            delivery_date: order.deliveryDate,
            delivery_day_label: order.deliveryDayLabel || "Encomenda Agendada",
            shift: order.shift,
            production_status: order.productionStatus || "FILA",
            total_value: order.totalValue,
            payment_status: "PENDENTE",
          });
        if (ordErr) throw ordErr;

        if (Array.isArray(order.items) && order.items.length > 0) {
          const { error: itemsErr } = await supabaseAdmin
            .from("delivery_order_items")
            .insert(
              order.items.map(
                (it: {
                  flavorName: string;
                  size: string;
                  quantity: number;
                  extraSyrup?: boolean;
                }) => ({
                  order_id: order.id,
                  flavor_name: it.flavorName,
                  size: it.size,
                  quantity: it.quantity,
                  extra_syrup: Boolean(it.extraSyrup),
                })
              )
            );
          if (itemsErr) throw itemsErr;
        }

        return NextResponse.json({ ok: true });
      }

      case "update_order_status": {
        const { id, productionStatus } = payload;
        const { error } = await supabaseAdmin
          .from("delivery_orders")
          .update({ production_status: productionStatus })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Ação desconhecida: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[Supabase Sync POST]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro ao salvar no Supabase",
      },
      { status: 500 }
    );
  }
}
