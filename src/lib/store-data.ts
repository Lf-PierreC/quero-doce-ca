export type PlanCategory = "OFFICE" | "HOME";
export type OfficeSize = "OFFICE_P" | "OFFICE_M" | "OFFICE_G";
export type HomeSize = "HOME_P" | "HOME_G";
export type HomeFrequency = "SEMANAL" | "QUINZENAL";
export type OfficePeriod = "MENSAL" | "SEMESTRAL" | "ANUAL";
export type HomePeriod = "MENSAL" | "TRIMESTRAL";
export type DeliveryShift = "MANHA" | "TARDE" | "NOITE";

// Incrementar sempre que alterar regras/textos padrão no código para sincronizar com o navegador automaticamente
export const STORE_DATA_VERSION = "2026-11-19-v4";

export interface PlanUpgradeEvent {
  date: string;
  title: string;
  description: string;
}


export interface OfficePlanRule {
  id: OfficeSize;
  name: string;
  marketingName: string;
  subtitle: string;
  capacityLabel: string;
  unitsPerWeek: number;
  baseMonthlyPrice: number; // R$ por mês no plano mensal
  discounts: {
    MENSAL: number; // 0%
    SEMESTRAL: number; // ex: 10%
    ANUAL: number; // ex: 18%
  };
  features: string[];
  badge?: string;
}

export interface HomePlanRule {
  id: HomeSize;
  name: string;
  marketingName: string;
  subtitle: string;
  capacityLabel: string;
  unitsPerDelivery: number;
  basePrices: {
    SEMANAL: number; // 4 entregas/mês
    QUINZENAL: number; // 2 entregas/mês
  };
  discounts: {
    MENSAL: number; // 0%
    TRIMESTRAL: number; // ex: 10%
  };
  features: string[];
  badge?: string;
}

export interface CakeFlavor {
  id: string;
  name: string;
  tag: string;
  description: string;
  category: "CLASSICO" | "ESPECIAL" | "SAZONAL";
  priceFamilia: number; // Tamanho Família (4 a 8 pessoas)
  priceIndividual: number; // Tamanho Individual (1 a 2 pessoas / Mini Bolo)
  extraSyrupPrice: number; // Potinho extra de calda (50ml)
  extraSyrupName: string;
  availableAvulso: boolean;
  availableSubscription: boolean;
  isCakeOfTheWeek: boolean;
  highlightColor: string;
  dietaryInfo?: string;
}

export interface SubscriptionRecord {
  id: string;
  customerName: string;
  companyOrClinicName?: string;
  email: string;
  whatsapp: string;
  document: string; // CPF ou CNPJ
  category: PlanCategory;
  planCode: OfficeSize | HomeSize;
  planName: string;
  frequency: "SEMANAL" | "QUINZENAL";
  unitsPerDelivery: number;
  period: OfficePeriod | HomePeriod;
  monthlyValue: number;
  status: "ATIVA" | "PAUSADA" | "ATRASADA" | "CANCELADA";
  deliveryDay: "TERCA" | "QUINTA" | "SEXTA" | "SABADO";
  deliveryShift: DeliveryShift;
  address: string;
  neighborhood: string;
  // Sabores da surpresa definidos pelo Ateliê + Preferências do Cliente
  selectedFlavorsNextDelivery: string[];
  favoriteStyles?: string[]; // ex: ["Com Chocolate", "Cítricos & Frutados", "Tradicionais da Fazenda"]
  dietaryRestrictions?: string; // ex: "Sem canela, opção zero lactose"
  rescheduledDeliveriesCount?: number; // Quantidade de entregas reagendadas/convertidas em crédito de viagem
  skippedDates?: string[]; // Datas originais que foram puladas para permitir desfazer
  completedDeliveriesCount?: number; // Total acumulado de entregas já concluídas desde o início da assinatura
  planHistory?: PlanUpgradeEvent[]; // Histórico de adesão, upgrades de plano, mudanças de ciclo/frequência
  asaasSubscriptionId?: string;
  paymentMethod: "PIX" | "CREDIT_CARD" | "BOLETO";
  cardLast4?: string;
  cardBrand?: string;
  createdAt: string;
  nextDeliveryDate: string;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  subscriptionId?: string;
  orderType: "ASSINATURA_OFFICE" | "ASSINATURA_HOME" | "AVULSO";
  customerName: string;
  companyName?: string;
  whatsapp: string;
  deliveryDate: string;
  deliveryDayLabel: string;
  shift: DeliveryShift;
  items: {
    flavorName: string;
    size: "FAMILIA" | "INDIVIDUAL" | "P_HOME" | "G_OFFICE";
    quantity: number;
    extraSyrup?: boolean;
  }[];
  address: string;
  neighborhood: string;
  productionStatus: "FILA" | "NO_FORNO" | "FINALIZADO" | "EM_ROTA" | "ENTREGUE";
  totalValue: number;
  deliveredAt?: string;
  feedbackNote?: string;
}

export const INITIAL_OFFICE_PLANS: OfficePlanRule[] = [
  {
    id: "OFFICE_P",
    name: "Office P",
    marketingName: "Cuidado Boutique",
    subtitle: "Recepção & Consultórios Compactos",
    capacityLabel: "Até 10 pessoas",
    unitsPerWeek: 1,
    baseMonthlyPrice: 239.9,
    discounts: {
      MENSAL: 0,
      SEMESTRAL: 10,
      ANUAL: 18,
    },
    features: [
      "1 Bolo Caseiro Grande toda semana (4 bolos/mês)",
      "Assado horas antes da entrega (ainda morno)",
      "Embalagem corporativa higienizada pronta para servir",
      "Nota Fiscal (NFS-e) e boleto/PIX recorrente automático",
    ],
  },
  {
    id: "OFFICE_M",
    name: "Office M",
    marketingName: "Clínica & Equipe",
    subtitle: "Clínicas Médicas, Odontológicas e Escritórios",
    capacityLabel: "De 11 a 25 pessoas",
    unitsPerWeek: 2,
    baseMonthlyPrice: 439.9,
    discounts: {
      MENSAL: 0,
      SEMESTRAL: 10,
      ANUAL: 18,
    },
    badge: "Mais Escolhido por Clínicas",
    features: [
      "2 Bolos Caseiros Grandes toda semana (8 bolos/mês)",
      "Assado horas antes da entrega (ainda morno)",
      "Embalagem corporativa higienizada pronta para servir",
      "Cada paciente e colaborador alcançado vive a experiência da sua empresa",
      "Nota Fiscal (NFS-e) e boleto/PIX recorrente automático",
    ],
  },
  {
    id: "OFFICE_G",
    name: "Office G",
    marketingName: "Corporate & Centros Médicos",
    subtitle: "Clínicas de Grande Porte e Empresas",
    capacityLabel: "Acima de 25 pessoas",
    unitsPerWeek: 3,
    baseMonthlyPrice: 619.9,
    discounts: {
      MENSAL: 0,
      SEMESTRAL: 12,
      ANUAL: 20,
    },
    features: [
      "3 Bolos Caseiros Grandes toda semana (12 bolos/mês)",
      "Assado horas antes da entrega (ainda morno)",
      "Embalagem corporativa higienizada pronta para servir",
      "Transforma o café da equipe e o acolhimento VIP",
      "Cada paciente e colaborador alcançado vive a experiência da sua empresa",
      "Atendimento dedicado via WhatsApp",
      "Nota Fiscal (NFS-e) e boleto/PIX recorrente automático",
    ],
  },
];

export const INITIAL_HOME_PLANS: HomePlanRule[] = [
  {
    id: "HOME_P",
    name: "Home P",
    marketingName: "Ritual a Dois",
    subtitle: "Para casais e pequenas famílias",
    capacityLabel: "Até 4 pessoas",
    unitsPerDelivery: 1,
    basePrices: {
      QUINZENAL: 89.9, // 2 bolos P no mês
      SEMANAL: 164.9, // 4 bolos P no mês
    },
    discounts: {
      MENSAL: 0,
      TRIMESTRAL: 10,
    },
    features: [
      "1 Unidade (Bolo Caseiro P - até 4 pessoas) por entrega",
      "Escolha entre frequência Semanal ou Quinzenal",
      "Experiência Surpresa da Chef baseada nas suas preferências de sabores",
      "Entregas Manhã, Tarde ou Noite para adoçar o seu fim de semana",
      "Vai viajar? Reagende a entrega da semana ou receba em dobro na volta",
    ],
  },
  {
    id: "HOME_G",
    name: "Home G",
    marketingName: "Mesa Cheia em Família",
    subtitle: "Para famílias maiores ou quem ama receber visitas",
    capacityLabel: "Mais de 4 pessoas (4 a 8 fatias generosas)",
    unitsPerDelivery: 1,
    basePrices: {
      QUINZENAL: 139.9, // 2 bolos G no mês
      SEMANAL: 259.9, // 4 bolos G no mês
    },
    discounts: {
      MENSAL: 0,
      TRIMESTRAL: 12,
    },
    badge: "Preferido das Famílias",
    features: [
      "1 Unidade (Bolo Caseiro G - mais de 4 pessoas) por entrega",
      "Escolha entre frequência Semanal ou Quinzenal",
      "Experiência Surpresa da Chef baseada nas suas preferências de sabores",
      "Entregas Manhã, Tarde ou Noite fresquinho saído do forno",
      "Vai viajar? Reagende a entrega da semana ou receba em dobro na volta",
    ],
  },
];

export const INITIAL_CAKE_FLAVORS: CakeFlavor[] = [
  {
    id: "cenoura-brigadeiro",
    name: "Cenoura & Brigadeiro Belga",
    tag: "O Clássico Absoluto",
    description:
      "Massa leve e macia de cenoura fresca ralada na hora, coberta com uma camada generosa de brigadeiro tradicional aveludado.",
    category: "CLASSICO",
    priceFamilia: 68.0,
    priceIndividual: 24.0,
    extraSyrupPrice: 7.0,
    extraSyrupName: "Potinho Extra de Brigadeiro Quente (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: true,
    highlightColor: "#C89F5A",
  },
  {
    id: "double-chocolate",
    name: "Double Chocolate Intenso",
    tag: "Intenso & Úmido",
    description:
      "Massa intensa e úmida de cacau 70%, finalizada com cobertura aveludada de ganache meio amargo e raspas nobres.",
    category: "ESPECIAL",
    priceFamilia: 74.0,
    priceIndividual: 26.0,
    extraSyrupPrice: 8.0,
    extraSyrupName: "Potinho Extra de Ganache Meio Amargo (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: false,
    highlightColor: "#4A2B1D",
  },
  {
    id: "fuba-goiabada",
    name: "Fubá Cremoso com Goiabada Cascão",
    tag: "Memória Afetiva",
    description:
      "Fubá artesanal moidinho na hora com toque de erva-doce opcional e pedaços generosos de goiabada cascão derretida no centro.",
    category: "CLASSICO",
    priceFamilia: 62.0,
    priceIndividual: 22.0,
    extraSyrupPrice: 6.0,
    extraSyrupName: "Potinho Extra de Calda de Goiabada Rústica (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: true,
    highlightColor: "#b45309",
  },
  {
    id: "limao-siciliano-mirtilo",
    name: "Limão Siciliano & Glacê Real",
    tag: "Queridinho dos Consultórios",
    description:
      "Massa amanteigada perfumada com raspas de limão siciliano fresco e cobertura cítrica delicada que encanta qualquer recepção.",
    category: "ESPECIAL",
    priceFamilia: 72.0,
    priceIndividual: 25.0,
    extraSyrupPrice: 7.0,
    extraSyrupName: "Potinho Extra de Coulis Cítrico (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: true,
    highlightColor: "#ca8a04",
  },
  {
    id: "laranja-calda-perfumada",
    name: "Laranja da Fazenda em Calda",
    tag: "Perfeito com Café",
    description:
      "Bolo fofíssimo regado ainda quente com calda natural de laranja Bahia e cravo suave. Sem lactose na composição.",
    category: "CLASSICO",
    priceFamilia: 59.0,
    priceIndividual: 20.0,
    extraSyrupPrice: 6.0,
    extraSyrupName: "Potinho Extra de Redução de Laranja (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: false,
    highlightColor: "#d97706",
    dietaryInfo: "Opção Zero Lactose",
  },
  {
    id: "coco-leite-condensado",
    name: "Toalha Felpuda Artesanal",
    tag: "Suave & Molhadinho",
    description:
      "Massa branca super aerada embebida em calda três leites com flocos de coco fresco queimado na finalização.",
    category: "SAZONAL",
    priceFamilia: 69.0,
    priceIndividual: 24.0,
    extraSyrupPrice: 7.0,
    extraSyrupName: "Potinho Extra de Calda Três Leites (50ml)",
    availableAvulso: true,
    availableSubscription: true,
    isCakeOfTheWeek: false,
    highlightColor: "#a16207",
  },
];

export const INITIAL_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: "SUB-1001",
    customerName: "Dra. Carolina Mendes",
    companyOrClinicName: "Clínica Dermatológica Lumina",
    email: "contato@clinicalumina.com.br",
    whatsapp: "(11) 99812-3456",
    document: "34.123.456/0001-89",
    category: "OFFICE",
    planCode: "OFFICE_M",
    planName: "Office M (11 a 25 pessoas)",
    frequency: "SEMANAL",
    unitsPerDelivery: 2,
    period: "SEMESTRAL",
    monthlyValue: 395.91,
    status: "ATIVA",
    deliveryDay: "QUINTA",
    deliveryShift: "MANHA",
    address: "Av. Vereador Narciso Yague Guimarães, 1145 - Sala 804",
    neighborhood: "Vila Partenio, Mogi das Cruzes",
    selectedFlavorsNextDelivery: [
      "Surpresa da Chef (Cítrico)",
      "Surpresa da Chef (Chocolate)",
    ],
    favoriteStyles: ["Cítricos & Frutados", "Com Chocolate & Brigadeiro"],
    dietaryRestrictions: "Nenhuma restrição",
    completedDeliveriesCount: 14,
    planHistory: [
      {
        date: "2026-08-10",
        title: "Adesão Inicial • Office P (Mensal)",
        description: "Iniciou assinatura com 1 bolo por semana na recepção.",
      },
      {
        date: "2026-09-22",
        title: "Upgrade de Plano • Office P → Office M (Semestral)",
        description:
          "Aumentou para 2 bolos grandes/semana (Recepção + Copa da Equipe) e migrou para ciclo Semestral com 10% OFF.",
      },
    ],
    asaasSubscriptionId: "sub_asaas_982341a",
    paymentMethod: "PIX",
    createdAt: "2026-08-10",
    nextDeliveryDate: "2026-11-19",
    notes: "Entregar na recepção com a secretária Fernanda até as 09h30.",
  },
  {
    id: "SUB-1002",
    customerName: "Dr. Henrique Vasconcelos",
    companyOrClinicName: "Instituto Odonto Prime",
    email: "financeiro@odontoprime.med.br",
    whatsapp: "(11) 97411-9088",
    document: "19.887.654/0001-22",
    category: "OFFICE",
    planCode: "OFFICE_P",
    planName: "Office P (Até 10 pessoas)",
    frequency: "SEMANAL",
    unitsPerDelivery: 1,
    period: "ANUAL",
    monthlyValue: 196.72,
    status: "ATIVA",
    deliveryDay: "TERCA",
    deliveryShift: "TARDE",
    address: "Rua Barão de Jaceguai, 780 - Conj 32",
    neighborhood: "Centro, Mogi das Cruzes",
    selectedFlavorsNextDelivery: ["Surpresa da Chef (Fubá & Goiabada)"],
    favoriteStyles: ["Tradicionais da Fazenda", "Cítricos & Frutados"],
    dietaryRestrictions: "Evitar coberturas escuras de chocolate",
    completedDeliveriesCount: 19,
    planHistory: [
      {
        date: "2026-07-04",
        title: "Adesão Inicial • Office P (Semestral)",
        description: "Contratou 1 bolo grande toda terça-feira à tarde.",
      },
      {
        date: "2026-10-01",
        title: "Upgrade de Fidelidade • Semestral → Anual",
        description: "Renovou antecipadamente para o contrato Anual (18% OFF).",
      },
    ],
    asaasSubscriptionId: "sub_asaas_771290b",
    paymentMethod: "BOLETO",
    createdAt: "2026-07-04",
    nextDeliveryDate: "2026-11-17",
    notes: "Preferem bolos sem cobertura de chocolate para não manchar alinhadores.",
  },
  {
    id: "SUB-1003",
    customerName: "Beatriz Alencar",
    email: "bia.alencar@gmail.com",
    whatsapp: "(11) 98234-1102",
    document: "389.112.448-09",
    category: "HOME",
    planCode: "HOME_G",
    planName: "Home G (Mais de 4 pessoas)",
    frequency: "SEMANAL",
    unitsPerDelivery: 1,
    period: "TRIMESTRAL",
    monthlyValue: 228.71,
    status: "ATIVA",
    deliveryDay: "SEXTA",
    deliveryShift: "NOITE",
    address: "Condomínio Aruã Brisas, Alameda das Orquídeas, 210",
    neighborhood: "Aruã, Mogi das Cruzes",
    selectedFlavorsNextDelivery: ["Surpresa da Chef (Cenoura & Brigadeiro)"],
    favoriteStyles: ["Com Chocolate & Brigadeiro", "Tradicionais da Fazenda"],
    dietaryRestrictions: "Não gosta de erva-doce",
    completedDeliveriesCount: 9,
    planHistory: [
      {
        date: "2026-09-15",
        title: "Adesão Inicial • Home P (Quinzenal)",
        description: "Começou com bolo pequeno a cada 15 dias.",
      },
      {
        date: "2026-10-12",
        title: "Upgrade de Tamanho e Frequência • Home P → Home G (Semanal)",
        description:
          "Família adorou e subiu para Home G toda sexta-feira à noite no plano Trimestral.",
      },
    ],
    asaasSubscriptionId: "sub_asaas_554120c",
    paymentMethod: "CREDIT_CARD",
    cardLast4: "4829",
    cardBrand: "Mastercard",
    createdAt: "2026-09-15",
    nextDeliveryDate: "2026-11-20",
    notes: "Entregar no período noturno após as 18h30 ou deixar na portaria.",
  },
  {
    id: "SUB-1004",
    customerName: "Mariana & Thiago Costa",
    email: "mari.costa@outlook.com",
    whatsapp: "(11) 99120-5567",
    document: "412.890.338-12",
    category: "HOME",
    planCode: "HOME_P",
    planName: "Home P (Até 4 pessoas)",
    frequency: "QUINZENAL",
    unitsPerDelivery: 1,
    period: "MENSAL",
    monthlyValue: 89.9,
    status: "ATIVA",
    deliveryDay: "SABADO",
    deliveryShift: "MANHA",
    address: "Rua Doutor Ricardo Vilela, 1420 - Apto 121",
    neighborhood: "Parque Monte Líbano, Mogi das Cruzes",
    selectedFlavorsNextDelivery: ["Surpresa da Chef (Double Chocolate)"],
    favoriteStyles: ["Com Chocolate & Brigadeiro"],
    completedDeliveriesCount: 4,
    planHistory: [
      {
        date: "2026-10-01",
        title: "Adesão Inicial • Home P (Quinzenal • Mensal)",
        description: "Convertidos após comprarem 1 bolo avulso no fim de semana.",
      },
    ],
    asaasSubscriptionId: "sub_asaas_339012d",
    paymentMethod: "PIX",
    createdAt: "2026-10-01",
    nextDeliveryDate: "2026-11-21",
  },
  {
    id: "SUB-1005",
    customerName: "Espaço Saúde Integrada Viva",
    companyOrClinicName: "Clínica Viva Multidisciplinar",
    email: "gestao@espacoviva.com.br",
    whatsapp: "(11) 96543-8890",
    document: "45.678.912/0001-05",
    category: "OFFICE",
    planCode: "OFFICE_G",
    planName: "Office G (Acima de 25 pessoas)",
    frequency: "SEMANAL",
    unitsPerDelivery: 3,
    period: "ANUAL",
    monthlyValue: 495.92,
    status: "ATIVA",
    deliveryDay: "SEXTA",
    deliveryShift: "MANHA",
    address: "Av. Capitão Manoel Rudge, 910",
    neighborhood: "Vila Oliveira, Mogi das Cruzes",
    selectedFlavorsNextDelivery: [
      "Cenoura & Brigadeiro Belga",
      "Laranja da Fazenda em Calda",
      "Fubá Cremoso com Goiabada Cascão",
    ],
    favoriteStyles: [
      "Com Chocolate & Brigadeiro",
      "Cítricos & Frutados",
      "Tradicionais da Fazenda",
    ],
    completedDeliveriesCount: 22,
    planHistory: [
      {
        date: "2026-06-20",
        title: "Adesão Inicial • Office M (Semestral)",
        description: "Iniciou com 2 bolos grandes às sextas-feiras.",
      },
      {
        date: "2026-08-05",
        title: "Upgrade Corporativo • Office M → Office G (Anual)",
        description:
          "Expandiu para 3 bolos grandes/semana para atender nova ala da clínica.",
      },
    ],
    asaasSubscriptionId: "sub_asaas_112098e",
    paymentMethod: "BOLETO",
    createdAt: "2026-06-20",
    nextDeliveryDate: "2026-11-20",
    notes: "Café de sexta-feira com 32 funcionários e pacientes VIP.",
  },
];

export const INITIAL_WEEKLY_DELIVERIES: DeliveryOrder[] = [
  {
    id: "PED-801",
    subscriptionId: "SUB-1002",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Dr. Henrique Vasconcelos",
    companyName: "Instituto Odonto Prime",
    whatsapp: "(11) 97411-9088",
    deliveryDate: "2026-11-17",
    deliveryDayLabel: "Terça-feira",
    shift: "TARDE",
    items: [
      {
        flavorName: "Fubá Cremoso com Goiabada Cascão",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Rua Barão de Jaceguai, 780 - Conj 32",
    neighborhood: "Centro",
    productionStatus: "NO_FORNO",
    totalValue: 49.18,
  },
  {
    id: "PED-802",
    subscriptionId: "SUB-1001",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Dra. Carolina Mendes",
    companyName: "Clínica Dermatológica Lumina",
    whatsapp: "(11) 99812-3456",
    deliveryDate: "2026-11-19",
    deliveryDayLabel: "Quinta-feira",
    shift: "MANHA",
    items: [
      {
        flavorName: "Limão Siciliano & Glacê Real",
        size: "G_OFFICE",
        quantity: 1,
      },
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Av. Vereador Narciso Yague Guimarães, 1145 - Sala 804",
    neighborhood: "Vila Partenio",
    productionStatus: "FILA",
    totalValue: 98.98,
  },
  {
    id: "PED-803",
    subscriptionId: "SUB-1005",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Espaço Saúde Integrada Viva",
    companyName: "Clínica Viva Multidisciplinar",
    whatsapp: "(11) 96543-8890",
    deliveryDate: "2026-11-20",
    deliveryDayLabel: "Sexta-feira",
    shift: "MANHA",
    items: [
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "G_OFFICE",
        quantity: 1,
      },
      {
        flavorName: "Laranja da Fazenda em Calda",
        size: "G_OFFICE",
        quantity: 1,
      },
      {
        flavorName: "Fubá Cremoso com Goiabada Cascão",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Av. Capitão Manoel Rudge, 910",
    neighborhood: "Vila Oliveira",
    productionStatus: "FILA",
    totalValue: 123.98,
  },
  {
    id: "PED-804",
    subscriptionId: "SUB-1003",
    orderType: "ASSINATURA_HOME",
    customerName: "Beatriz Alencar",
    whatsapp: "(11) 98234-1102",
    deliveryDate: "2026-11-20",
    deliveryDayLabel: "Sexta-feira",
    shift: "NOITE",
    items: [
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "FAMILIA",
        quantity: 1,
        extraSyrup: true,
      },
    ],
    address: "Condomínio Aruã Brisas, Alameda das Orquídeas, 210",
    neighborhood: "Aruã",
    productionStatus: "FILA",
    totalValue: 57.18,
  },
  {
    id: "PED-805",
    orderType: "AVULSO",
    customerName: "Fernanda Toledo (Paciente Clínica Lumina)",
    whatsapp: "(11) 98877-1234",
    deliveryDate: "2026-11-20",
    deliveryDayLabel: "Sexta-feira",
    shift: "TARDE",
    items: [
      {
        flavorName: "Limão Siciliano & Glacê Real",
        size: "FAMILIA",
        quantity: 1,
        extraSyrup: true,
      },
      {
        flavorName: "Double Chocolate Intenso",
        size: "INDIVIDUAL",
        quantity: 2,
      },
    ],
    address: "Rua Presidente Campos Salles, 450",
    neighborhood: "Vila Industrial",
    productionStatus: "FILA",
    totalValue: 131.0,
  },
];

// Histórico de Entregas Já Realizadas (Semanas Anteriores + Compras Avulsas Passadas vinculadas aos clientes)
export const INITIAL_DELIVERY_HISTORY: DeliveryOrder[] = [
  {
    id: "PED-794",
    subscriptionId: "SUB-1005",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Espaço Saúde Integrada Viva",
    companyName: "Clínica Viva Multidisciplinar",
    whatsapp: "(11) 96543-8890",
    deliveryDate: "2026-11-13",
    deliveryDayLabel: "Sexta-feira",
    shift: "MANHA",
    items: [
      {
        flavorName: "Limão Siciliano & Glacê Real",
        size: "G_OFFICE",
        quantity: 2,
      },
      {
        flavorName: "Toalha Felpuda Artesanal",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Av. Capitão Manoel Rudge, 910",
    neighborhood: "Vila Oliveira",
    productionStatus: "ENTREGUE",
    totalValue: 123.98,
    deliveredAt: "13/11/2026 às 08h45",
    feedbackNote: "Recebido pela gerente administrativa Carla. Elogiaram muito o bolo de limão!",
  },
  {
    id: "PED-793",
    subscriptionId: "SUB-1003",
    orderType: "ASSINATURA_HOME",
    customerName: "Beatriz Alencar",
    whatsapp: "(11) 98234-1102",
    deliveryDate: "2026-11-13",
    deliveryDayLabel: "Sexta-feira",
    shift: "NOITE",
    items: [
      {
        flavorName: "Double Chocolate Intenso",
        size: "FAMILIA",
        quantity: 1,
        extraSyrup: true,
      },
    ],
    address: "Condomínio Aruã Brisas, Alameda das Orquídeas, 210",
    neighborhood: "Aruã",
    productionStatus: "ENTREGUE",
    totalValue: 57.18,
    deliveredAt: "13/11/2026 às 19h10",
    feedbackNote: "Entregue em mãos no período noturno.",
  },
  {
    id: "PED-792",
    subscriptionId: "SUB-1001",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Dra. Carolina Mendes",
    companyName: "Clínica Dermatológica Lumina",
    whatsapp: "(11) 99812-3456",
    deliveryDate: "2026-11-12",
    deliveryDayLabel: "Quinta-feira",
    shift: "MANHA",
    items: [
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "G_OFFICE",
        quantity: 1,
      },
      {
        flavorName: "Laranja da Fazenda em Calda",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Av. Vereador Narciso Yague Guimarães, 1145 - Sala 804",
    neighborhood: "Vila Partenio",
    productionStatus: "ENTREGUE",
    totalValue: 98.98,
    deliveredAt: "12/11/2026 às 09h15",
    feedbackNote: "Entregue na recepção para a secretária Fernanda.",
  },
  {
    id: "PED-790",
    subscriptionId: "SUB-1001",
    orderType: "AVULSO",
    customerName: "Dra. Carolina Mendes",
    companyName: "Clínica Dermatológica Lumina",
    whatsapp: "(11) 99812-3456",
    deliveryDate: "2026-11-06",
    deliveryDayLabel: "Sexta-feira (Pedido Extra Avulso)",
    shift: "TARDE",
    items: [
      {
        flavorName: "Double Chocolate Intenso",
        size: "FAMILIA",
        quantity: 1,
        extraSyrup: true,
      },
    ],
    address: "Av. Vereador Narciso Yague Guimarães, 1145 - Sala 804",
    neighborhood: "Vila Partenio",
    productionStatus: "ENTREGUE",
    totalValue: 82.0,
    deliveredAt: "06/11/2026 às 14h30",
    feedbackNote: "Compra avulsa extra para comemorar aniversário da equipe da clínica.",
  },
  {
    id: "PED-789",
    subscriptionId: "SUB-1002",
    orderType: "ASSINATURA_OFFICE",
    customerName: "Dr. Henrique Vasconcelos",
    companyName: "Instituto Odonto Prime",
    whatsapp: "(11) 97411-9088",
    deliveryDate: "2026-11-10",
    deliveryDayLabel: "Terça-feira",
    shift: "TARDE",
    items: [
      {
        flavorName: "Limão Siciliano & Glacê Real",
        size: "G_OFFICE",
        quantity: 1,
      },
    ],
    address: "Rua Barão de Jaceguai, 780 - Conj 32",
    neighborhood: "Centro",
    productionStatus: "ENTREGUE",
    totalValue: 49.18,
    deliveredAt: "10/11/2026 às 14h05",
  },
  {
    id: "PED-788",
    subscriptionId: "SUB-1004",
    orderType: "ASSINATURA_HOME",
    customerName: "Mariana & Thiago Costa",
    whatsapp: "(11) 99120-5567",
    deliveryDate: "2026-11-07",
    deliveryDayLabel: "Sábado",
    shift: "MANHA",
    items: [
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "P_HOME",
        quantity: 1,
      },
    ],
    address: "Rua Doutor Ricardo Vilela, 1420 - Apto 121",
    neighborhood: "Parque Monte Líbano",
    productionStatus: "ENTREGUE",
    totalValue: 44.95,
    deliveredAt: "07/11/2026 às 09h40",
  },
  {
    id: "PED-785",
    orderType: "AVULSO",
    customerName: "Juliana Pires",
    whatsapp: "(11) 99341-7782",
    deliveryDate: "2026-11-14",
    deliveryDayLabel: "Sábado",
    shift: "MANHA",
    items: [
      {
        flavorName: "Cenoura & Brigadeiro Belga",
        size: "FAMILIA",
        quantity: 1,
        extraSyrup: true,
      },
    ],
    address: "Rua Coronel Cardoso de Siqueira, 890",
    neighborhood: "Vila Oliveira",
    productionStatus: "ENTREGUE",
    totalValue: 75.0,
    deliveredAt: "14/11/2026 às 10h20",
    feedbackNote: "Segunda compra avulsa no mês. Ótima candidata para assinar Plano Home.",
  },
];

// =========================================================================
// REGRAS DE ÁREA DE ENTREGA & FRETE REGIONAL (TRAVA POR CEP / VIACEP)
// =========================================================================
export interface DeliveryCityRule {
  id: string;
  city: string;
  state: string; // ex: "SP"
  enabled: boolean; // true = entrega permitida; false = bloqueio educado
  feePerDelivery: number; // R$ adicional por entrega (0 = frete grátis/incluso)
  isPrimary?: boolean; // Mogi das Cruzes
}

export const INITIAL_DELIVERY_ZONES: DeliveryCityRule[] = [
  {
    id: "mogi-das-cruzes",
    city: "Mogi das Cruzes",
    state: "SP",
    enabled: true,
    feePerDelivery: 0,
    isPrimary: true,
  },
  {
    id: "suzano",
    city: "Suzano",
    state: "SP",
    enabled: false,
    feePerDelivery: 15,
  },
  {
    id: "poa",
    city: "Poá",
    state: "SP",
    enabled: false,
    feePerDelivery: 18,
  },
  {
    id: "guararema",
    city: "Guararema",
    state: "SP",
    enabled: false,
    feePerDelivery: 20,
  },
  {
    id: "ferraz-de-vasconcelos",
    city: "Ferraz de Vasconcelos",
    state: "SP",
    enabled: false,
    feePerDelivery: 20,
  },
  {
    id: "biritiba-mirim",
    city: "Biritiba-Mirim",
    state: "SP",
    enabled: false,
    feePerDelivery: 18,
  },
  {
    id: "aruja",
    city: "Arujá",
    state: "SP",
    enabled: false,
    feePerDelivery: 22,
  },
  {
    id: "itaquaquecetuba",
    city: "Itaquaquecetuba",
    state: "SP",
    enabled: false,
    feePerDelivery: 22,
  },
];

export function normalizeCityName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function findDeliveryZone(
  zones: DeliveryCityRule[],
  city: string,
  state?: string
): DeliveryCityRule | undefined {
  const normCity = normalizeCityName(city);
  const normState = (state || "SP").trim().toUpperCase();
  return zones.find(
    (z) =>
      normalizeCityName(z.city) === normCity &&
      z.state.trim().toUpperCase() === normState
  );
}

export interface ViaCepResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCepViaCep(
  rawCep: string
): Promise<ViaCepResult | null> {
  const digits = rawCep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      cep: data.cep || digits,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch {
    return null;
  }
}


