"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { usePortalStore } from "@/lib/store-context";
import {
  CakeFlavor,
  DeliveryShift,
  findDeliveryZone,
  lookupCepViaCep,
} from "@/lib/store-data";

export default function AvulsosPage() {
  const {
    cakeFlavors,
    cart,
    currentUser,
    deliveryZones,
    addToCart,
    removeFromCart,
    clearCart,
    addAvulsoOrder,
  } = usePortalStore();

  // Diagrama 2: TAMANHO FAMÍLIA vs INDIVIDUAL
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<
    "FAMILIA" | "INDIVIDUAL"
  >("FAMILIA");
  const [extraSyrupMap, setExtraSyrupMap] = useState<Record<string, boolean>>(
    {}
  );

  // Modal de Checkout Avulso
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [customerName, setCustomerName] = useState(
    currentUser?.profile?.name || currentUser?.name || ""
  );
  const [whatsapp, setWhatsapp] = useState(
    currentUser?.profile?.whatsapp || ""
  );
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [address, setAddress] = useState(currentUser?.profile?.address || "");
  const [neighborhood, setNeighborhood] = useState(
    currentUser?.profile?.neighborhood || ""
  );
  const [deliveryDate, setDeliveryDate] = useState("2026-11-20");
  const [shift, setShift] = useState<DeliveryShift>("TARDE");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">(
    "PIX"
  );
  const [orderCompletedId, setOrderCompletedId] = useState<string | null>(null);

  const toggleSyrup = (flavorId: string) => {
    setExtraSyrupMap((prev) => ({ ...prev, [flavorId]: !prev[flavorId] }));
  };

  const handleAddFlavor = (flavor: CakeFlavor) => {
    const hasSyrup = Boolean(extraSyrupMap[flavor.id]);
    const unitPrice =
      selectedSizeFilter === "FAMILIA"
        ? flavor.priceFamilia
        : flavor.priceIndividual;

    addToCart({
      flavorId: flavor.id,
      flavorName: flavor.name,
      size: selectedSizeFilter,
      unitPrice,
      extraSyrup: hasSyrup,
      extraSyrupPrice: hasSyrup ? flavor.extraSyrupPrice : 0,
      quantity: 1,
    });
  };

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
  const shippingFee = isCityAllowed ? matchedZone?.feePerDelivery || 0 : 0;

  const activeCitiesText = deliveryZones
    .filter((z) => z.enabled)
    .map((z) => z.city)
    .join(", ");

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + (item.unitPrice + item.extraSyrupPrice) * item.quantity,
    0
  );
  const finalAvulsoTotal = cartTotal + shippingFee;

  const handleFinishAvulsoOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!isCityAllowed) {
      setCepError(
        city
          ? `Ainda não realizamos entregas em ${city}.`
          : "Informe um CEP válido dentro da nossa área de entrega."
      );
      return;
    }

    const newOrderId = `PED-${Math.floor(810 + Math.random() * 900)}`;
    addAvulsoOrder({
      id: newOrderId,
      orderType: "AVULSO",
      customerName,
      whatsapp,
      deliveryDate,
      deliveryDayLabel: "Encomenda Agendada",
      shift,
      items: cart.map((c) => ({
        flavorName: c.flavorName,
        size: c.size,
        quantity: c.quantity,
        extraSyrup: c.extraSyrup,
      })),
      address,
      neighborhood: city ? `${neighborhood} • ${city}` : neighborhood,
      productionStatus: "FILA",
      totalValue: finalAvulsoTotal,
    });

    clearCart();
    setOrderCompletedId(newOrderId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-14 sm:space-y-20">
      {/* CABEÇALHO CLEAN E DELICADO */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[11px] uppercase tracking-[0.28em] text-[#B88B4A] block">
          Fornadas sob Encomenda
        </span>
        <h1 className="font-serif-title text-4xl sm:text-6xl font-normal text-[#3E2418]">
          Cardápio de Bolos
        </h1>
        <p className="text-sm text-[#75584B] font-light leading-relaxed px-2">
          Assados no dia para um café da tarde especial, para presentear com
          afeto ou para conhecer nossas receitas antes de assinar.
        </p>

        {/* Seletor Tamanho Família vs Individual (Diagrama 2 - 100% responsivo no celular) */}
        <div className="pt-4 sm:pt-6 flex justify-center">
          <div
            role="radiogroup"
            aria-label="Escolha o tamanho do bolo avulso"
            className="grid grid-cols-2 w-full max-w-md sm:max-w-none sm:w-auto sm:inline-flex p-1.5 rounded-2xl sm:rounded-full bg-[#FFFDFB] border border-[#EBDAD3] gap-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selectedSizeFilter === "FAMILIA"}
              onClick={() => setSelectedSizeFilter("FAMILIA")}
              className={`px-3 sm:px-7 py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer text-center leading-tight ${
                selectedSizeFilter === "FAMILIA"
                  ? "bg-[#3E2418] text-[#FFFDFB] font-medium"
                  : "text-[#75584B] hover:text-[#3E2418]"
              }`}
            >
              <span className="block sm:inline">Tamanho Família</span>{" "}
              <span className="block sm:inline text-[9px] sm:text-xs opacity-80 mt-0.5 sm:mt-0">
                (6 a 10 fatias)
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedSizeFilter === "INDIVIDUAL"}
              onClick={() => setSelectedSizeFilter("INDIVIDUAL")}
              className={`px-3 sm:px-7 py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer text-center leading-tight ${
                selectedSizeFilter === "INDIVIDUAL"
                  ? "bg-[#3E2418] text-[#FFFDFB] font-medium"
                  : "text-[#75584B] hover:text-[#3E2418]"
              }`}
            >
              <span className="block sm:inline">Individual</span>{" "}
              <span className="block sm:inline text-[9px] sm:text-xs opacity-80 mt-0.5 sm:mt-0">
                (1 a 2 porções)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* LISTA EDITORIAL DE SABORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {cakeFlavors
          .filter((f) => f.availableAvulso)
          .map((flavor) => {
            const basePrice =
              selectedSizeFilter === "FAMILIA"
                ? flavor.priceFamilia
                : flavor.priceIndividual;
            const withSyrup = Boolean(extraSyrupMap[flavor.id]);
            const finalItemPrice =
              basePrice + (withSyrup ? flavor.extraSyrupPrice : 0);

            return (
              <div
                key={flavor.id}
                className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-8 border border-[#EBDAD3] flex flex-col justify-between transition hover:border-[#D5A8A0]"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
                      {flavor.tag}
                    </span>
                    {flavor.dietaryInfo && (
                      <span className="text-[10px] uppercase tracking-[0.15em] text-[#75584B] bg-[#F4E6E2]/60 px-2.5 py-0.5 rounded-full">
                        {flavor.dietaryInfo}
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif-title text-3xl font-normal text-[#3E2418] mb-2">
                    {flavor.name}
                  </h2>
                  <p className="text-xs text-[#75584B] leading-relaxed font-light mb-6">
                    {flavor.description}
                  </p>

                  {/* Opção delicada de calda extra */}
                  <div className="py-3.5 px-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]/80 mb-6">
                    <div className="flex items-center gap-3">
                      <input
                        id={`syrup-${flavor.id}`}
                        type="checkbox"
                        checked={withSyrup}
                        onChange={() => toggleSyrup(flavor.id)}
                        className="w-4 h-4 rounded shrink-0"
                      />
                      <label
                        htmlFor={`syrup-${flavor.id}`}
                        className="text-xs text-[#3E2418] cursor-pointer flex-1 flex items-center justify-between gap-2"
                      >
                        <span className="font-light">
                          Adicionar {flavor.extraSyrupName}
                        </span>
                        <span className="text-[#B88B4A] font-medium shrink-0 whitespace-nowrap">
                          + R${" "}
                          {flavor.extraSyrupPrice.toFixed(2).replace(".", ",")}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#EBDAD3] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#75584B]">
                      {selectedSizeFilter === "FAMILIA"
                        ? "Tamanho Família"
                        : "Tamanho Individual"}
                    </span>
                    <span className="font-serif-title text-3xl font-normal text-[#3E2418] whitespace-nowrap">
                      R$ {finalItemPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddFlavor(flavor)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* CONVITE SUAVE PARA ASSINATURA */}
      <div className="rounded-3xl bg-[#FFFDFB]/50 border border-[#EBDAD3] p-6 sm:p-11 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#B88B4A]">
            Clube Quero Doce Ca
          </span>
          <h3 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#3E2418]">
            Prefere receber toda semana com até 28% de desconto?
          </h3>
          <p className="text-xs text-[#75584B] font-light">
            Nossos planos Home e Office garantem fornada prioritária e valores
            especiais por entrega.
          </p>
        </div>
        <Link
          href="/#planos"
          className="w-full sm:w-auto text-center shrink-0 rounded-full border border-[#3E2418] hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] transition"
        >
          Conhecer Planos
        </Link>
      </div>

      {/* CESTA DE ENCOMENDAS AVULSAS */}
      <section
        id="sacola"
        className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-10 border border-[#EBDAD3] scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EBDAD3]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A]">
              Seu Pedido
            </span>
            <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
              Cesta de Encomendas
            </h2>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-[#75584B] hover:text-[#3E2418] underline cursor-pointer self-start sm:self-center"
            >
              Esvaziar cesta
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-serif-title italic text-2xl text-[#75584B]">
              Sua cesta ainda está vazia.
            </p>
            <p className="text-xs text-[#75584B]/80 font-light">
              Escolha um dos sabores acima no Tamanho Família ou Individual.
            </p>
          </div>
        ) : (
          <div className="pt-6 space-y-6">
            <div className="divide-y divide-[#EBDAD3]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#B88B4A]">
                      {item.size === "FAMILIA"
                        ? "Tamanho Família"
                        : "Individual"}
                    </span>
                    <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                      {item.quantity}x {item.flavorName}
                    </h3>
                    {item.extraSyrup && (
                      <p className="text-xs text-[#75584B] italic font-serif-title">
                        + Acompanha potinho extra de calda artesanal (50ml)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <span className="font-serif-title text-2xl font-normal text-[#3E2418] whitespace-nowrap">
                      R${" "}
                      {(
                        (item.unitPrice + item.extraSyrupPrice) *
                        item.quantity
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remover ${item.flavorName}`}
                      className="p-2 text-[#75584B] hover:text-red-700 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FAF6F2] p-5 sm:p-6 rounded-2xl border border-[#EBDAD3] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#75584B] block">
                  Total da Encomenda
                </span>
                <span className="font-serif-title text-4xl font-normal text-[#3E2418] whitespace-nowrap">
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderCompletedId(null);
                  dialogRef.current?.showModal();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-8 py-4 text-xs uppercase tracking-[0.2em] transition cursor-pointer"
              >
                <span>Agendar Entrega</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL NATIVO <dialog> PARA FINALIZAR PEDIDO AVULSO */}
      <dialog
        ref={dialogRef}
        aria-labelledby="avulso-checkout-title"
        className="m-auto w-[calc(100%-1.5rem)] sm:w-full max-w-xl rounded-3xl bg-[#FFFDFB] p-0 text-[#3E2418] shadow-2xl border border-[#EBDAD3]"
      >
        <div className="p-5 sm:p-9 max-h-[88vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-[#EBDAD3] pb-4 mb-6">
            <h2
              id="avulso-checkout-title"
              className="font-serif-title text-3xl font-normal"
            >
              Finalizar Encomenda
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-xs uppercase tracking-[0.15em] text-[#75584B] cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {orderCompletedId ? (
            <div className="text-center space-y-4 py-6">
              <h3 className="font-serif-title text-3xl font-normal">
                Encomenda {orderCompletedId} Recebida!
              </h3>
              <p className="text-sm text-[#75584B] font-light">
                Seu pedido já entrou na programação da nossa cozinha para a
                data escolhida.
              </p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-full bg-[#3E2418] text-[#FFFDFB] px-8 py-3 text-xs uppercase tracking-[0.2em] cursor-pointer"
              >
                Concluir
              </button>
            </div>
          ) : (
            <form onSubmit={handleFinishAvulsoOrder} className="space-y-4">
              <div>
                <label
                  htmlFor="avulso-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Seu Nome Completo *
                </label>
                <input
                  id="avulso-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>

              <div>
                <label
                  htmlFor="avulso-whatsapp"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  WhatsApp *
                </label>
                <input
                  id="avulso-whatsapp"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="avulso-cep"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    CEP de Entrega *
                  </label>
                  <input
                    id="avulso-cep"
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
                            {shippingFee > 0
                              ? `+ Frete R$ ${shippingFee
                                  .toFixed(2)
                                  .replace(".", ",")}`
                              : "✓ Frete grátis"}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-red-700 font-medium whitespace-nowrap">
                            Fora da rota atual
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-light">
                        Digite o CEP para verificar a entrega
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

              {isCityBlocked && (
                <div className="rounded-2xl bg-[#F4E6E2]/70 border border-[#D5A8A0] p-4 text-xs text-[#3E2418] space-y-2">
                  <p className="font-serif-title text-xl font-normal text-[#3E2418]">
                    Ainda não estamos entregando em {city} - {stateUf}
                  </p>
                  <p className="text-[#75584B] font-light leading-relaxed">
                    Para que seu bolo chegue fresquinho e ainda morno, por
                    enquanto entregamos apenas em{" "}
                    <strong className="text-[#3E2418]">
                      {activeCitiesText}
                    </strong>
                    .
                  </p>
                  <a
                    href={`https://wa.me/5511971661789?text=${encodeURIComponent(
                      `Olá! Tentei encomendar um bolo avulso da Quero Doce Ca para ${city} - ${stateUf} (CEP ${cep}) e gostaria de saber quando vocês vão entregar aqui!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full border border-[#3E2418] hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="avulso-address"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Endereço (Rua e Número) *
                  </label>
                  <input
                    id="avulso-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número e complemento"
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="avulso-bairro"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Bairro *
                  </label>
                  <input
                    id="avulso-bairro"
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] px-3.5 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="avulso-date"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Data da Entrega
                  </label>
                  <input
                    id="avulso-date"
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] px-3 py-2.5 text-sm bg-[#FFFDFB]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="avulso-shift"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Turno
                  </label>
                  <select
                    id="avulso-shift"
                    value={shift}
                    onChange={(e) =>
                      setShift(e.target.value as DeliveryShift)
                    }
                    className="w-full rounded-xl border border-[#EBDAD3] px-3 py-2.5 text-sm bg-[#FFFDFB]"
                  >
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="avulso-pay"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Pagamento
                  </label>
                  <select
                    id="avulso-pay"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "PIX" | "CREDIT_CARD")
                    }
                    className="w-full rounded-xl border border-[#EBDAD3] px-3 py-2.5 text-sm bg-[#FFFDFB]"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CREDIT_CARD">Cartão</option>
                  </select>
                </div>
              </div>

              {isCityAllowed && shippingFee > 0 && (
                <p className="text-xs text-[#75584B] bg-[#FAF6F2] border border-[#EBDAD3] rounded-xl px-4 py-2.5">
                  Subtotal dos bolos: R$ {cartTotal.toFixed(2).replace(".", ",")}{" "}
                  + Frete para {city}:{" "}
                  <strong className="text-[#3E2418]">
                    R$ {shippingFee.toFixed(2).replace(".", ",")}
                  </strong>
                </p>
              )}

              <button
                type="submit"
                disabled={isCityBlocked || cepLoading}
                className="w-full rounded-full bg-[#3E2418] hover:bg-[#523223] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFFDFB] py-4 text-xs uppercase tracking-[0.2em] transition cursor-pointer mt-2"
              >
                {isCityBlocked
                  ? `Entrega indisponível em ${city}`
                  : `Confirmar Encomenda • R$ ${finalAvulsoTotal
                      .toFixed(2)
                      .replace(".", ",")}`}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
}
