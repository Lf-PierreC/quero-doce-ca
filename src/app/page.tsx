"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { usePortalStore } from "@/lib/store-context";
import {
  HomeFrequency,
  HomePeriod,
  HomeSize,
  OfficePeriod,
  OfficeSize,
  PlanCategory,
} from "@/lib/store-data";
import { SubscriptionCheckoutModal } from "@/components/SubscriptionCheckoutModal";

export default function HomePage() {
  const { officePlans, homePlans, cakeFlavors } = usePortalStore();

  // Estados do Configurador (Diagrama 1)
  const [selectedCategory, setSelectedCategory] =
    useState<PlanCategory>("OFFICE");
  const [selectedOfficeSize, setSelectedOfficeSize] =
    useState<OfficeSize>("OFFICE_M");
  const [selectedOfficePeriod, setSelectedOfficePeriod] =
    useState<OfficePeriod>("SEMESTRAL");

  const [selectedHomeFrequency, setSelectedHomeFrequency] =
    useState<HomeFrequency>("SEMANAL");
  const [selectedHomeSize, setSelectedHomeSize] = useState<HomeSize>("HOME_G");
  const [selectedHomePeriod, setSelectedHomePeriod] =
    useState<HomePeriod>("TRIMESTRAL");

  // Referência do Modal de Checkout (que fica em src/components/SubscriptionCheckoutModal.tsx)
  const checkoutDialogRef = useRef<HTMLDialogElement>(null);

  const currentOfficePlan =
    officePlans.find((p) => p.id === selectedOfficeSize) || officePlans[0];
  const officeDiscount =
    currentOfficePlan.discounts[selectedOfficePeriod] || 0;
  const officeFinalMonthly = Number(
    (currentOfficePlan.baseMonthlyPrice * (1 - officeDiscount / 100)).toFixed(2)
  );

  const currentHomePlan =
    homePlans.find((p) => p.id === selectedHomeSize) || homePlans[0];
  const homeBaseMonthly = currentHomePlan.basePrices[selectedHomeFrequency];
  const homeDiscount = currentHomePlan.discounts[selectedHomePeriod] || 0;
  const homeFinalMonthly = Number(
    (homeBaseMonthly * (1 - homeDiscount / 100)).toFixed(2)
  );

  const openCheckoutModal = (
    category: PlanCategory,
    officeSize?: OfficeSize,
    homeSize?: HomeSize
  ) => {
    setSelectedCategory(category);
    if (officeSize) setSelectedOfficeSize(officeSize);
    if (homeSize) setSelectedHomeSize(homeSize);
    checkoutDialogRef.current?.showModal();
  };

  return (
    <div>
      {/* ====================================================================
          HERO DE LARGURA COMPLETA (SEM DIVISÃO, CLEAN, DELICADO E EDITORIAL)
         ==================================================================== */}
      <section className="relative w-full min-h-[84vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden bg-gradient-to-b from-[#FFFDFB] via-[#FFFDFB] to-[#FFFDFB] border-b border-[#EBDAD3]">
        {/* Halo suave feminino ao fundo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-[#F4E6E2]/40 blur-3xl"
        />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {/* Emblema / Logo Central */}
          <div className="relative w-28 h-28 sm:w-55 sm:h-55 rounded-full overflow-hidden shadow-[0_12px_35px_rgba(62,36,24,0.08)] mb-8">
            <Image
              src="/logo-marrom.png"
              alt="Quero Doce Ca"
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </div>

          <span className="text-[11px] uppercase tracking-[0.28em] text-[#B88B4A] font-medium mb-4">
            Confeitaria Afetiva • Mogi das Cruzes
          </span>

          <h1
            className="font-serif-title font-normal text-[#3E2418] leading-[1.08] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 1.5rem + 3.8vw, 4.6rem)" }}
          >
            O cheiro de bolo recém-saído do forno{" "}
            <span className="italic text-[#B88B4A]">invadindo a sua rotina</span>
            .
          </h1>

          <p className="text-sm sm:text-base text-[#75584B] max-w-xl mx-auto leading-relaxed font-light mb-10">
            Assados na manhã da entrega, sem conservantes e ainda mornos.
            Criamos momentos de acolhimento para a sua empresa ou para o café
            da tarde na sua casa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a
              href="#planos"
              onClick={() => setSelectedCategory("OFFICE")}
              className="w-full sm:w-auto rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-9 py-4 text-xs uppercase tracking-[0.2em] font-medium transition shadow-[0_8px_24px_rgba(62,36,24,0.14)]"
            >
              Assinar para empresa
            </a>
            <a
              href="#planos"
              onClick={() => setSelectedCategory("HOME")}
              className="w-full sm:w-auto rounded-full bg-[#FFFDFB] hover:bg-[#F4E6E2]/60 text-[#3E2418] border border-[#D5A8A0]/70 px-9 py-4 text-xs uppercase tracking-[0.2em] font-medium transition"
            >
              Receber em Casa
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================================
          A ARTE DE RECEBER BEM (TEXTO EDITORIAL DELICADO E CONVINCENTE)
         ==================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A]">
            Hospitalidade & Afeto
          </span>
          <h2 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#3E2418]">
            Por que um bolo fresco muda o ambiente?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 items-stretch">
          {/* Coluna Consultórios & Clínicas */}
          <div className="bg-[#FFFDFB] border border-[#EBDAD3] rounded-3xl p-6 sm:p-11 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                Para Consultórios, Clínicas & Escritórios
              </span>
              <h3 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Acolhimento que encanta pacientes e cuida da equipe
              </h3>
              <p className="text-sm text-[#75584B] leading-relaxed font-light">
                Pacientes que chegam para uma consulta ou procedimento sentem-se
                imediatamente acolhidos quando são recebidos com café passado na
                hora e uma fatia de bolo caseiro fresco. Cada pessoa alcançada
                na sua recepção guarda a delicadeza do seu atendimento.
              </p>
            </div>
            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-[#F4E6E2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#3E2418]">
              <span className="font-serif-title italic text-base text-[#75584B]">
                Acompanha emissão de Nota Fiscal
              </span>
              <a
                href="#planos"
                onClick={() => setSelectedCategory("OFFICE")}
                className="uppercase tracking-[0.18em] text-[11px] font-medium hover:text-[#B88B4A] underline underline-offset-4"
              >
                Ver Planos Office
              </a>
            </div>
          </div>

          {/* Coluna Em Casa */}
          <div className="bg-[#FFFDFB] border border-[#EBDAD3] rounded-3xl p-6 sm:p-11 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                Para o Seu Lar
              </span>
              <h3 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                A surpresa da semana com a mesa posta
              </h3>
              <p className="text-sm text-[#75584B] leading-relaxed font-light">
                Sem precisar sujar a cozinha ou correr até a padaria depois de
                uma semana intensa. Você conta quais estilos de sabores mais
                ama, escolhe se prefere receber toda semana ou a cada quinze
                dias, e nós preparamos um sabor surpresa fresquinho para a sua
                família.
              </p>
            </div>
            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-[#EBDAD3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#3E2418]">
              <span className="font-serif-title italic text-base text-[#75584B]">
                Abra a caixa e se surpreenda
              </span>
              <a
                href="#planos"
                onClick={() => setSelectedCategory("HOME")}
                className="uppercase tracking-[0.18em] text-[11px] font-medium hover:text-[#B88B4A] underline underline-offset-4"
              >
                Ver Planos Home
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          VITRINE DE PLANOS (FIEL AO DIAGRAMA 1, COM DESIGN CLEAN & MINIMALISTA)
         ==================================================================== */}
      <section
        id="planos"
        className="w-full bg-[#FFFDFB] border-y border-[#EBDAD3] py-16 sm:py-24 px-4 sm:px-6 scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A]">
              Clube de Assinatura
            </span>
            <h2 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#3E2418]">
              Escolha o seu formato ideal
            </h2>
            <p className="text-sm text-[#75584B] font-light px-2">
              Alterne abaixo entre os planos para Empresas e os planos para
              Casa.
            </p>
          </div>

          {/* Chaveador Delicado: Plano Office vs Plano Home (100% responsivo no celular) */}
          <div className="flex justify-center mb-10 sm:mb-12">
            <div
              role="radiogroup"
              aria-label="Modalidade de Assinatura"
              className="grid grid-cols-2 w-full max-w-md sm:max-w-none sm:w-auto sm:inline-flex p-1.5 rounded-2xl sm:rounded-full bg-[#FAF6F2] border border-[#EBDAD3] gap-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedCategory === "OFFICE"}
                onClick={() => setSelectedCategory("OFFICE")}
                className={`px-3 sm:px-7 py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer text-center leading-tight ${
                  selectedCategory === "OFFICE"
                    ? "bg-[#3E2418] text-[#FFFDFB] font-medium shadow-2xs"
                    : "text-[#75584B] hover:text-[#3E2418]"
                }`}
              >
                <span className="block sm:inline">Plano Office</span>{" "}
                <span className="hidden sm:inline">•</span>{" "}
                <span className="block sm:inline text-[9px] sm:text-xs opacity-80 mt-0.5 sm:mt-0">
                  Empresas
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedCategory === "HOME"}
                onClick={() => setSelectedCategory("HOME")}
                className={`px-3 sm:px-7 py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer text-center leading-tight ${
                  selectedCategory === "HOME"
                    ? "bg-[#3E2418] text-[#FFFDFB] font-medium shadow-2xs"
                    : "text-[#75584B] hover:text-[#3E2418]"
                }`}
              >
                <span className="block sm:inline">Plano Home</span>{" "}
                <span className="hidden sm:inline">•</span>{" "}
                <span className="block sm:inline text-[9px] sm:text-xs opacity-80 mt-0.5 sm:mt-0">
                  Em Casa
                </span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------
              ABA OFFICE (1x Semana -> Office P/M/G -> Mensal/Semestral/Anual)
             ------------------------------------------------------------ */}
          {selectedCategory === "OFFICE" && (
            <div className="space-y-10 sm:space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-[#EBDAD3]">
                <p className="font-serif-title italic text-lg sm:text-xl text-[#75584B] text-center md:text-left">
                  Entregas semanais fixas (1x por semana na sua empresa)
                </p>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#75584B] sm:mr-1">
                    Período:
                  </span>
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    {(["MENSAL", "SEMESTRAL", "ANUAL"] as OfficePeriod[]).map(
                      (period) => {
                        const isSelected = selectedOfficePeriod === period;
                        const discount = currentOfficePlan.discounts[period];
                        return (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSelectedOfficePeriod(period)}
                            className={`px-2 sm:px-4 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.15em] transition cursor-pointer border text-center whitespace-nowrap ${
                              isSelected
                                ? "border-[#3E2418] bg-[#3E2418] text-[#FFFDFB] font-medium"
                                : "border-[#EBDAD3] bg-[#FAF6F2] text-[#75584B] hover:border-[#D5A8A0]"
                            }`}
                          >
                            {period}
                            {discount > 0 ? ` (-${discount}%)` : ""}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {officePlans.map((plan) => {
                  const discount = plan.discounts[selectedOfficePeriod] || 0;
                  const finalMonthly = Number(
                    (plan.baseMonthlyPrice * (1 - discount / 100)).toFixed(2)
                  );
                  const isHighlighted = plan.id === "OFFICE_M";

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition border ${
                        isHighlighted
                          ? "bg-[#FAF6F2] border-[#D5A8A0]"
                          : "bg-[#FFFDFB] border-[#EBDAD3]"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#B88B4A] mb-3">
                          <span>{plan.capacityLabel}</span>
                          <span>
                            {plan.unitsPerWeek}{" "}
                            {plan.unitsPerWeek === 1 ? "bolo" : "Bolos"} /
                            semana
                          </span>
                        </div>

                        <h3 className="font-serif-title text-3xl font-normal text-[#3E2418] mb-4">
                          {plan.name}
                        </h3>

                        <div className="pb-6 mb-6 border-b border-[#EBDAD3]">
                          {discount > 0 && (
                            <span className="text-xs text-[#75584B] line-through block mb-0.5">
                              R${" "}
                              {plan.baseMonthlyPrice
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-[#75584B]">R$</span>
                            <span className="font-serif-title text-4xl font-normal text-[#3E2418]">
                              {finalMonthly.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs text-[#75584B]">/mês</span>
                          </div>
                          <p className="text-[11px] text-[#B88B4A] mt-1">
                            Total de {plan.unitsPerWeek * 4} bolos grandes por
                            mês
                          </p>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-xs text-[#75584B] leading-relaxed"
                            >
                              <Check className="w-3.5 h-3.5 text-[#B88B4A] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => openCheckoutModal("OFFICE", plan.id)}
                        className={`w-full py-3.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition cursor-pointer ${
                          isHighlighted
                            ? "bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB]"
                            : "bg-transparent hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] border border-[#3E2418]"
                        }`}
                      >
                        Escolher {plan.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------
              ABA HOME (Semanal ou Quinzenal -> 1 Unidade -> Home P/G -> Mensal/Trimestral)
             ------------------------------------------------------------ */}
          {selectedCategory === "HOME" && (
            <div className="space-y-10 sm:space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 pb-6 border-b border-[#EBDAD3]">
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#75584B] sm:mr-1">
                    Frequência:
                  </span>
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                    {(["SEMANAL", "QUINZENAL"] as HomeFrequency[]).map(
                      (freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setSelectedHomeFrequency(freq)}
                          className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.15em] transition cursor-pointer border text-center whitespace-nowrap ${
                            selectedHomeFrequency === freq
                              ? "border-[#3E2418] bg-[#3E2418] text-[#FFFDFB] font-medium"
                              : "border-[#EBDAD3] bg-[#FAF6F2] text-[#75584B]"
                          }`}
                        >
                          {freq === "SEMANAL"
                            ? "Semanal (4x/mês)"
                            : "Quinzenal (2x/mês)"}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#75584B] sm:mr-1">
                    Período:
                  </span>
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                    {(["MENSAL", "TRIMESTRAL"] as HomePeriod[]).map(
                      (period) => {
                        const discount = currentHomePlan.discounts[period];
                        return (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSelectedHomePeriod(period)}
                            className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.15em] transition cursor-pointer border text-center whitespace-nowrap ${
                              selectedHomePeriod === period
                                ? "border-[#3E2418] bg-[#3E2418] text-[#FFFDFB] font-medium"
                                : "border-[#EBDAD3] bg-[#FAF6F2] text-[#75584B]"
                            }`}
                          >
                            {period}
                            {discount > 0 ? ` (-${discount}%)` : ""}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                {homePlans.map((plan) => {
                  const baseMonthly = plan.basePrices[selectedHomeFrequency];
                  const discount = plan.discounts[selectedHomePeriod] || 0;
                  const finalMonthly = Number(
                    (baseMonthly * (1 - discount / 100)).toFixed(2)
                  );
                  const isHighlighted = plan.id === "HOME_G";

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-3xl p-6 sm:p-9 flex flex-col justify-between transition border ${
                        isHighlighted
                          ? "bg-[#FAF6F2] border-[#D5A8A0]"
                          : "bg-[#FFFDFB] border-[#EBDAD3]"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#B88B4A] mb-3">
                          <span>{plan.capacityLabel}</span>
                          <span>1 unid. / entrega</span>
                        </div>

                        <h3 className="font-serif-title text-3xl font-normal text-[#3E2418] mb-4">
                          {plan.name}
                        </h3>

                        <div className="pb-6 mb-6 border-b border-[#EBDAD3]">
                          {discount > 0 && (
                            <span className="text-xs text-[#75584B] line-through block mb-0.5">
                              R$ {baseMonthly.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-[#75584B]">R$</span>
                            <span className="font-serif-title text-4xl font-normal text-[#3E2418]">
                              {finalMonthly.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs text-[#75584B]">/mês</span>
                          </div>
                          <p className="text-[11px] text-[#B88B4A] mt-1">
                            Modalidade {selectedHomeFrequency.toLowerCase()} •{" "}
                            {selectedHomePeriod.toLowerCase()}
                          </p>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-xs text-[#75584B] leading-relaxed"
                            >
                              <Check className="w-3.5 h-3.5 text-[#B88B4A] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openCheckoutModal("HOME", undefined, plan.id)
                        }
                        className={`w-full py-3.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition cursor-pointer ${
                          isHighlighted
                            ? "bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB]"
                            : "bg-transparent hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] border border-[#3E2418]"
                        }`}
                      >
                        Escolher {plan.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          SABORES DO ATELIÊ & CONVITE PARA PEDIDO AVULSO
         ==================================================================== */}
      <section className="max-w-5xl mx-auto px-6 pt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A] block mb-2">
              Nossas Receitas
            </span>
            <h2 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#3E2418]">
              Sabores que saem do nosso forno
            </h2>
          </div>
          <Link
            href="/avulsos"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#3E2418] hover:text-[#B88B4A] border-b border-[#3E2418] pb-1 self-start md:self-auto"
          >
            <span>Pedir um bolo hoje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cakeFlavors.slice(0, 3).map((flavor) => (
            <div
              key={flavor.id}
              className="bg-[#FFFDFB] border border-[#EBDAD3] rounded-3xl p-8 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block mb-2">
                  {flavor.tag}
                </span>
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418] mb-3">
                  {flavor.name}
                </h3>
                <p className="text-xs text-[#75584B] leading-relaxed font-light mb-6">
                  {flavor.description}
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4E6E2] flex items-center justify-between text-xs text-[#75584B]">
                <span>Individual ou Tamanho Família</span>
                <Link
                  href="/avulsos"
                  className="text-[#3E2418] font-medium hover:text-[#B88B4A]"
                >
                  Encomendar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL SEPARADO EM src/components/SubscriptionCheckoutModal.tsx */}
      <SubscriptionCheckoutModal
        dialogRef={checkoutDialogRef}
        selectedCategory={selectedCategory}
        currentOfficePlan={currentOfficePlan}
        selectedOfficePeriod={selectedOfficePeriod}
        officeFinalMonthly={officeFinalMonthly}
        currentHomePlan={currentHomePlan}
        selectedHomeFrequency={selectedHomeFrequency}
        selectedHomePeriod={selectedHomePeriod}
        homeFinalMonthly={homeFinalMonthly}
      />
    </div>
  );
}
