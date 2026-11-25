"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePortalStore } from "@/lib/store-context";
import {
  DeliveryShift,
  HomeFrequency,
  HomePeriod,
  HomePlanRule,
  OfficePeriod,
  OfficePlanRule,
  PlanCategory,
  SubscriptionRecord,
  findDeliveryZone,
  lookupCepViaCep,
} from "@/lib/store-data";

/**
 * COMPONENTE DO MODAL DE CHECKOUT E CADASTRO DE ASSINATURA
 * Localização: src/components/SubscriptionCheckoutModal.tsx
 * Aqui você pode editar todos os campos, textos e opções do modal que abre ao clicar em "Escolher Plano".
 */
interface SubscriptionCheckoutModalProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  selectedCategory: PlanCategory;
  currentOfficePlan: OfficePlanRule;
  selectedOfficePeriod: OfficePeriod;
  officeFinalMonthly: number;
  currentHomePlan: HomePlanRule;
  selectedHomeFrequency: HomeFrequency;
  selectedHomePeriod: HomePeriod;
  homeFinalMonthly: number;
}

const PREFERENCE_STYLES = [
  "Com Chocolate & Brigadeiro",
  "Cítricos & Frutados (Limão, Laranja)",
  "Tradicionais da Fazenda (Fubá, Cenoura, Coco)",
  "Especiarias & Castanhas",
];

export function SubscriptionCheckoutModal({
  dialogRef,
  selectedCategory,
  currentOfficePlan,
  selectedOfficePeriod,
  officeFinalMonthly,
  currentHomePlan,
  selectedHomeFrequency,
  selectedHomePeriod,
  homeFinalMonthly,
}: SubscriptionCheckoutModalProps) {
  const { addSubscription, deliveryZones } = usePortalStore();

  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [deliveryDay, setDeliveryDay] =
    useState<SubscriptionRecord["deliveryDay"]>("SEXTA");
  const [deliveryShift, setDeliveryShift] = useState<DeliveryShift>("TARDE");

  // Preferências para a Curadoria Surpresa da Chef
  const [favoriteStyles, setFavoriteStyles] = useState<string[]>([
    "Com Chocolate & Brigadeiro",
    "Tradicionais da Fazenda (Fubá, Cenoura, Coco)",
  ]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");

  // Pagamento Integrado Asaas direto no site
  const [paymentMethod, setPaymentMethod] =
    useState<SubscriptionRecord["paymentMethod"]>("PIX");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    subId: string;
    asaasId: string;
    pixCode?: string;
  } | null>(null);

  const toggleStylePreference = (style: string) => {
    setFavoriteStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  // Consulta automática de CEP via ViaCEP
  const handleCepChange = async (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setCep(formatted);
    setCepError(null);

    if (digits.length < 8) {
      setCity("");
      setStateUf("");
      return;
    }

    setCepLoading(true);
    const result = await lookupCepViaCep(digits);
    setCepLoading(false);

    if (!result) {
      setCity("");
      setStateUf("");
      setCepError("CEP não encontrado. Verifique os 8 números digitados.");
      return;
    }

    setCity(result.city);
    setStateUf(result.state);
    if (result.street) setAddress(result.street);
    if (result.neighborhood) setNeighborhood(result.neighborhood);
  };

  const matchedZone = city ? findDeliveryZone(deliveryZones, city, stateUf) : undefined;
  const isCityAllowed = Boolean(city && matchedZone?.enabled);
  const isCityBlocked = Boolean(city && (!matchedZone || !matchedZone.enabled));
  const deliveriesPerMonth =
    selectedCategory === "HOME" && selectedHomeFrequency === "QUINZENAL" ? 2 : 4;
  const shippingFeePerDelivery = isCityAllowed
    ? matchedZone?.feePerDelivery || 0
    : 0;
  const monthlyShippingFee = shippingFeePerDelivery * deliveriesPerMonth;

  const baseMonthlyValue =
    selectedCategory === "OFFICE" ? officeFinalMonthly : homeFinalMonthly;
  const monthlyValue = Number(
    (baseMonthlyValue + monthlyShippingFee).toFixed(2)
  );

  const activeCitiesText = deliveryZones
    .filter((z) => z.enabled)
    .map((z) => z.city)
    .join(", ");

  const handleConfirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCityAllowed) {
      setCepError(
        city
          ? `Ainda não realizamos entregas em ${city}.`
          : "Informe um CEP válido dentro da nossa área de entrega."
      );
      return;
    }
    setIsSubmitting(true);

    const planName =
      selectedCategory === "OFFICE"
        ? `${currentOfficePlan.name} (${currentOfficePlan.capacityLabel})`
        : `${currentHomePlan.name} (${currentHomePlan.capacityLabel})`;

    try {
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SUBSCRIPTION",
          customerName,
          companyOrClinicName:
            selectedCategory === "OFFICE" ? companyName : undefined,
          document: documentId,
          email,
          whatsapp,
          billingType: paymentMethod,
          value: monthlyValue,
          description: `Assinatura Quero Doce Ca - ${planName}`,
        }),
      });
      const data = await res.json();

      const newSubId = `SUB-${Math.floor(1006 + Math.random() * 8999)}`;
      const cleanCardDigits = cardNumber.replace(/\D/g, "");

      const newSub: SubscriptionRecord = {
        id: newSubId,
        customerName,
        companyOrClinicName:
          selectedCategory === "OFFICE" ? companyName : undefined,
        email,
        whatsapp,
        document: documentId,
        category: selectedCategory,
        planCode:
          selectedCategory === "OFFICE"
            ? currentOfficePlan.id
            : currentHomePlan.id,
        planName,
        frequency:
          selectedCategory === "OFFICE" ? "SEMANAL" : selectedHomeFrequency,
        unitsPerDelivery:
          selectedCategory === "OFFICE"
            ? currentOfficePlan.unitsPerWeek
            : currentHomePlan.unitsPerDelivery,
        period:
          selectedCategory === "OFFICE"
            ? selectedOfficePeriod
            : selectedHomePeriod,
        monthlyValue,
        status: "ATIVA",
        deliveryDay,
        deliveryShift,
        address,
        neighborhood,
        selectedFlavorsNextDelivery: ["Surpresa da Chef (Curadoria Semanal)"],
        favoriteStyles,
        dietaryRestrictions: dietaryRestrictions || "Nenhuma restrição",
        asaasSubscriptionId: data.asaasId || "sub_asaas_demo",
        paymentMethod,
        cardLast4:
          paymentMethod === "CREDIT_CARD" && cleanCardDigits.length >= 4
            ? cleanCardDigits.slice(-4)
            : undefined,
        cardBrand: paymentMethod === "CREDIT_CARD" ? "Cartão Ativo" : undefined,
        createdAt: new Date().toISOString().split("T")[0],
        nextDeliveryDate: "2026-11-20",
      };

      addSubscription(newSub);
      setCheckoutSuccess({
        subId: newSubId,
        asaasId: data.asaasId || "sub_asaas_demo",
        pixCode: data.pixCopyPaste,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="checkout-modal-title"
      className="m-auto w-[calc(100%-1.5rem)] sm:w-full max-w-2xl rounded-3xl bg-[#FFFDFB] p-0 text-[#3E2418] shadow-2xl border border-[#EBDAD3] overflow-hidden"
    >
      <div className="p-5 sm:p-10 max-h-[88vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 border-b border-[#EBDAD3] pb-5 mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
              Ativação de Assinatura • Quero Doce Ca
            </span>
            <h2
              id="checkout-modal-title"
              className="font-serif-title text-2xl sm:text-3xl font-normal text-[#3E2418] mt-1"
            >
              {selectedCategory === "OFFICE"
                ? `${currentOfficePlan.name} (${selectedOfficePeriod})`
                : `${currentHomePlan.name} (${selectedHomeFrequency} • ${selectedHomePeriod})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckoutSuccess(null);
              dialogRef.current?.close();
            }}
            className="text-xs uppercase tracking-[0.15em] text-[#75584B] hover:text-[#3E2418] cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>

        {checkoutSuccess ? (
          <div className="space-y-6 py-6 text-center">
            <h3 className="font-serif-title text-3xl font-normal text-[#3E2418]">
              Seja bem-vinda(o) à Quero Doce Ca!
            </h3>
            <p className="text-sm text-[#75584B] max-w-md mx-auto font-light">
              Sua assinatura <strong>{checkoutSuccess.subId}</strong> foi
              registrada com suas preferências para a nossa Surpresa da Semana!
            </p>

            {paymentMethod === "PIX" && checkoutSuccess.pixCode && (
              <div className="bg-[#FAF6F2] p-5 rounded-2xl border border-[#EBDAD3] text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] mb-2">
                  PIX Copia e Cola (Asaas Recorrência):
                </p>
                <code className="block text-[11px] break-all bg-[#FFFDFB] p-3 rounded-xl border border-[#EBDAD3] text-[#3E2418]">
                  {checkoutSuccess.pixCode}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/minha-conta"
                onClick={() => {
                  setCheckoutSuccess(null);
                  dialogRef.current?.close();
                }}
                className="rounded-full bg-[#3E2418] text-[#FFFDFB] px-7 py-3.5 text-xs uppercase tracking-[0.18em]"
              >
                Acessar Minha Conta
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmSubscription} className="space-y-6">
            {/* Resumo do Plano */}
            <div className="bg-[#FAF6F2] p-4 sm:p-5 rounded-2xl border border-[#EBDAD3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#3E2418]">
                  Resumo da sua escolha
                </p>
                <p className="text-xs text-[#75584B] font-light">
                  {selectedCategory === "OFFICE"
                    ? `${currentOfficePlan.unitsPerWeek} bolo(s) grande(s) por semana • ${selectedOfficePeriod}`
                    : `1 bolo (${currentHomePlan.capacityLabel}) • ${selectedHomeFrequency} • ${selectedHomePeriod}`}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="font-serif-title text-2xl font-normal text-[#3E2418] whitespace-nowrap">
                  R$ {monthlyValue.toFixed(2).replace(".", ",")}
                </span>
                <span className="inline sm:block ml-1.5 sm:ml-0 text-[10px] text-[#B88B4A] uppercase tracking-widest">
                  mensal
                </span>
              </div>
            </div>

            {/* 1. Dados Pessoais / Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sub-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Seu Nome Completo *
                </label>
                <input
                  id="sub-name"
                  name="customerName"
                  type="text"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>

              {selectedCategory === "OFFICE" && (
                <div>
                  <label
                    htmlFor="sub-company"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Nome da Empresa *
                  </label>
                  <input
                    id="sub-company"
                    name="companyName"
                    type="text"
                    required
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="sub-doc"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  {selectedCategory === "OFFICE" ? "CNPJ ou CPF *" : "CPF *"}
                </label>
                <input
                  id="sub-doc"
                  name="document"
                  type="text"
                  inputMode="numeric"
                  required
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>

              <div>
                <label
                  htmlFor="sub-whatsapp"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  WhatsApp *
                </label>
                <input
                  id="sub-whatsapp"
                  name="whatsapp"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="sub-email"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  E-mail de Acesso à Conta *
                </label>
                <input
                  id="sub-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>
            </div>

            {/* 2. Preferências para a Surpresa da Semana (Item 3) */}
            <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                  Curadoria Surpresa Quero Doce Ca
                </span>
                <p className="text-xs font-medium text-[#3E2418] mt-0.5">
                  Toda semana o sabor é uma surpresa escolhida por nós! Conte
                  quais estilos você mais ama para guiarmos sua experiência:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {PREFERENCE_STYLES.map((style) => {
                  const checked = favoriteStyles.includes(style);
                  return (
                    <label
                      key={style}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        checked
                          ? "bg-[#FFFDFB] border-[#3E2418] text-[#3E2418] font-medium"
                          : "bg-[#FFFDFB]/60 border-[#EBDAD3] text-[#75584B]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStylePreference(style)}
                        className="w-3.5 h-3.5 rounded"
                      />
                      <span>{style}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-1">
                <label
                  htmlFor="sub-restrictions"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Algum ingrediente que você não gosta ou restrição? (Opcional)
                </label>
                <input
                  id="sub-restrictions"
                  type="text"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="Ex: Não gosto de canela / erva-doce, evitar amendoim..."
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2 text-xs bg-[#FFFDFB]"
                />
              </div>
            </div>

            {/* 3. CEP, Validação de Área de Entrega, Endereço e Turno */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="sub-cep"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    CEP de Entrega *
                  </label>
                  <input
                    id="sub-cep"
                    name="cep"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    required
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="08700-000"
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <div className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2] px-3.5 py-2.5 text-xs text-[#75584B] min-h-[42px] flex items-center justify-between gap-2">
                    {cepLoading ? (
                      <span>Consultando CEP...</span>
                    ) : city ? (
                      <>
                        <span className="text-[#3E2418] font-medium">
                          {city} - {stateUf}
                        </span>
                        {isCityAllowed ? (
                          <span className="text-[10px] uppercase tracking-wider text-[#B88B4A] font-medium whitespace-nowrap">
                            {shippingFeePerDelivery > 0
                              ? `+ R$ ${shippingFeePerDelivery
                                  .toFixed(2)
                                  .replace(".", ",")}/entrega`
                              : "✓ Frete incluso"}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-red-700 font-medium whitespace-nowrap">
                            Fora da rota atual
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-light">
                        Digite seu CEP para verificar a entrega e preencher o
                        endereço
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {cepError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                  {cepError}
                </p>
              )}

              {isCityAllowed && shippingFeePerDelivery > 0 && (
                <div className="rounded-2xl bg-[#FAF6F2] border border-[#D5A8A0] p-4 text-xs text-[#3E2418] space-y-1">
                  <p className="font-medium">
                    Entregamos em {city} com taxa regional de R${" "}
                    {shippingFeePerDelivery.toFixed(2).replace(".", ",")} por
                    entrega!
                  </p>
                  <p className="text-[#75584B] font-light">
                    Total mensal com frete ({deliveriesPerMonth} entregas/mês):{" "}
                    <strong className="text-[#3E2418]">
                      R$ {monthlyValue.toFixed(2).replace(".", ",")}/mês
                    </strong>{" "}
                    (Plano R$ {baseMonthlyValue.toFixed(2).replace(".", ",")}{" "}
                    + Frete R$ {monthlyShippingFee.toFixed(2).replace(".", ",")}
                    ).
                  </p>
                </div>
              )}

              {isCityBlocked && (
                <div className="rounded-2xl bg-[#F4E6E2]/70 border border-[#D5A8A0] p-4 sm:p-5 text-xs text-[#3E2418] space-y-2.5">
                  <p className="font-serif-title text-xl font-normal text-[#3E2418]">
                    Ainda não estamos entregando em {city} - {stateUf}
                  </p>
                  <p className="text-[#75584B] font-light leading-relaxed">
                    Para garantir que cada bolo chegue recém-saído do forno e
                    ainda morno até você, no momento realizamos entregas apenas
                    em <strong className="text-[#3E2418]">{activeCitiesText}</strong>.
                    Em breve queremos expandir para a sua região!
                  </p>
                  <a
                    href={`https://wa.me/5511971661789?text=${encodeURIComponent(
                      `Olá! Tentei assinar um bolo da Quero Doce Ca para ${city} - ${stateUf} (CEP ${cep}) e gostaria de ser avisado(a) quando vocês começarem a entregar aqui!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full border border-[#3E2418] hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition"
                  >
                    Avise-me no WhatsApp quando chegar em {city}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="sub-address"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Endereço Completo (Rua e Número) *
                  </label>
                  <input
                    id="sub-address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número e complemento"
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sub-neighborhood"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Bairro *
                  </label>
                  <input
                    id="sub-neighborhood"
                    name="neighborhood"
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sub-day"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Dia da Entrega
                </label>
                <select
                  id="sub-day"
                  name="deliveryDay"
                  value={deliveryDay}
                  onChange={(e) =>
                    setDeliveryDay(
                      e.target.value as SubscriptionRecord["deliveryDay"]
                    )
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                >
                  <option value="TERCA">Terça-feira</option>
                  <option value="QUINTA">Quinta-feira</option>
                  <option value="SEXTA">Sexta-feira</option>
                  <option value="SABADO">Sábado</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sub-shift"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Período da Entrega
                </label>
                <select
                  id="sub-shift"
                  name="deliveryShift"
                  value={deliveryShift}
                  onChange={(e) =>
                    setDeliveryShift(e.target.value as DeliveryShift)
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                >
                  <option value="MANHA">Manhã (08h às 11h30)</option>
                  <option value="TARDE">Tarde (13h30 às 17h30)</option>
                  {selectedCategory === "HOME" && (
                    <option value="NOITE">
                      Noite (18h30 às 21h00 • Exclusivo Home)
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* 4. Pagamento Transparente Asaas no Próprio Site (Item 5) */}
            <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block">
                  Checkout Transparente Asaas
                </span>
                <p className="text-xs font-medium text-[#3E2418]">
                  Escolha como deseja pagar sem sair do site:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: "PIX", label: "PIX Automático" },
                    { id: "CREDIT_CARD", label: "Cartão de Crédito" },
                    { id: "BOLETO", label: "Boleto + NFS-e" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs border transition cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-[#3E2418] text-[#FFFDFB] border-[#3E2418] font-medium"
                        : "bg-[#FFFDFB] text-[#75584B] border-[#EBDAD3]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === "CREDIT_CARD" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cc-name"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Nome impresso no cartão *
                    </label>
                    <input
                      id="cc-name"
                      type="text"
                      autoComplete="cc-name"
                      required
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="Como está no cartão"
                      className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2 text-xs bg-[#FFFDFB]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cc-num"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Número do Cartão *
                    </label>
                    <input
                      id="cc-num"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2 text-xs bg-[#FFFDFB]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cc-exp"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Validade (MM/AA) *
                    </label>
                    <input
                      id="cc-exp"
                      type="text"
                      autoComplete="cc-exp"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="08/30"
                      className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2 text-xs bg-[#FFFDFB]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cc-csc"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      CVV *
                    </label>
                    <input
                      id="cc-csc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2 text-xs bg-[#FFFDFB]"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "PIX" && (
                <p className="text-[11px] text-[#75584B] font-light">
                  Ao confirmar, o QR Code e código PIX Copia e Cola serão
                  exibidos imediatamente nesta tela.
                </p>
              )}

              {paymentMethod === "BOLETO" && (
                <p className="text-[11px] text-[#75584B] font-light">
                  O boleto bancário registrado e a Nota Fiscal (NFS-e) serão
                  gerados automaticamente pelo Asaas para o seu CPF/CNPJ.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isCityBlocked || cepLoading}
              className="w-full rounded-full bg-[#3E2418] hover:bg-[#523223] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFFDFB] py-4 text-xs uppercase tracking-[0.2em] font-medium transition cursor-pointer"
            >
              {isSubmitting
                ? "Processando..."
                : isCityBlocked
                ? `Entrega indisponível em ${city}`
                : `Confirmar Assinatura • R$ ${monthlyValue
                    .toFixed(2)
                    .replace(".", ",")}/mês`}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
