"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, RotateCcw, Lock, LogOut } from "lucide-react";
import { usePortalStore } from "@/lib/store-context";
import {
  CakeFlavor,
  DeliveryOrder,
  SubscriptionRecord,
} from "@/lib/store-data";

type AdminTab =
  | "FINANCEIRO"
  | "PRODUCAO_ENTREGAS"
  | "HISTORICO_ENTREGAS"
  | "ASSINATURAS"
  | "REGRAS_PLANOS"
  | "CARDAPIO_BOLOS";

export default function AdminDashboardPage() {
  const {
    officePlans,
    homePlans,
    cakeFlavors,
    subscriptions,
    weeklyDeliveries,
    deliveryHistory,
    deliveryZones,
    currentUser,
    logout,
    updateOfficePlan,
    updateHomePlan,
    updateCakeFlavor,
    addCakeFlavor,
    deleteCakeFlavor,
    updateDeliveryZone,
    addDeliveryZone,
    deleteDeliveryZone,
    updateSubscriptionStatus,
    updateDeliveryStatus,
    resetToDefaults,
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("FINANCEIRO");
  const [filterSubCategory, setFilterSubCategory] = useState<
    "TODOS" | "OFFICE" | "HOME" | "AVULSOS"
  >("TODOS");
  const [filterHistoryType, setFilterHistoryType] = useState<
    "TODOS" | "ASSINATURA_OFFICE" | "ASSINATURA_HOME" | "AVULSO"
  >("TODOS");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [promoSentMap, setPromoSentMap] = useState<Record<string, boolean>>({});
  const [newZoneCity, setNewZoneCity] = useState("");
  const [newZoneFee, setNewZoneFee] = useState("20");

  // Refs e Estados dos Modais de Visão Detalhada (Entrega e Cliente)
  const deliveryModalRef = useRef<HTMLDialogElement>(null);
  const clientModalRef = useRef<HTMLDialogElement>(null);
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryOrder | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriptionRecord | null>(null);
  const [selectedAvulsoLeadId, setSelectedAvulsoLeadId] = useState<
    string | null
  >(null);

  // Novo sabor de bolo
  const [newFlavorName, setNewFlavorName] = useState("");
  const [newFlavorTag, setNewFlavorTag] = useState("Receita Autoral");
  const [newFlavorDesc, setNewFlavorDesc] = useState("");
  const [newPriceFamilia, setNewPriceFamilia] = useState("68");
  const [newPriceIndividual, setNewPriceIndividual] = useState("24");
  const [newSyrupPrice, setNewSyrupPrice] = useState("7");
  const [newSyrupName, setNewSyrupName] = useState(
    "Potinho Extra de Calda Artesanal (50ml)"
  );

  // Proteção de Rota: Somente o login de Administradora tem acesso ao Painel Admin
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl bg-[#FFFDFB] border border-[#EBDAD3] p-10 space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#FAF6F2] border border-[#EBDAD3] flex items-center justify-center mx-auto text-[#B88B4A]">
            <Lock className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B88B4A] block">
            Acesso Restrito à Administração
          </span>
          <h1 className="font-serif-title text-3xl font-normal text-[#3E2418]">
            Área Exclusiva do Ateliê
          </h1>
          <p className="text-xs text-[#75584B] font-light leading-relaxed">
            Esta seção de gestão financeira, fornadas e regras de planos é
            visível apenas para o login de administradora (
            <strong className="font-medium text-[#3E2418]">
              admin@querodoceca.com.br
            </strong>
            ).
          </p>
          <div className="pt-2">
            <Link
              href="/minha-conta"
              className="inline-block rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-8 py-3.5 text-xs uppercase tracking-[0.2em] transition"
            >
              Fazer Login de Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  // =========================================================================
  // INDICADORES FINANCEIROS, DE ASSINANTES, CLIENTES AVULSOS E ENTREGAS
  // =========================================================================
  const activeSubs = subscriptions.filter((s) => s.status === "ATIVA");
  const activeOfficeSubs = activeSubs.filter((s) => s.category === "OFFICE");
  const activeHomeSubs = activeSubs.filter((s) => s.category === "HOME");

  const mrrOffice = activeOfficeSubs.reduce(
    (acc, s) => acc + s.monthlyValue,
    0
  );
  const mrrHome = activeHomeSubs.reduce((acc, s) => acc + s.monthlyValue, 0);
  const totalMrr = mrrOffice + mrrHome;

  const avulsoOrdersThisWeek = weeklyDeliveries.filter(
    (d) => d.orderType === "AVULSO"
  );
  const avulsoRevenueWeek = avulsoOrdersThisWeek.reduce(
    (acc, d) => acc + d.totalValue,
    0
  );
  const projectedMonthlyTotal = totalMrr + avulsoRevenueWeek * 4;
  const averageTicket =
    activeSubs.length > 0 ? totalMrr / activeSubs.length : 0;

  // Mapa de Produção da Semana & Total de Bolos
  const bakingSummary: Record<
    string,
    { total: number; officeG: number; familia: number; individual: number }
  > = {};

  let totalCakesThisWeek = 0;
  let totalOfficeCakesWeek = 0;
  let totalFamiliaCakesWeek = 0;
  let totalIndividualCakesWeek = 0;

  weeklyDeliveries.forEach((order) => {
    order.items.forEach((item) => {
      if (!bakingSummary[item.flavorName]) {
        bakingSummary[item.flavorName] = {
          total: 0,
          officeG: 0,
          familia: 0,
          individual: 0,
        };
      }
      bakingSummary[item.flavorName].total += item.quantity;
      totalCakesThisWeek += item.quantity;

      if (item.size === "G_OFFICE") {
        bakingSummary[item.flavorName].officeG += item.quantity;
        totalOfficeCakesWeek += item.quantity;
      } else if (item.size === "INDIVIDUAL") {
        bakingSummary[item.flavorName].individual += item.quantity;
        totalIndividualCakesWeek += item.quantity;
      } else {
        bakingSummary[item.flavorName].familia += item.quantity;
        totalFamiliaCakesWeek += item.quantity;
      }
    });
  });

  // Indicadores de Entregas da Semana
  const totalDeliveriesWeek = weeklyDeliveries.length;
  const deliveriesOfficeCount = weeklyDeliveries.filter(
    (d) => d.orderType === "ASSINATURA_OFFICE"
  ).length;
  const deliveriesHomeCount = weeklyDeliveries.filter(
    (d) => d.orderType === "ASSINATURA_HOME"
  ).length;
  const deliveriesAvulsoCount = avulsoOrdersThisWeek.length;

  const deliveriesInQueue = weeklyDeliveries.filter(
    (d) => d.productionStatus === "FILA"
  ).length;
  const deliveriesInOven = weeklyDeliveries.filter(
    (d) => d.productionStatus === "NO_FORNO"
  ).length;
  const deliveriesReadyOrDone = weeklyDeliveries.filter((d) =>
    ["FINALIZADO", "EM_ROTA", "ENTREGUE"].includes(d.productionStatus)
  ).length;

  // Distribuição de Assinantes por Ciclo e Pagamento
  const cycleCounts = {
    ANUAL: activeSubs.filter((s) => s.period === "ANUAL").length,
    SEMESTRAL: activeSubs.filter((s) => s.period === "SEMESTRAL").length,
    TRIMESTRAL: activeSubs.filter((s) => s.period === "TRIMESTRAL").length,
    MENSAL: activeSubs.filter((s) => s.period === "MENSAL").length,
  };

  const paymentCounts = {
    PIX: activeSubs.filter((s) => s.paymentMethod === "PIX").length,
    BOLETO: activeSubs.filter((s) => s.paymentMethod === "BOLETO").length,
    CREDIT_CARD: activeSubs.filter((s) => s.paymentMethod === "CREDIT_CARD")
      .length,
  };

  // Base Unificada de Clientes Avulsos (extraídos dos pedidos avulsos + leads cadastrados que ainda não assinaram)
  interface AvulsoCustomerLead {
    id: string;
    customerName: string;
    whatsapp: string;
    neighborhood: string;
    address: string;
    lastOrderDate: string;
    lastFlavors: string[];
    totalSpentAvulso: number;
    ordersCount: number;
    originNote: string;
  }

  const avulsoLeadsMap: Record<string, AvulsoCustomerLead> = {
    "LEAD-AVULSO-1": {
      id: "CLI-AV01",
      customerName: "Juliana Pires",
      whatsapp: "(11) 99341-7782",
      neighborhood: "Vila Oliveira",
      address: "Rua Coronel Cardoso de Siqueira, 890",
      lastOrderDate: "2026-11-14",
      lastFlavors: ["Cenoura & Brigadeiro Belga (Tamanho Família)"],
      totalSpentAvulso: 75.0,
      ordersCount: 2,
      originNote: "Comprou 2x avulso no mês • Alta chance de assinar Home G",
    },
  };

  avulsoOrdersThisWeek.forEach((order, idx) => {
    const key = order.whatsapp || `AV-${idx}`;
    const flavorsList = order.items.map(
      (i) => `${i.quantity}x ${i.flavorName} (${i.size})`
    );
    if (avulsoLeadsMap[key]) {
      avulsoLeadsMap[key].totalSpentAvulso += order.totalValue;
      avulsoLeadsMap[key].ordersCount += 1;
      avulsoLeadsMap[key].lastFlavors = flavorsList;
    } else {
      avulsoLeadsMap[key] = {
        id: `CLI-AV0${idx + 2}`,
        customerName: order.customerName,
        whatsapp: order.whatsapp,
        neighborhood: order.neighborhood,
        address: order.address,
        lastOrderDate: order.deliveryDate,
        lastFlavors: flavorsList,
        totalSpentAvulso: order.totalValue,
        ordersCount: 1,
        originNote: "Conheceu no consultório parceiro e pediu bolo avulso",
      };
    }
  });

  const avulsoCustomerLeads = Object.values(avulsoLeadsMap);
  const totalClientsAll = subscriptions.length + avulsoCustomerLeads.length;

  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return "-";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const openDeliveryDetailModal = (del: DeliveryOrder) => {
    setSelectedDelivery(del);
    deliveryModalRef.current?.showModal();
  };

  const openSubscriberDetailModal = (sub: SubscriptionRecord) => {
    setSelectedSubscriber(sub);
    setSelectedAvulsoLeadId(null);
    clientModalRef.current?.showModal();
  };

  const openAvulsoLeadDetailModal = (leadId: string) => {
    setSelectedSubscriber(null);
    setSelectedAvulsoLeadId(leadId);
    clientModalRef.current?.showModal();
  };

  // Combina o histórico consolidado com entregas da semana que já foram marcadas como ENTREGUE
  const allCompletedDeliveries: DeliveryOrder[] = [
    ...weeklyDeliveries.filter(
      (d) =>
        d.productionStatus === "ENTREGUE" &&
        !deliveryHistory.some((h) => h.id === d.id)
    ),
    ...deliveryHistory,
  ];

  const totalHistoricCakesCount = allCompletedDeliveries.reduce(
    (acc, order) =>
      acc + order.items.reduce((sum, it) => sum + it.quantity, 0),
    0
  );

  const totalHistoricValue = allCompletedDeliveries.reduce(
    (acc, order) => acc + order.totalValue,
    0
  );

  const buildWhatsAppPromoUrl = (lead: AvulsoCustomerLead) => {
    const cleanPhone = lead.whatsapp.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const firstName = lead.customerName.split(" ")[0];
    const msg = encodeURIComponent(
      `Olá, ${firstName}! Tudo bem? Aqui é da Quero Doce Ca 🍰 Vimos que você adorou nosso bolo avulso (${lead.lastFlavors[0]}) e preparamos um convite especial: assinando nosso Plano Home (Semanal ou Quinzenal), você garante a Surpresa da Chef com até 20% de desconto + potinho de calda cortesia na estreia! Vamos ativar o seu?`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  const handleAddFlavorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlavorName.trim()) return;
    const id = newFlavorName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    const flavor: CakeFlavor = {
      id: `${id}-${Date.now().toString().slice(-3)}`,
      name: newFlavorName,
      tag: newFlavorTag,
      description: newFlavorDesc || "Receita autoral assada no dia.",
      category: "ESPECIAL",
      priceFamilia: Number(newPriceFamilia) || 68,
      priceIndividual: Number(newPriceIndividual) || 24,
      extraSyrupPrice: Number(newSyrupPrice) || 7,
      extraSyrupName: newSyrupName,
      availableAvulso: true,
      availableSubscription: true,
      isCakeOfTheWeek: true,
      highlightColor: "#B88B4A",
    };

    addCakeFlavor(flavor);
    setNewFlavorName("");
    setNewFlavorDesc("");
    showToast(`Sabor "${flavor.name}" adicionado ao cardápio.`);
  };

  return (
    /* Fundo exclusivo do Painel Admin — altere --admin-fundo no globals.css ou troque a classe abaixo */
    <div className="min-h-screen w-full bg-[var(--admin-fundo)] -mb-28 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* CABEÇALHO DO ATELIÊ (ADMIN) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-8 border-b border-[#EBDAD3]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A] block mb-2 break-all sm:break-normal">
            Gestão • Quero Doce Ca ({currentUser.email})
          </span>
          <h1 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#3E2418]">
            Financeiro, Fornadas & Clientes
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              resetToDefaults();
              showToast("Dados restaurados para a configuração inicial.");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#EBDAD3] bg-[#FFFDFB] hover:border-[#D5A8A0] text-[#75584B] hover:text-[#3E2418] px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.15em] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrão
          </button>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-[#EBDAD3] bg-[#FFFDFB] hover:border-[#D5A8A0] text-[#75584B] hover:text-[#3E2418] px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.15em] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do Admin
          </button>
        </div>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="rounded-2xl bg-[#F4E6E2] border border-[#D5A8A0] px-5 py-3.5 text-xs text-[#3E2418]"
        >
          {savedNotice}
        </div>
      )}

      {/* NAVEGAÇÃO EM ABAS MINIMALISTA (modern-web-guidance: tabs) */}
      <div
        role="tablist"
        aria-label="Módulos de Gestão Administrativa"
        className="flex overflow-x-auto gap-6 sm:gap-8 border-b border-[#EBDAD3]"
      >
        {[
          { id: "FINANCEIRO" as AdminTab, label: "Visão Financeira" },
          {
            id: "PRODUCAO_ENTREGAS" as AdminTab,
            label: `Entregas da Semana (${totalDeliveriesWeek})`,
          },
          {
            id: "HISTORICO_ENTREGAS" as AdminTab,
            label: `Hist. Entregas (${allCompletedDeliveries.length})`,
          },
          {
            id: "ASSINATURAS" as AdminTab,
            label: `Clientes (${totalClientsAll})`,
          },
          {
            id: "REGRAS_PLANOS" as AdminTab,
            label: "Planos",
          },
          {
            id: "CARDAPIO_BOLOS" as AdminTab,
            label: "Cardápio & Preços",
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xs uppercase tracking-[0.18em] whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? "text-[#3E2418] font-medium"
                  : "text-[#75584B] hover:text-[#3E2418]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          ABA 1: VISÃO FINANCEIRA & INDICADORES DE ASSINANTES E ENTREGAS
         ==================================================================== */}
      {activeTab === "FINANCEIRO" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-FINANCEIRO"
          className="space-y-8 sm:space-y-10"
        >
          {/* Linha 1: KPIs Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <div className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-2">
                Receita Recorrente
              </span>
              <p className="text-3xl font-light text-[#3E2418] whitespace-nowrap">
                R$ {totalMrr.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {activeSubs.length} assinaturas ativas
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-2">
                Plano Office (Empresas)
              </span>
              <p className="text-3xl font-light text-[#3E2418] whitespace-nowrap">
                R$ {mrrOffice.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {activeOfficeSubs.length} clínicas/empresas ativas
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-2">
                Plano Home (Em Casa)
              </span>
              <p className="text-3xl font-light text-[#3E2418] whitespace-nowrap">
                R$ {mrrHome.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {activeHomeSubs.length} famílias assinantes
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-2">
                Projeção Mensal Total
              </span>
              <p className="text-3xl font-light text-[#3E2418] whitespace-nowrap">
                R$ {projectedMonthlyTotal.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Ticket médio: R$ {averageTicket.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          {/* Linha 2: Novos Indicadores de Assinantes, Clientes Avulsos e Entregas da Semana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total de Assinantes
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-light text-[#3E2418]">
                  {activeSubs.length}
                </p>
                <span className="text-xs text-[#75584B]">contratos</span>
              </div>
              <p className="text-[14px] text-[#75584B] font-light mt-1">
                {activeOfficeSubs.length} Office • {activeHomeSubs.length} Home
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Clientes Avulsos
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-light text-[#3E2418]">
                  {avulsoCustomerLeads.length}
                </p>
                <span className="text-xs text-[#75584B]">clientes</span>
              </div>
              <p className="text-[14px] text-[#75584B] font-light mt-1">
                R$ {avulsoRevenueWeek.toFixed(2).replace(".", ",")} na semana
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total Entregas da Semana
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-light text-[#3E2418]">
                  {totalDeliveriesWeek}
                </p>
                <span className="text-xs text-[#75584B]">entregas</span>
              </div>
              <p className="text-[14px] text-[#75584B] font-light mt-1">
                {deliveriesOfficeCount} Office • {deliveriesHomeCount} Home •{" "}
                {deliveriesAvulsoCount} Avulsa
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total Bolos na semana
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-light text-[#3E2418]">
                  {totalCakesThisWeek}
                </p>
                <span className="text-xs text-[#75584B]">unidades</span>
              </div>
              <p className="text-[14px] text-[#75584B] font-light mt-1">
                {totalOfficeCakesWeek} G Office • {totalFamiliaCakesWeek}{" "}
                Família • {totalIndividualCakesWeek} Indiv.
              </p>
            </div>
          </div>

          {/* Linha 3: Visualizações Gráficas de Receita e Resumo da Cozinha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-7 rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-6">
              <div>
                <h2 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Receitas por Modalidade
                </h2>
                <p className="text-xs text-[#75584B] font-light">
                  Distribuição do faturamento mensal previsto.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-baseline justify-between gap-3 text-xs text-[#3E2418] mb-1.5">
                    <span className="min-w-0">
                      Plano Office (Consultórios & Empresas) —{" "}
                      {activeOfficeSubs.length} contratos
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium">
                      R$ {mrrOffice.toFixed(2).replace(".", ",")}/mês
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF6F2] overflow-hidden">
                    <div
                      className="h-full bg-[#3E2418] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (mrrOffice / (projectedMonthlyTotal || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3 text-xs text-[#3E2418] mb-1.5">
                    <span className="min-w-0">
                      Plano Home (Residencial) — {activeHomeSubs.length}{" "}
                      contratos
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium">
                      R$ {mrrHome.toFixed(2).replace(".", ",")}/mês
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF6F2] overflow-hidden">
                    <div
                      className="h-full bg-[#D5A8A0] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (mrrHome / (projectedMonthlyTotal || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3 text-xs text-[#3E2418] mb-1.5">
                    <span className="min-w-0">
                      Bolos Avulsos (Projeção 4 semanas)
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium">
                      R$ {(avulsoRevenueWeek * 4).toFixed(2).replace(".", ",")}
                      /mês
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF6F2] overflow-hidden">
                    <div
                      className="h-full bg-[#B88B4A] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((avulsoRevenueWeek * 4) /
                            (projectedMonthlyTotal || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-[#F4E6E2]/55 p-5 sm:p-8 border border-[#EBDAD3] flex flex-col justify-between space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block mb-1">
                    Resumo da Cozinha
                  </span>
                  <h3 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                    Fornada da Semana
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-3xl font-light text-[#3E2418] block leading-none">
                    {totalCakesThisWeek}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#B88B4A]">
                    bolos total
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {Object.entries(bakingSummary).map(([flavor, counts]) => (
                  <div
                    key={flavor}
                    className="flex items-center justify-between gap-3 bg-[#FFFDFB] px-4 py-3 rounded-2xl border border-[#EBDAD3] text-xs"
                  >
                    <span className="text-[#3E2418]">{flavor}</span>
                    <span className="text-[#B88B4A] font-medium shrink-0 whitespace-nowrap">
                      {counts.total} unid.
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("PRODUCAO_ENTREGAS")}
                className="w-full rounded-full bg-[#3E2418] text-[#FFFDFB] py-3.5 text-[11px] uppercase tracking-[0.2em] cursor-pointer"
              >
                Ver Roteiro de Entregas ({totalDeliveriesWeek})
              </button>
            </div>
          </div>

          {/* Linha 4: Visualizações Extras — Indicadores de Assinantes e Indicadores de Entregas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Fidelidade / Ciclos das Assinaturas */}
            <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-7 border border-[#EBDAD3] space-y-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                  Retenção & Contratos
                </span>
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Assinantes por Período
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {[
                  {
                    label: "Ciclo Anual (Office)",
                    count: cycleCounts.ANUAL,
                    color: "bg-[#3E2418]",
                  },
                  {
                    label: "Ciclo Semestral (Office)",
                    count: cycleCounts.SEMESTRAL,
                    color: "bg-[#8C6A5B]",
                  },
                  {
                    label: "Ciclo Trimestral (Home)",
                    count: cycleCounts.TRIMESTRAL,
                    color: "bg-[#B88B4A]",
                  },
                  {
                    label: "Ciclo Mensal (Flexível)",
                    count: cycleCounts.MENSAL,
                    color: "bg-[#D5A8A0]",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-baseline justify-between gap-2 text-[#3E2418] mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium shrink-0 whitespace-nowrap">
                        {item.count} assin.
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#FAF6F2] overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{
                          width: `${
                            (item.count / (activeSubs.length || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Métodos de Pagamento Asaas */}
            <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-7 border border-[#EBDAD3] space-y-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                  Recorrência Asaas
                </span>
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Meios de Pagamento
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {[
                  {
                    label: "PIX Recorrente Automático",
                    count: paymentCounts.PIX,
                    color: "bg-[#3E2418]",
                  },
                  {
                    label: "Boleto Corporativo + NFS-e",
                    count: paymentCounts.BOLETO,
                    color: "bg-[#B88B4A]",
                  },
                  {
                    label: "Cartão de Crédito",
                    count: paymentCounts.CREDIT_CARD,
                    color: "bg-[#D5A8A0]",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-baseline justify-between gap-2 text-[#3E2418] mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium shrink-0 whitespace-nowrap">
                        {item.count} assin.
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#FAF6F2] overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{
                          width: `${
                            (item.count / (activeSubs.length || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Status Operacional das Entregas da Semana */}
            <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-7 border border-[#EBDAD3] space-y-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                  Operação Semanal
                </span>
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Andamento das Entregas
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {[
                  {
                    label: "Na Fila de Preparo",
                    count: deliveriesInQueue,
                    color: "bg-[#D5A8A0]",
                  },
                  {
                    label: "Assando no Forno",
                    count: deliveriesInOven,
                    color: "bg-[#B88B4A]",
                  },
                  {
                    label: "Prontos / Em Rota / Entregues",
                    count: deliveriesReadyOrDone,
                    color: "bg-[#3E2418]",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-baseline justify-between gap-2 text-[#3E2418] mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium shrink-0 whitespace-nowrap">
                        {item.count} de {totalDeliveriesWeek}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#FAF6F2] overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{
                          width: `${
                            (item.count / (totalDeliveriesWeek || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#75584B] font-light pt-2 border-t border-[#EBDAD3]">
                Total de <strong>{totalCakesThisWeek} bolos</strong> distribuídos
                em <strong>{totalDeliveriesWeek} entregas</strong> nesta semana.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: FORNADAS & ENTREGAS DA SEMANA (COM TOTAIS CONSOLIDADOS)
         ==================================================================== */}
      {activeTab === "PRODUCAO_ENTREGAS" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-PRODUCAO_ENTREGAS"
          className="space-y-8"
        >
          {/* Barra Superior de Totais da Semana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total de Entregas da Semana
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {totalDeliveriesWeek} entregas
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {deliveriesOfficeCount} Office • {deliveriesHomeCount} Home •{" "}
                {deliveriesAvulsoCount} Avulsa
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total de Bolos para Assar
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {totalCakesThisWeek} unidades
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {totalOfficeCakesWeek} G Office • {totalFamiliaCakesWeek}{" "}
                Família • {totalIndividualCakesWeek} Indiv.
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Na Fila / No Forno
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {deliveriesInQueue + deliveriesInOven} pedidos
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {deliveriesInQueue} na fila • {deliveriesInOven} assando agora
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Prontos / Entregues
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {deliveriesReadyOrDone} pedidos
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Concluídos nesta semana
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                  Consolidado de Forno da Semana
                </h2>
                <p className="text-xs text-[#75584B] font-light">
                  Total de bolos por sabor somando assinaturas Office, Home e
                  encomendas avulsas.
                </p>
              </div>
              <div className="px-5 py-2.5 rounded-full bg-[#FAF6F2] border border-[#EBDAD3] text-xs text-[#3E2418] self-start sm:self-auto">
                Total Geral da Fornada:{" "}
                <strong className="font-semibold">
                  {totalCakesThisWeek} bolos
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(bakingSummary).map(([flavor, info]) => (
                <div
                  key={flavor}
                  className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-2"
                >
                  <span className="text-xs font-medium text-[#3E2418] block">
                    {flavor}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-title text-4xl font-normal text-[#3E2418]">
                      {info.total}
                    </span>
                    <span className="text-xs text-[#B88B4A]">unidades</span>
                  </div>
                  <div className="text-[11px] text-[#75584B] space-y-0.5 pt-2 border-t border-[#EBDAD3] font-light">
                    {info.officeG > 0 && <p>{info.officeG}x Grande (Office)</p>}
                    {info.familia > 0 && (
                      <p>{info.familia}x Tamanho Família / Home</p>
                    )}
                    {info.individual > 0 && (
                      <p>{info.individual}x Individual</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Agenda de Entregas da Semana
                </h3>
                <p className="text-[11px] text-[#B88B4A]">
                  Toque ou clique em qualquer entrega para abrir a visão
                  detalhada da entrega e do cliente.
                </p>
              </div>
              <span className="text-xs text-[#75584B]">
                Mostrando todas as{" "}
                <strong className="text-[#3E2418]">
                  {totalDeliveriesWeek} entregas
                </strong>{" "}
                programadas
              </span>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-labelledby="deliveries-table-caption"
              className="table-wrapper rounded-2xl border border-[#EBDAD3]"
            >
              <table className="text-left text-xs">
                <caption id="deliveries-table-caption" className="sr-only">
                  Lista de entregas e preparos programados para a semana
                </caption>
                <thead className="bg-[#FAF6F2] text-[#75584B] uppercase text-[10px] tracking-[0.15em]">
                  <tr>
                    <th className="p-4 font-medium min-w-[170px]">Cliente</th>
                    <th className="p-4 font-medium min-w-[130px]">Tipo</th>
                    <th className="p-4 font-medium min-w-[135px]">
                      Data & Turno
                    </th>
                    <th className="p-4 font-medium min-w-[185px]">Sabores</th>
                    <th className="p-4 font-medium min-w-[185px]">Endereço</th>
                    <th className="p-4 font-medium min-w-[175px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBDAD3]">
                  {weeklyDeliveries.map((del) => (
                    <tr
                      key={del.id}
                      onClick={() => openDeliveryDetailModal(del)}
                      className="hover:bg-[#FAF6F2]/80 transition cursor-pointer group"
                    >
                      <th className="p-4 font-medium text-[#3E2418] min-w-[170px]">
                        <span className="block text-[10px] text-[#B88B4A]">
                          {del.id} •{" "}
                          <span className="underline group-hover:text-[#3E2418]">
                            Ver detalhes →
                          </span>
                        </span>
                        <span>{del.companyName || del.customerName}</span>
                        <span className="block font-light text-[11px] text-[#75584B]">
                          {del.whatsapp}
                        </span>
                      </th>
                      <td
                        data-label="Modalidade"
                        className="p-4 text-[#75584B] min-w-[130px]"
                      >
                        {del.orderType.replace("_", " ")}
                      </td>
                      <td
                        data-label="Data & Turno"
                        className="p-4 min-w-[135px]"
                      >
                        <span className="text-[#3E2418] block">
                          {del.deliveryDayLabel}
                        </span>
                        <span className="text-[#75584B] font-light">
                          {formatDateBR(del.deliveryDate)} • {del.shift}
                        </span>
                      </td>
                      <td
                        data-label="Sabores da Fornada"
                        className="p-4 min-w-[185px]"
                      >
                        <ul className="space-y-1">
                          {del.items.map((it, i) => (
                            <li key={i} className="text-[#3E2418]">
                              {it.quantity}x {it.flavorName}{" "}
                              <span className="text-[10px] text-[#B88B4A]">
                                ({it.size})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td
                        data-label="Endereço de Entrega"
                        className="p-4 min-w-[185px] sm:max-w-[220px] font-light text-[#75584B]"
                      >
                        <span className="block text-[#3E2418]">
                          {del.address}
                        </span>
                        <span>{del.neighborhood}</span>
                      </td>
                      <td
                        data-label="Status da Fornada"
                        className="p-4 min-w-[175px] whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          aria-label={`Status de produção do pedido ${del.id}`}
                          value={del.productionStatus}
                          onChange={(e) => {
                            updateDeliveryStatus(
                              del.id,
                              e.target.value as DeliveryOrder["productionStatus"]
                            );
                            showToast(
                              `Status do pedido ${del.id} atualizado.`
                            );
                          }}
                          className="min-w-[155px] w-auto rounded-xl border border-[#D5A8A0] bg-[#FFFDFB] px-3 py-2 text-xs font-medium text-[#3E2418] shadow-2xs cursor-pointer"
                        >
                          <option value="FILA">Na Fila</option>
                          <option value="NO_FORNO">No Forno</option>
                          <option value="FINALIZADO">Pronto / Embalado</option>
                          <option value="EM_ROTA">Em Rota</option>
                          <option value="ENTREGUE">Entregue</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          NOVA ABA: HISTÓRICO DE ENTREGAS JÁ REALIZADAS (VINCULADAS AOS CLIENTES)
         ==================================================================== */}
      {activeTab === "HISTORICO_ENTREGAS" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-HISTORICO_ENTREGAS"
          className="space-y-8"
        >
          {/* KPIs do Histórico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Entregas Concluídas no Histórico
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {allCompletedDeliveries.length} entregas
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Assinaturas Office, Home e Pedidos Avulsos
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total de Bolos Entregues (Registros)
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {totalHistoricCakesCount} bolos
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Forno concluído e entregue aos clientes
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Volume Financeiro das Entregas
              </span>
              <p className="text-3xl font-light text-[#3E2418] whitespace-nowrap">
                R$ {totalHistoricValue.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Valor equivalente das entregas listadas
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                  Histórico de Entregas Realizadas
                </h2>
                <p className="text-xs text-[#75584B] font-light">
                  Toque ou clique em qualquer entrega para abrir o comprovante
                  detalhado ou ir direto para a ficha histórica do cliente.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "TODOS", label: "Todas" },
                    { id: "ASSINATURA_OFFICE", label: "Assinaturas Office" },
                    { id: "ASSINATURA_HOME", label: "Assinaturas Home" },
                    { id: "AVULSO", label: "Compras Avulsas" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterHistoryType(f.id)}
                    className={`px-3.5 sm:px-4 py-2 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.15em] transition cursor-pointer border ${
                      filterHistoryType === f.id
                        ? "bg-[#3E2418] text-[#FFFDFB] border-[#3E2418]"
                        : "bg-[#FAF6F2] text-[#75584B] border-[#EBDAD3]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="Tabela de histórico de entregas realizadas"
              className="table-wrapper rounded-2xl border border-[#EBDAD3]"
            >
              <table className="text-left text-xs">
                <thead className="bg-[#FAF6F2] text-[#75584B] uppercase text-[10px] tracking-[0.15em]">
                  <tr>
                    <th className="p-4 font-medium">Pedido / Cliente</th>
                    <th className="p-4 font-medium">Modalidade</th>
                    <th className="p-4 font-medium">Data & Confirmação</th>
                    <th className="p-4 font-medium">Sabores Entregues</th>
                    <th className="p-4 font-medium">Valor</th>
                    <th className="p-4 font-medium">Observação / Recebimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBDAD3]">
                  {allCompletedDeliveries
                    .filter((d) =>
                      filterHistoryType === "TODOS"
                        ? true
                        : d.orderType === filterHistoryType
                    )
                    .map((del) => (
                      <tr
                        key={del.id}
                        onClick={() => openDeliveryDetailModal(del)}
                        className="hover:bg-[#FAF6F2]/80 transition cursor-pointer group"
                      >
                        <th className="p-4 font-medium text-[#3E2418]">
                          <span className="block text-[10px] text-[#B88B4A]">
                            {del.id} •{" "}
                            <span className="underline group-hover:text-[#3E2418]">
                              Ver detalhes →
                            </span>
                          </span>
                          <span>{del.companyName || del.customerName}</span>
                          <span className="block font-light text-[11px] text-[#75584B]">
                            {del.neighborhood}
                          </span>
                        </th>
                        <td
                          data-label="Modalidade"
                          className="p-4 text-[#75584B]"
                        >
                          {del.orderType.replace("_", " ")}
                        </td>
                        <td data-label="Data & Confirmação" className="p-4">
                          <span className="text-[#3E2418] block">
                            {formatDateBR(del.deliveryDate)} ({del.shift})
                          </span>
                          <span className="text-[11px] text-[#B88B4A] font-light">
                            {del.deliveredAt || "Entregue"}
                          </span>
                        </td>
                        <td data-label="Sabores Entregues" className="p-4">
                          <ul className="space-y-1">
                            {del.items.map((it, i) => (
                              <li key={i} className="text-[#3E2418]">
                                {it.quantity}x {it.flavorName}{" "}
                                <span className="text-[10px] text-[#B88B4A]">
                                  ({it.size})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td
                          data-label="Valor"
                          className="p-4 font-serif-title text-lg text-[#3E2418] whitespace-nowrap"
                        >
                          R$ {del.totalValue.toFixed(2).replace(".", ",")}
                        </td>
                        <td
                          data-label="Observação / Recebimento"
                          className="p-4 sm:max-w-[230px] text-[11px] text-[#75584B] font-light"
                        >
                          {del.feedbackNote ||
                            "Entrega concluída dentro do turno."}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: CARTEIRA DE CLIENTES & ASSINANTES (ASSINANTES + AVULSOS CRM)
         ==================================================================== */}
      {activeTab === "ASSINATURAS" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-ASSINATURAS"
          className="space-y-8"
        >
          {/* Resumo de Clientes e Assinantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total na Base de Clientes
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {totalClientsAll} clientes
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                {subscriptions.length} assinantes •{" "}
                {avulsoCustomerLeads.length} compradores avulsos
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Total de Assinantes Ativos
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {activeSubs.length} assinantes
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Gerando R$ {totalMrr.toFixed(2).replace(".", ",")}/mês
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Assinantes Office vs Home
              </span>
              <p className="text-2xl font-normal text-[#3E2418]">
                {activeOfficeSubs.length} Office • {activeHomeSubs.length} Home
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Empresas/Clínicas e Residencial
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                Clientes Avulsos
              </span>
              <p className="text-3xl font-light text-[#3E2418]">
                {avulsoCustomerLeads.length} clientes
              </p>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Já provaram nosso bolo e podem assinar
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                  Carteira de Clientes & Assinantes
                </h2>
                <p className="text-xs text-[#75584B] font-light">
                  Toque ou clique em qualquer cliente da lista para ver o
                  histórico de entregas, data de adesão, upgrades de plano e
                  compras avulsas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "TODOS", label: `Todos (${totalClientsAll})` },
                    {
                      id: "OFFICE",
                      label: `Office (${activeOfficeSubs.length})`,
                    },
                    { id: "HOME", label: `Home (${activeHomeSubs.length})` },
                    {
                      id: "AVULSOS",
                      label: `Compradores Avulsos (${avulsoCustomerLeads.length})`,
                    },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterSubCategory(cat.id)}
                    className={`px-3.5 sm:px-4 py-2 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.15em] transition cursor-pointer border ${
                      filterSubCategory === cat.id
                        ? "bg-[#3E2418] text-[#FFFDFB] border-[#3E2418]"
                        : "bg-[#FAF6F2] text-[#75584B] border-[#EBDAD3]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="Tabela de clientes e assinaturas"
              className="table-wrapper rounded-2xl border border-[#EBDAD3]"
            >
              <table className="text-left text-xs">
                <thead className="bg-[#FAF6F2] text-[#75584B] uppercase text-[10px] tracking-[0.15em]">
                  <tr>
                    <th className="p-4 font-medium">Cliente / Contato</th>
                    <th className="p-4 font-medium">Vínculo / Plano</th>
                    <th className="p-4 font-medium">
                      Preferências & Histórico
                    </th>
                    <th className="p-4 font-medium">Receita</th>
                    <th className="p-4 font-medium">Status / Ação Comercial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBDAD3]">
                  {/* 1. Assinantes Office & Home */}
                  {filterSubCategory !== "AVULSOS" &&
                    subscriptions
                      .filter((s) =>
                        filterSubCategory === "TODOS"
                          ? true
                          : s.category === filterSubCategory
                      )
                      .map((sub) => (
                        <tr
                          key={sub.id}
                          onClick={() => openSubscriberDetailModal(sub)}
                          className="hover:bg-[#FAF6F2]/80 transition cursor-pointer group"
                        >
                          <th className="p-4 font-medium text-[#3E2418]">
                            <span className="text-[10px] text-[#B88B4A] block">
                              {sub.id} • ASSINANTE {sub.category} •{" "}
                              <span className="underline group-hover:text-[#3E2418]">
                                Ver ficha & histórico →
                              </span>
                            </span>
                            <span>
                              {sub.companyOrClinicName || sub.customerName}
                            </span>
                            <span className="block font-light text-[11px] text-[#75584B]">
                              {sub.whatsapp} • {sub.neighborhood}
                            </span>
                          </th>
                          <td data-label="Vínculo / Plano" className="p-4">
                            <span className="text-[#3E2418] block">
                              {sub.planName}
                            </span>
                            <span className="text-[#75584B] font-light block">
                              Ciclo {sub.period} • Desde{" "}
                              {formatDateBR(sub.createdAt)}
                            </span>
                          </td>
                          <td
                            data-label="Preferências & Histórico"
                            className="p-4"
                          >
                            <span className="text-[#3E2418] block">
                              {sub.frequency} • {sub.deliveryDay} (
                              {sub.deliveryShift})
                            </span>
                            <span className="text-[#B88B4A] block text-[11px]">
                              {sub.completedDeliveriesCount || 1} entregas feitas
                              {(sub.planHistory?.length || 0) > 1
                                ? ` • ${(sub.planHistory?.length || 1) - 1} upgrade(s)`
                                : ""}
                            </span>
                          </td>
                          <td data-label="Receita" className="p-4">
                            <span className="font-serif-title text-xl font-normal text-[#3E2418] block whitespace-nowrap">
                              R$ {sub.monthlyValue.toFixed(2).replace(".", ",")}
                              /mês
                            </span>
                            <span className="text-[10px] text-[#75584B]">
                              {sub.paymentMethod}
                            </span>
                          </td>
                          <td
                            data-label="Status da Assinatura"
                            className="p-4 min-w-[150px] whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              aria-label={`Status da assinatura de ${sub.customerName}`}
                              value={sub.status}
                              onChange={(e) => {
                                updateSubscriptionStatus(
                                  sub.id,
                                  e.target.value as SubscriptionRecord["status"]
                                );
                                showToast(`Assinatura ${sub.id} atualizada.`);
                              }}
                              className="min-w-[130px] w-auto rounded-xl border border-[#D5A8A0] bg-[#FFFDFB] px-3 py-2 text-xs font-medium text-[#3E2418] shadow-2xs cursor-pointer"
                            >
                              <option value="ATIVA">Ativa</option>
                              <option value="PAUSADA">Pausada</option>
                              <option value="ATRASADA">Atrasada</option>
                              <option value="CANCELADA">Cancelada</option>
                            </select>
                          </td>
                        </tr>
                      ))}

                  {/* 2. Clientes Avulsos (Oportunidades para enviar Promoção de Assinatura) */}
                  {(filterSubCategory === "TODOS" ||
                    filterSubCategory === "AVULSOS") &&
                    avulsoCustomerLeads.map((lead) => {
                      const promoWasSent = Boolean(promoSentMap[lead.id]);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => openAvulsoLeadDetailModal(lead.id)}
                          className="bg-[#FAF6F2]/40 hover:bg-[#FAF6F2] transition cursor-pointer group"
                        >
                          <th className="p-4 font-medium text-[#3E2418]">
                            <span className="inline-block text-[9px] uppercase tracking-[0.18em] bg-[#F4E6E2] text-[#3E2418] px-2.5 py-0.5 rounded-full mb-1">
                              {lead.id} • CLIENTE AVULSO •{" "}
                              <span className="underline">Ver histórico →</span>
                            </span>
                            <span className="block">{lead.customerName}</span>
                            <span className="block font-light text-[11px] text-[#75584B]">
                              {lead.whatsapp} • {lead.neighborhood}
                            </span>
                          </th>
                          <td data-label="Vínculo" className="p-4">
                            <span className="text-[#3E2418] block">
                              Comprou Avulso ({lead.ordersCount}x)
                            </span>
                            <span className="text-[#B88B4A] font-light text-[11px]">
                              Sem plano ativo ainda
                            </span>
                          </td>
                          <td data-label="Último Pedido & Origem" className="p-4">
                            <span className="text-[#3E2418] block">
                              Último pedido em{" "}
                              {formatDateBR(lead.lastOrderDate)}:
                            </span>
                            <span className="text-[#B88B4A] block text-[11px]">
                              {lead.lastFlavors.join(", ")}
                            </span>
                            <span className="text-[#75584B] font-light block text-[10px]">
                              {lead.originNote}
                            </span>
                          </td>
                          <td data-label="Receita Avulsa" className="p-4">
                            <span className="font-serif-title text-xl font-normal text-[#3E2418] block whitespace-nowrap">
                              R${" "}
                              {lead.totalSpentAvulso
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                            <span className="text-[10px] text-[#75584B]">
                              Total em avulsos
                            </span>
                          </td>
                          <td
                            data-label="Ação Comercial"
                            className="p-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col gap-1.5 items-start">
                              <a
                                href={buildWhatsAppPromoUrl(lead)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                  setPromoSentMap((prev) => ({
                                    ...prev,
                                    [lead.id]: true,
                                  }));
                                  showToast(
                                    `Promoção de assinatura gerada para ${lead.customerName}!`
                                  );
                                }}
                                className="inline-block rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition whitespace-nowrap"
                              >
                                {promoWasSent
                                  ? "Reenviar Oferta de Plano"
                                  : "Enviar Promoção de Plano"}
                              </a>
                              {promoWasSent && (
                                <span className="text-[10px] text-[#B88B4A]">
                                  ✓ Convite enviado no WhatsApp
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 4: EDITAR VALORES E REGRAS DOS PLANOS
         ==================================================================== */}
      {activeTab === "REGRAS_PLANOS" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-REGRAS_PLANOS"
          className="space-y-10"
        >
          <div className="rounded-3xl bg-[#FFFDFB] p-8 border border-[#EBDAD3] space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
                Diagrama Office
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Valores e Descontos — Plano Office
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {officePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-4"
                >
                  <h3 className="font-serif-title text-2xl font-normal text-[#3E2418] border-b border-[#EBDAD3] pb-2">
                    {plan.name} ({plan.capacityLabel})
                  </h3>

                  <div>
                    <label
                      htmlFor={`office-name-${plan.id}`}
                      className="block text-xs text-[#75584B] mb-1"
                    >
                      Subtítulo Elegante
                    </label>
                    <input
                      id={`office-name-${plan.id}`}
                      type="text"
                      value={plan.marketingName}
                      onChange={(e) =>
                        updateOfficePlan({
                          ...plan,
                          marketingName: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`office-price-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Valor Mensal (R$)
                      </label>
                      <input
                        id={`office-price-${plan.id}`}
                        type="number"
                        step="0.10"
                        value={plan.baseMonthlyPrice}
                        onChange={(e) => {
                          updateOfficePlan({
                            ...plan,
                            baseMonthlyPrice: Number(e.target.value),
                          });
                          showToast(`Valor de ${plan.name} salvo.`);
                        }}
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`office-units-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Unid. / Semana
                      </label>
                      <input
                        id={`office-units-${plan.id}`}
                        type="number"
                        min={1}
                        value={plan.unitsPerWeek}
                        onChange={(e) =>
                          updateOfficePlan({
                            ...plan,
                            unitsPerWeek: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`office-sem-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Desc. Semestral (%)
                      </label>
                      <input
                        id={`office-sem-${plan.id}`}
                        type="number"
                        value={plan.discounts.SEMESTRAL}
                        onChange={(e) =>
                          updateOfficePlan({
                            ...plan,
                            discounts: {
                              ...plan.discounts,
                              SEMESTRAL: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`office-anu-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Desc. Anual (%)
                      </label>
                      <input
                        id={`office-anu-${plan.id}`}
                        type="number"
                        value={plan.discounts.ANUAL}
                        onChange={(e) =>
                          updateOfficePlan({
                            ...plan,
                            discounts: {
                              ...plan.discounts,
                              ANUAL: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#FFFDFB] p-8 border border-[#EBDAD3] space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
                Diagrama Home
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Valores e Descontos — Plano Home
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-4"
                >
                  <h3 className="font-serif-title text-2xl font-normal text-[#3E2418] border-b border-[#EBDAD3] pb-2">
                    {plan.name} ({plan.capacityLabel})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor={`home-sem-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Semanal (R$/mês)
                      </label>
                      <input
                        id={`home-sem-${plan.id}`}
                        type="number"
                        step="0.10"
                        value={plan.basePrices.SEMANAL}
                        onChange={(e) => {
                          updateHomePlan({
                            ...plan,
                            basePrices: {
                              ...plan.basePrices,
                              SEMANAL: Number(e.target.value),
                            },
                          });
                          showToast(`Valor semanal de ${plan.name} salvo.`);
                        }}
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`home-quinz-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Quinzenal (R$/mês)
                      </label>
                      <input
                        id={`home-quinz-${plan.id}`}
                        type="number"
                        step="0.10"
                        value={plan.basePrices.QUINZENAL}
                        onChange={(e) => {
                          updateHomePlan({
                            ...plan,
                            basePrices: {
                              ...plan.basePrices,
                              QUINZENAL: Number(e.target.value),
                            },
                          });
                          showToast(`Valor quinzenal de ${plan.name} salvo.`);
                        }}
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`home-trim-${plan.id}`}
                        className="block text-xs text-[#75584B] mb-1"
                      >
                        Desc. Trimestral (%)
                      </label>
                      <input
                        id={`home-trim-${plan.id}`}
                        type="number"
                        value={plan.discounts.TRIMESTRAL}
                        onChange={(e) =>
                          updateHomePlan({
                            ...plan,
                            discounts: {
                              ...plan.discounts,
                              TRIMESTRAL: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONTROLE DE ÁREA DE ENTREGA & FRETE REGIONAL (TRAVA POR CEP) */}
          <div className="rounded-3xl bg-[#FFFDFB] p-5 sm:p-8 border border-[#EBDAD3] space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
                Logística & Trava por CEP (ViaCEP)
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Área de Entrega & Frete Regional
              </h2>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Escolha quais cidades podem finalizar assinaturas e pedidos
                avulsos. Cidades desativadas (ou fora da lista) recebem um
                aviso educado no checkout bloqueando a compra.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    zone.enabled
                      ? "bg-[#FAF6F2] border-[#D5A8A0]"
                      : "bg-[#FFFDFB] border-[#EBDAD3] opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={`zone-toggle-${zone.id}`}
                      type="checkbox"
                      checked={zone.enabled}
                      onChange={(e) => {
                        updateDeliveryZone({
                          ...zone,
                          enabled: e.target.checked,
                        });
                        showToast(
                          `${zone.city} ${
                            e.target.checked ? "liberada" : "bloqueada"
                          } para entregas.`
                        );
                      }}
                      className="w-4 h-4 rounded mt-1 shrink-0"
                    />
                    <label
                      htmlFor={`zone-toggle-${zone.id}`}
                      className="cursor-pointer"
                    >
                      <span className="text-sm font-medium text-[#3E2418] block">
                        {zone.city} - {zone.state}
                        {zone.isPrimary && (
                          <span className="ml-2 text-[9px] uppercase tracking-widest bg-[#3E2418] text-[#FFFDFB] px-2 py-0.5 rounded-full">
                            Sede
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[#75584B] font-light">
                        {zone.enabled
                          ? zone.feePerDelivery > 0
                            ? `Liberada • +R$ ${zone.feePerDelivery
                                .toFixed(2)
                                .replace(".", ",")}/entrega`
                            : "Liberada • Frete grátis / incluso"
                          : "Bloqueada no checkout (aviso educado)"}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="w-28">
                      <label
                        htmlFor={`zone-fee-${zone.id}`}
                        className="block text-[10px] text-[#75584B] mb-0.5"
                      >
                        Frete/entrega (R$)
                      </label>
                      <input
                        id={`zone-fee-${zone.id}`}
                        type="number"
                        min={0}
                        step="1"
                        value={zone.feePerDelivery}
                        onChange={(e) =>
                          updateDeliveryZone({
                            ...zone,
                            feePerDelivery: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    {!zone.isPrimary && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteDeliveryZone(zone.id);
                          showToast(`Cidade "${zone.city}" removida.`);
                        }}
                        aria-label={`Remover ${zone.city}`}
                        className="p-2 text-[#75584B] hover:text-red-700 transition cursor-pointer mt-4"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar nova cidade vizinha */}
            <div className="pt-4 border-t border-[#EBDAD3] flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="new-zone-city"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Adicionar outra cidade (SP)
                </label>
                <input
                  id="new-zone-city"
                  type="text"
                  value={newZoneCity}
                  onChange={(e) => setNewZoneCity(e.target.value)}
                  placeholder="Ex: Santa Isabel, Salesópolis..."
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-xs"
                />
              </div>
              <div className="w-full sm:w-40">
                <label
                  htmlFor="new-zone-fee"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Frete por entrega (R$)
                </label>
                <input
                  id="new-zone-fee"
                  type="number"
                  min={0}
                  step="1"
                  value={newZoneFee}
                  onChange={(e) => setNewZoneFee(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const trimmed = newZoneCity.trim();
                  if (!trimmed) return;
                  const id = trimmed
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-");
                  addDeliveryZone({
                    id: `${id}-${Date.now().toString().slice(-3)}`,
                    city: trimmed,
                    state: "SP",
                    enabled: true,
                    feePerDelivery: Math.max(0, Number(newZoneFee) || 0),
                  });
                  setNewZoneCity("");
                  showToast(`Cidade "${trimmed}" adicionada e liberada!`);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-6 py-2.5 text-xs uppercase tracking-[0.16em] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Cidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 5: CARDÁPIO DE BOLOS & VALORES AVULSOS
         ==================================================================== */}
      {activeTab === "CARDAPIO_BOLOS" && (
        <div
          role="tabpanel"
          aria-labelledby="tab-CARDAPIO_BOLOS"
          className="space-y-8"
        >
          <form
            onSubmit={handleAddFlavorSubmit}
            className="rounded-3xl bg-[#FFFDFB] p-8 border border-[#EBDAD3] space-y-5"
          >
            <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
              Adicionar Novo Sabor ao Cardápio
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="new-flavor-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Nome do Bolo *
                </label>
                <input
                  id="new-flavor-name"
                  type="text"
                  required
                  value={newFlavorName}
                  onChange={(e) => setNewFlavorName(e.target.value)}
                  placeholder="Ex: Maçã com Nozes e Especiarias"
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="new-flavor-tag"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Subtítulo / Tag
                </label>
                <input
                  id="new-flavor-tag"
                  type="text"
                  value={newFlavorTag}
                  onChange={(e) => setNewFlavorTag(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="new-price-fam"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Tamanho Família (R$)
                </label>
                <input
                  id="new-price-fam"
                  type="number"
                  step="0.50"
                  required
                  value={newPriceFamilia}
                  onChange={(e) => setNewPriceFamilia(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="new-price-ind"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Individual (R$)
                </label>
                <input
                  id="new-price-ind"
                  type="number"
                  step="0.50"
                  required
                  value={newPriceIndividual}
                  onChange={(e) => setNewPriceIndividual(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="new-price-syrup"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Potinho Calda (R$)
                </label>
                <input
                  id="new-price-syrup"
                  type="number"
                  step="0.50"
                  value={newSyrupPrice}
                  onChange={(e) => setNewSyrupPrice(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="new-syrup-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Descrição da Calda
                </label>
                <input
                  id="new-syrup-name"
                  type="text"
                  value={newSyrupName}
                  onChange={(e) => setNewSyrupName(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-flavor-desc"
                className="block text-xs text-[#75584B] mb-1"
              >
                Descrição da Receita
              </label>
              <input
                id="new-flavor-desc"
                type="text"
                value={newFlavorDesc}
                onChange={(e) => setNewFlavorDesc(e.target.value)}
                className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-7 py-3.5 text-xs uppercase tracking-[0.2em] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Salvar Novo Sabor
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cakeFlavors.map((flavor) => (
              <div
                key={flavor.id}
                className="rounded-3xl bg-[#FFFDFB] p-6 border border-[#EBDAD3] space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A]">
                      {flavor.tag}
                    </span>
                    <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                      {flavor.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteCakeFlavor(flavor.id);
                      showToast(`Sabor "${flavor.name}" removido.`);
                    }}
                    aria-label={`Remover ${flavor.name}`}
                    className="p-2 text-[#75584B] hover:text-red-700 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor={`fam-${flavor.id}`}
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Família (R$)
                    </label>
                    <input
                      id={`fam-${flavor.id}`}
                      type="number"
                      step="0.50"
                      value={flavor.priceFamilia}
                      onChange={(e) =>
                        updateCakeFlavor({
                          ...flavor,
                          priceFamilia: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2] px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`ind-${flavor.id}`}
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Individual (R$)
                    </label>
                    <input
                      id={`ind-${flavor.id}`}
                      type="number"
                      step="0.50"
                      value={flavor.priceIndividual}
                      onChange={(e) =>
                        updateCakeFlavor({
                          ...flavor,
                          priceIndividual: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2] px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`calda-${flavor.id}`}
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Calda (R$)
                    </label>
                    <input
                      id={`calda-${flavor.id}`}
                      type="number"
                      step="0.50"
                      value={flavor.extraSyrupPrice}
                      onChange={(e) =>
                        updateCakeFlavor({
                          ...flavor,
                          extraSyrupPrice: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2] px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: VISÃO DETALHADA DA ENTREGA (SEMANA OU HISTÓRICO)
         ==================================================================== */}
      <dialog
        ref={deliveryModalRef}
        aria-labelledby="delivery-detail-modal-title"
        className="m-auto w-[calc(100%-1.5rem)] sm:w-full max-w-2xl rounded-3xl bg-[#FFFDFB] p-0 text-[#3E2418] shadow-2xl border border-[#EBDAD3] overflow-hidden"
      >
        {selectedDelivery && (
          <div className="p-5 sm:p-9 max-h-[88vh] overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#EBDAD3] pb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                  Ficha Detalhada da Entrega • {selectedDelivery.id}
                </span>
                <h2
                  id="delivery-detail-modal-title"
                  className="font-serif-title text-2xl sm:text-3xl font-normal text-[#3E2418] mt-1"
                >
                  {selectedDelivery.companyName ||
                    selectedDelivery.customerName}
                </h2>
                <p className="text-xs text-[#75584B] font-light mt-0.5">
                  Modalidade:{" "}
                  <strong className="font-medium text-[#3E2418]">
                    {selectedDelivery.orderType.replace("_", " ")}
                  </strong>{" "}
                  • Responsável: {selectedDelivery.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deliveryModalRef.current?.close()}
                className="text-xs uppercase tracking-[0.15em] text-[#75584B] hover:text-[#3E2418] cursor-pointer shrink-0"
              >
                Fechar
              </button>
            </div>

            {/* Resumo de Data, Turno e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                  Data Programada
                </span>
                <p className="font-serif-title text-2xl text-[#3E2418] mt-0.5">
                  {formatDateBR(selectedDelivery.deliveryDate)}
                </p>
                <p className="text-[11px] text-[#75584B] font-light">
                  {selectedDelivery.deliveryDayLabel} • Turno{" "}
                  {selectedDelivery.shift}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                  Valor da Entrega
                </span>
                <p className="font-serif-title text-2xl text-[#3E2418] mt-0.5">
                  R$ {selectedDelivery.totalValue.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[11px] text-[#75584B] font-light">
                  {selectedDelivery.deliveredAt || "Programado para a semana"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                <label
                  htmlFor="modal-delivery-status"
                  className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block mb-1"
                >
                  Status da Fornada
                </label>
                <select
                  id="modal-delivery-status"
                  value={selectedDelivery.productionStatus}
                  onChange={(e) => {
                    const nextStatus = e.target
                      .value as DeliveryOrder["productionStatus"];
                    updateDeliveryStatus(selectedDelivery.id, nextStatus);
                    setSelectedDelivery({
                      ...selectedDelivery,
                      productionStatus: nextStatus,
                    });
                    showToast(
                      `Status do pedido ${selectedDelivery.id} atualizado.`
                    );
                  }}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3 py-2 text-xs text-[#3E2418]"
                >
                  <option value="FILA">Na Fila</option>
                  <option value="NO_FORNO">No Forno</option>
                  <option value="FINALIZADO">Pronto / Embalado</option>
                  <option value="EM_ROTA">Em Rota</option>
                  <option value="ENTREGUE">Entregue</option>
                </select>
              </div>
            </div>

            {/* Itens / Bolos para Assar e Entregar */}
            <div className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD3] space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                Bolos & Itens desta Entrega
              </span>
              <div className="divide-y divide-[#EBDAD3]">
                {selectedDelivery.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-[#3E2418] text-sm">
                        {item.quantity}x {item.flavorName}
                      </span>
                      {item.extraSyrup && (
                        <span className="block text-[11px] text-[#B88B4A]">
                          + Acompanha Potinho Extra de Calda (50ml)
                        </span>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#FAF6F2] border border-[#EBDAD3] text-[10px] uppercase tracking-wider text-[#75584B]">
                      Tamanho: {item.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Endereço, Contato e Observações */}
            <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-2 text-xs">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                Logística & Endereço de Entrega
              </span>
              <p className="text-[#3E2418] font-medium">
                {selectedDelivery.address} — {selectedDelivery.neighborhood}
              </p>
              <p className="text-[#75584B]">
                WhatsApp do Cliente:{" "}
                <strong className="text-[#3E2418]">
                  {selectedDelivery.whatsapp}
                </strong>
              </p>
              {selectedDelivery.feedbackNote && (
                <p className="text-[#3E2418] italic pt-1">
                  Registro da entrega: &ldquo;{selectedDelivery.feedbackNote}
                  &rdquo;
                </p>
              )}
            </div>

            {/* Botão para abrir a Ficha 360° do Cliente vinculado */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href={`https://wa.me/55${selectedDelivery.whatsapp.replace(
                  /\D/g,
                  ""
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto text-center rounded-full border border-[#EBDAD3] bg-[#FAF6F2] hover:border-[#D5A8A0] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#3E2418] transition"
              >
                Chamar Cliente no WhatsApp
              </a>

              <button
                type="button"
                onClick={() => {
                  const linkedSub = subscriptions.find(
                    (s) =>
                      s.id === selectedDelivery.subscriptionId ||
                      s.whatsapp === selectedDelivery.whatsapp
                  );
                  deliveryModalRef.current?.close();
                  if (linkedSub) {
                    openSubscriberDetailModal(linkedSub);
                  } else {
                    const matchedLead = avulsoCustomerLeads.find(
                      (l) =>
                        l.whatsapp === selectedDelivery.whatsapp ||
                        l.customerName === selectedDelivery.customerName
                    );
                    if (matchedLead) {
                      openAvulsoLeadDetailModal(matchedLead.id);
                    }
                  }
                }}
                className="w-full sm:w-auto rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-7 py-3 text-xs uppercase tracking-[0.16em] transition cursor-pointer"
              >
                Ver Histórico Completo deste Cliente →
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* ====================================================================
          MODAL 2: FICHA COMPLETA 360° DO CLIENTE (HISTÓRICO DE ENTREGAS, DESDE QUANDO ASSINA, UPGRADES E AVULSOS)
         ==================================================================== */}
      <dialog
        ref={clientModalRef}
        aria-labelledby="client-detail-modal-title"
        className="m-auto w-[calc(100%-1.5rem)] sm:w-full max-w-3xl rounded-3xl bg-[#FFFDFB] p-0 text-[#3E2418] shadow-2xl border border-[#EBDAD3] overflow-hidden"
      >
        {selectedSubscriber &&
          (() => {
            // Busca todas as entregas (histórico concluído + semana atual) vinculadas a este assinante
            const clientPastDeliveries = allCompletedDeliveries.filter(
              (d) =>
                d.subscriptionId === selectedSubscriber.id ||
                d.whatsapp === selectedSubscriber.whatsapp
            );
            const clientUpcomingDeliveries = weeklyDeliveries.filter(
              (d) =>
                (d.subscriptionId === selectedSubscriber.id ||
                  d.whatsapp === selectedSubscriber.whatsapp) &&
                d.productionStatus !== "ENTREGUE"
            );
            const clientAvulsoOrders = [
              ...clientPastDeliveries,
              ...clientUpcomingDeliveries,
            ].filter((d) => d.orderType === "AVULSO");
            const totalAvulsoSpent = clientAvulsoOrders.reduce(
              (acc, o) => acc + o.totalValue,
              0
            );
            const totalDeliveriesDone =
              selectedSubscriber.completedDeliveriesCount ||
              clientPastDeliveries.length;
            const upgradesCount = Math.max(
              0,
              (selectedSubscriber.planHistory?.length || 1) - 1
            );

            return (
              <div className="p-5 sm:p-10 max-h-[88vh] overflow-y-auto custom-scrollbar space-y-7 sm:space-y-8">
                <div className="flex items-start justify-between gap-4 border-b border-[#EBDAD3] pb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                      Ficha 360° do Assinante • {selectedSubscriber.id} (
                      {selectedSubscriber.category})
                    </span>
                    <h2
                      id="client-detail-modal-title"
                      className="font-serif-title text-3xl sm:text-4xl font-normal text-[#3E2418] mt-1"
                    >
                      {selectedSubscriber.companyOrClinicName ||
                        selectedSubscriber.customerName}
                    </h2>
                    <p className="text-xs text-[#75584B] font-light mt-1">
                      Responsável: {selectedSubscriber.customerName} • Doc:{" "}
                      {selectedSubscriber.document} •{" "}
                      {selectedSubscriber.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clientModalRef.current?.close()}
                    className="text-xs uppercase tracking-[0.15em] text-[#75584B] hover:text-[#3E2418] cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                {/* 4 KPIs do Histórico do Cliente */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Assinante Desde
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      {formatDateBR(selectedSubscriber.createdAt)}
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      Ciclo {selectedSubscriber.period}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Entregas Realizadas
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      {totalDeliveriesDone} entregas
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      {selectedSubscriber.unitsPerDelivery} bolo(s)/envio
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Upgrades de Plano
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      {upgradesCount}{" "}
                      {upgradesCount === 1 ? "upgrade" : "upgrades"}
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      Atual: {selectedSubscriber.planName.split(" (")[0]}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F4E6E2]/55 border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Compras Avulsas Extras
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      {clientAvulsoOrders.length} pedido(s)
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      R$ {totalAvulsoSpent.toFixed(2).replace(".", ",")} em
                      avulsos
                    </p>
                  </div>
                </div>

                {/* Preferências da Surpresa & Logística */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-1.5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                      Preferências para a Surpresa da Chef
                    </span>
                    <p className="text-[#3E2418] font-medium">
                      Estilos favoritos:{" "}
                      {(selectedSubscriber.favoriteStyles &&
                        selectedSubscriber.favoriteStyles.join(", ")) ||
                        "Todos os estilos"}
                    </p>
                    <p className="text-[#75584B] font-light">
                      Restrições:{" "}
                      {selectedSubscriber.dietaryRestrictions ||
                        "Nenhuma restrição informada"}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-1.5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                      Endereço & Janela Fixa
                    </span>
                    <p className="text-[#3E2418] font-medium">
                      {selectedSubscriber.address} —{" "}
                      {selectedSubscriber.neighborhood}
                    </p>
                    <p className="text-[#75584B] font-light">
                      Toda {selectedSubscriber.deliveryDay} (
                      {selectedSubscriber.deliveryShift}) • WhatsApp:{" "}
                      {selectedSubscriber.whatsapp}
                    </p>
                  </div>
                </div>

                {/* Linha do Tempo de Assinatura & Upgrades Feitos pelo Cliente */}
                <div className="space-y-3">
                  <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                    Linha do Tempo da Assinatura & Upgrades
                  </h3>
                  <div className="space-y-2.5">
                    {(
                      selectedSubscriber.planHistory || [
                        {
                          date: selectedSubscriber.createdAt,
                          title: `Adesão Inicial • ${selectedSubscriber.planName}`,
                          description: `Iniciou assinatura no ciclo ${selectedSubscriber.period}.`,
                        },
                      ]
                    ).map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="text-[#3E2418] font-medium block">
                            {ev.title}
                          </span>
                          <span className="text-[#75584B] font-light">
                            {ev.description}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] shrink-0">
                          {formatDateBR(ev.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico de Entregas Vinculadas ao Cliente (Assinatura + Compras Avulsas) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                      Histórico de Entregas & Compras Avulsas deste Cliente
                    </h3>
                    <span className="text-xs text-[#75584B]">
                      {clientPastDeliveries.length +
                        clientUpcomingDeliveries.length}{" "}
                      registros listados
                    </span>
                  </div>

                  <div className="divide-y divide-[#EBDAD3] rounded-2xl border border-[#EBDAD3] bg-[#FFFDFB] overflow-hidden text-xs">
                    {[...clientUpcomingDeliveries, ...clientPastDeliveries].map(
                      (order) => (
                        <div
                          key={order.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6F2]/60"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-[0.16em] text-[#B88B4A] font-medium">
                                {order.id} • {formatDateBR(order.deliveryDate)}
                              </span>
                              <span
                                className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  order.orderType === "AVULSO"
                                    ? "bg-[#F4E6E2] text-[#3E2418] font-medium"
                                    : "bg-[#FAF6F2] text-[#75584B]"
                                }`}
                              >
                                {order.orderType === "AVULSO"
                                  ? "Compra Avulsa Extra"
                                  : "Entrega da Assinatura"}
                              </span>
                            </div>
                            <p className="text-[#3E2418] font-medium">
                              {order.items
                                .map(
                                  (i) =>
                                    `${i.quantity}x ${i.flavorName} (${i.size})`
                                )
                                .join(" + ")}
                            </p>
                            {order.feedbackNote && (
                              <p className="text-[11px] text-[#75584B] font-light italic">
                                {order.feedbackNote}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="font-serif-title text-lg text-[#3E2418] block">
                              R$ {order.totalValue.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-[#B88B4A]">
                              {order.productionStatus === "ENTREGUE"
                                ? `✓ ${order.deliveredAt || "Entregue"}`
                                : `Status: ${order.productionStatus}`}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Ficha Detalhada quando o cliente clicado é um Comprador Avulso (Lead) */}
        {!selectedSubscriber &&
          selectedAvulsoLeadId &&
          (() => {
            const lead = avulsoCustomerLeads.find(
              (l) => l.id === selectedAvulsoLeadId
            );
            if (!lead) return null;
            const leadOrders = [
              ...weeklyDeliveries,
              ...allCompletedDeliveries,
            ].filter(
              (d, idx, arr) =>
                arr.findIndex((x) => x.id === d.id) === idx &&
                (d.whatsapp === lead.whatsapp ||
                  d.customerName === lead.customerName)
            );

            return (
              <div className="p-7 sm:p-10 max-h-[88vh] overflow-y-auto custom-scrollbar space-y-7">
                <div className="flex items-start justify-between gap-4 border-b border-[#EBDAD3] pb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                      Ficha do Cliente Avulso • {lead.id}
                    </span>
                    <h2 className="font-serif-title text-3xl sm:text-4xl font-normal text-[#3E2418] mt-1">
                      {lead.customerName}
                    </h2>
                    <p className="text-xs text-[#75584B] font-light mt-1">
                      WhatsApp: {lead.whatsapp} • Endereço: {lead.address} (
                      {lead.neighborhood})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clientModalRef.current?.close()}
                    className="text-xs uppercase tracking-[0.15em] text-[#75584B] hover:text-[#3E2418] cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Compras Avulsas
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      {lead.ordersCount} pedido(s)
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      Último em {formatDateBR(lead.lastOrderDate)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Total Gasto em Avulsos
                    </span>
                    <p className="font-serif-title text-2xl text-[#3E2418] mt-1">
                      R$ {lead.totalSpentAvulso.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      Cliente recorrente avulso
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F4E6E2]/55 border border-[#EBDAD3]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A] block">
                      Potencial de Assinatura
                    </span>
                    <p className="font-serif-title text-xl text-[#3E2418] mt-1">
                      Plano Home
                    </p>
                    <p className="text-[11px] text-[#75584B] font-light">
                      {lead.originNote}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                    Histórico de Encomendas Avulsas deste Cliente
                  </h3>
                  <div className="divide-y divide-[#EBDAD3] rounded-2xl border border-[#EBDAD3] bg-[#FFFDFB] overflow-hidden text-xs">
                    {leadOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#B88B4A] block">
                            {order.id} • {formatDateBR(order.deliveryDate)} (
                            {order.shift})
                          </span>
                          <p className="text-[#3E2418] font-medium">
                            {order.items
                              .map(
                                (i) =>
                                  `${i.quantity}x ${i.flavorName} (${i.size})`
                              )
                              .join(" + ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-serif-title text-lg text-[#3E2418] block">
                            R$ {order.totalValue.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-[10px] text-[#75584B]">
                            {order.productionStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={buildWhatsAppPromoUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-7 py-3.5 text-xs uppercase tracking-[0.18em] transition"
                  >
                    Enviar Convite de Assinatura no WhatsApp
                  </a>
                </div>
              </div>
            );
          })()}
      </dialog>
      </div>
    </div>
  );
}
