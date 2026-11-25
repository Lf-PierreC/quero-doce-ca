"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LogOut,
  Copy,
  Check,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { usePortalStore } from "@/lib/store-context";
import {
  DeliveryShift,
  HomeSize,
  OfficeSize,
  SubscriptionRecord,
} from "@/lib/store-data";

const PREFERENCE_STYLES = [
  "Com Chocolate & Brigadeiro",
  "Cítricos & Frutados (Limão, Laranja)",
  "Tradicionais da Fazenda (Fubá, Cenoura, Coco)",
  "Especiarias & Castanhas",
];

export default function MinhaContaPage() {
  const router = useRouter();
  const {
    officePlans,
    homePlans,
    subscriptions,
    currentUser,
    loginWithEmail,
    registerCustomerAccount,
    logout,
    updateSubscriptionStatus,
    updateSubscriptionDetails,
  } = usePortalStore();

  // Alternância entre Entrar (Login) e Cadastrar-se (Item 7)
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados de Cadastro Livre (sem obrigar assinatura imediata)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regNeighborhood, setRegNeighborhood] = useState("");
  const [regStyles, setRegStyles] = useState<string[]>([
    "Com Chocolate & Brigadeiro",
  ]);

  // Estados da Área Logada
  const [activeTab, setActiveTab] = useState<
    "ASSINATURA" | "PAGAMENTO" | "DADOS_CONTA"
  >("ASSINATURA");
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  // Campos de Cartão Asaas na aba de Pagamento
  const [ccHolder, setCcHolder] = useState("");
  const [ccNumber, setCcNumber] = useState("");
  const [ccExpiry, setCcExpiry] = useState("");
  const [ccCvv, setCcCvv] = useState("");

  const showToast = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await loginWithEmail(loginEmail, loginPassword);
      if (!res.ok) {
        setLoginError(res.error || "Não foi possível entrar na sua conta.");
        return;
      }
      if (res.role === "ADMIN") {
        router.push("/admin");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerCustomerAccount(
      {
        name: regName,
        email: regEmail,
        whatsapp: regWhatsapp,
        address: regAddress,
        neighborhood: regNeighborhood,
        favoriteStyles: regStyles,
      },
      regPassword
    );
    showToast(
      "Sua conta foi criada! Você pode pedir bolos avulsos ou ativar uma assinatura quando quiser."
    );
  };

  const toggleRegStyle = (style: string) => {
    setRegStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  // =========================================================================
  // 1. TELA DE LOGIN OU CADASTRO (ITEM 7: CADASTRAR-SE PARA AVULSOS OU PLANOS)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="rounded-3xl bg-[#FFFDFB] border border-[#EBDAD3] p-6 sm:p-10 shadow-[0_12px_40px_rgba(62,36,24,0.05)]">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#EBDAD3] mb-4">
              <Image
                src="/logo-marrom.png"
                alt="Quero Doce Ca"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#B88B4A] mb-1">
              Espaço do Cliente
            </span>
            <h1 className="font-serif-title text-3xl sm:text-4xl font-normal text-[#3E2418]">
              {authMode === "LOGIN"
                ? "Entrar na Minha Conta"
                : "Criar Minha Conta"}
            </h1>
            <p className="text-xs text-[#75584B] font-light mt-2 leading-relaxed">
              {authMode === "LOGIN"
                ? "Gerencie sua assinatura, preferências de sabores, pagamentos e encomendas."
                : "Cadastre-se gratuitamente para pedir bolos avulsos com 1 clique ou para assinar um plano quando desejar."}
            </p>
          </div>

          {/* Chaveador Entrar vs Cadastrar-se */}
          <div className="grid grid-cols-2 p-1 rounded-full bg-[#FAF6F2] border border-[#EBDAD3] mb-7">
            <button
              type="button"
              onClick={() => setAuthMode("LOGIN")}
              className={`py-2.5 px-2 rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer ${
                authMode === "LOGIN"
                  ? "bg-[#3E2418] text-[#FFFDFB] font-medium"
                  : "text-[#75584B] hover:text-[#3E2418]"
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("REGISTER")}
              className={`py-2.5 px-2 rounded-full text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] transition cursor-pointer ${
                authMode === "REGISTER"
                  ? "bg-[#3E2418] text-[#FFFDFB] font-medium"
                  : "text-[#75584B] hover:text-[#3E2418]"
              }`}
            >
              Cadastrar-se
            </button>
          </div>

          {authMode === "LOGIN" ? (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs text-[#75584B] mb-1.5"
                  >
                    E-mail cadastrado
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com.br"
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-4 py-3 text-sm text-[#3E2418]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="current-password"
                      className="block text-xs text-[#75584B]"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          "Enviamos um link de redefinição para o seu e-mail."
                        )
                      }
                      className="text-[11px] text-[#B88B4A] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="current-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      enterKeyHint="done"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-4 py-3 pr-11 text-sm text-[#3E2418]"
                    />
                    <button
                      type="button"
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#75584B] hover:text-[#3E2418] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 stroke-[1.5]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800"
                  >
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-full bg-[#3E2418] hover:bg-[#523223] disabled:opacity-60 text-[#FFFDFB] py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition cursor-pointer"
                >
                  {isLoggingIn ? "Entrando..." : "Entrar na Minha Conta"}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Nome Completo ou Nome da Empresa *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    E-mail *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-whats"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    WhatsApp *
                  </label>
                  <input
                    id="reg-whats"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={regWhatsapp}
                    onChange={(e) => setRegWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-pass"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Crie uma Senha *
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="reg-addr"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Endereço de Entrega (Opcional agora)
                  </label>
                  <input
                    id="reg-addr"
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-bairro"
                    className="block text-xs text-[#75584B] mb-1"
                  >
                    Bairro
                  </label>
                  <input
                    id="reg-bairro"
                    type="text"
                    value={regNeighborhood}
                    onChange={(e) => setRegNeighborhood(e.target.value)}
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="pt-1">
                <span className="block text-xs text-[#75584B] mb-2">
                  Quais estilos de bolo você mais gosta?
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {PREFERENCE_STYLES.map((style) => {
                    const checked = regStyles.includes(style);
                    return (
                      <label
                        key={style}
                        className="flex items-center gap-2 text-xs text-[#3E2418] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRegStyle(style)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span>{style}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition cursor-pointer mt-2"
              >
                Criar Conta Gratuita
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Verifica se o cliente logado tem uma assinatura vinculada ou se é um cliente cadastrado que ainda não assinou
  const activeSub = subscriptions.find(
    (s) =>
      s.id === currentUser.subscriptionId ||
      s.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  // =========================================================================
  // 2. SE O CLIENTE SE CADASTROU MAS AINDA NÃO TEM ASSINATURA (PODE PEDIR AVULSO OU ASSINAR)
  // =========================================================================
  if (!activeSub) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EBDAD3]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A] block mb-1">
              Bem-vinda(o), {currentUser.name}
            </span>
            <h1 className="font-serif-title text-4xl sm:text-5xl font-normal text-[#3E2418]">
              Minha Conta
            </h1>
            <p className="text-xs text-[#75584B] font-light mt-1">
              {currentUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-[#EBDAD3] bg-[#FFFDFB] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#75584B] hover:text-[#3E2418] cursor-pointer self-start"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-[#FFFDFB] border border-[#EBDAD3] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F2] border border-[#EBDAD3] flex items-center justify-center text-[#B88B4A]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                Pronta Encomenda
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Pedir Bolos Avulsos
              </h2>
              <p className="text-xs text-[#75584B] font-light leading-relaxed">
                Você não precisa ter uma assinatura para aproveitar nossos bolos
                fresquinhos. Escolha entre os tamanhos Família ou Individual
                sempre que bater vontade!
              </p>
            </div>
            <Link
              href="/avulsos"
              className="w-full text-center rounded-full bg-[#3E2418] text-[#FFFDFB] py-3.5 text-xs uppercase tracking-[0.2em]"
            >
              Ir para o Cardápio Avulso
            </Link>
          </div>

          <div className="rounded-3xl bg-[#F4E6E2]/55 border border-[#EBDAD3] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FFFDFB] border border-[#EBDAD3] flex items-center justify-center text-[#B88B4A]">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                Clube Quero Doce Ca
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Ativar um Plano de Assinatura
              </h2>
              <p className="text-xs text-[#75584B] font-light leading-relaxed">
                Quer receber a Surpresa da Chef toda semana ou quinzenalmente em
                casa ou no seu consultório com até 20% de economia?
              </p>
            </div>
            <Link
              href="/#planos"
              className="w-full text-center rounded-full border border-[#3E2418] hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] py-3.5 text-xs uppercase tracking-[0.2em] transition"
            >
              Conhecer Planos Home & Office
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. PAINEL COMPLETO DO ASSINANTE (ITENS 3, 4, 5 E 6)
  // =========================================================================
  const currentStyles = activeSub.favoriteStyles || [
    "Com Chocolate & Brigadeiro",
  ];

  const handleToggleFavoriteStyle = (style: string) => {
    const nextStyles = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style];
    updateSubscriptionDetails(activeSub.id, { favoriteStyles: nextStyles });
    showToast("Suas preferências para a Surpresa da Semana foram salvas!");
  };

  const handleChangePlanCode = (newCode: OfficeSize | HomeSize) => {
    if (activeSub.category === "OFFICE") {
      const planObj = officePlans.find((p) => p.id === newCode);
      if (!planObj) return;
      const discount =
        planObj.discounts[
          activeSub.period as keyof typeof planObj.discounts
        ] || 0;
      const newMonthly = Number(
        (planObj.baseMonthlyPrice * (1 - discount / 100)).toFixed(2)
      );
      updateSubscriptionDetails(activeSub.id, {
        planCode: planObj.id,
        planName: `${planObj.name} (${planObj.capacityLabel})`,
        unitsPerDelivery: planObj.unitsPerWeek,
        monthlyValue: newMonthly,
      });
      showToast(`Seu plano foi alterado para ${planObj.name}!`);
    } else {
      const planObj = homePlans.find((p) => p.id === newCode);
      if (!planObj) return;
      const base = planObj.basePrices[activeSub.frequency];
      const discount =
        planObj.discounts[
          activeSub.period as keyof typeof planObj.discounts
        ] || 0;
      const newMonthly = Number((base * (1 - discount / 100)).toFixed(2));
      updateSubscriptionDetails(activeSub.id, {
        planCode: planObj.id,
        planName: `${planObj.name} (${planObj.capacityLabel})`,
        monthlyValue: newMonthly,
      });
      showToast(`Seu plano foi alterado para ${planObj.name}!`);
    }
  };

  const formatDateBR = (isoDate: string) => {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const addDaysToIso = (isoDate: string, days: number) => {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return dt.toISOString().split("T")[0];
  };

  const dayNamesPT: Record<SubscriptionRecord["deliveryDay"], string> = {
    TERCA: "Terça-feira",
    QUINTA: "Quinta-feira",
    SEXTA: "Sexta-feira",
    SABADO: "Sábado",
  };

  const shiftNamesPT: Record<DeliveryShift, string> = {
    MANHA: "Manhã",
    TARDE: "Tarde",
    NOITE: "Noite",
  };

  // Item 6: Viagem Inteligente — mostra a data exata que receberia, adia para a próxima semana/quinzena e permite voltar atrás
  const handleRescheduleTravelDelivery = () => {
    const currentCredits = activeSub.rescheduledDeliveriesCount || 0;
    const currentSkipped = activeSub.skippedDates || [];
    const daysToAdd = activeSub.frequency === "QUINZENAL" ? 14 : 7;
    const originalDate = activeSub.nextDeliveryDate;
    const newNextDate = addDaysToIso(originalDate, daysToAdd);

    updateSubscriptionDetails(activeSub.id, {
      rescheduledDeliveriesCount: currentCredits + activeSub.unitsPerDelivery,
      skippedDates: [...currentSkipped, originalDate],
      nextDeliveryDate: newNextDate,
    });
    showToast(
      `Entrega de ${formatDateBR(originalDate)} pulada! Você receberá ${
        activeSub.unitsPerDelivery + currentCredits + activeSub.unitsPerDelivery
      } bolo(s) juntos no dia ${formatDateBR(newNextDate)}.`
    );
  };

  const handleUndoLastSkip = () => {
    const currentSkipped = activeSub.skippedDates || [];
    if (currentSkipped.length === 0) return;

    const restoredDate = currentSkipped[currentSkipped.length - 1];
    const remainingSkipped = currentSkipped.slice(0, -1);
    const currentCredits = activeSub.rescheduledDeliveriesCount || 0;
    const nextCredits = Math.max(0, currentCredits - activeSub.unitsPerDelivery);

    updateSubscriptionDetails(activeSub.id, {
      nextDeliveryDate: restoredDate,
      skippedDates: remainingSkipped,
      rescheduledDeliveriesCount: nextCredits,
    });
    showToast(
      `Desfeito! Sua próxima entrega voltou para o dia ${formatDateBR(
        restoredDate
      )}.`
    );
  };

  const handleSaveCreditCardAsaas = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = ccNumber.replace(/\D/g, "");
    updateSubscriptionDetails(activeSub.id, {
      paymentMethod: "CREDIT_CARD",
      cardLast4: digits.slice(-4) || "4490",
      cardBrand: "Mastercard / Visa",
    });
    setCcNumber("");
    setCcCvv("");
    showToast(
      "Cartão tokenizado e vinculado à sua assinatura no Asaas com sucesso!"
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 sm:space-y-10">
      {/* CABEÇALHO DO ASSINANTE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EBDAD3]">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B4A] block mb-1">
            Olá, {currentUser.name}
          </span>
          <h1 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#3E2418]">
            Minha Assinatura & Conta
          </h1>
          <p className="text-xs text-[#75584B] font-light mt-1 break-all sm:break-normal">
            {currentUser.email} • Assinatura {activeSub.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start sm:self-auto">
          {currentUser.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-full bg-[#3E2418] text-[#FFFDFB] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
            >
              Painel Admin
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-[#EBDAD3] bg-[#FFFDFB] hover:border-[#D5A8A0] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#75584B] hover:text-[#3E2418] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
            Sair da Conta
          </button>
        </div>
      </div>

      {savedFeedback && (
        <div
          role="status"
          className="rounded-2xl bg-[#F4E6E2] border border-[#D5A8A0] px-5 py-3.5 text-xs text-[#3E2418]"
        >
          {savedFeedback}
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS DO CLIENTE */}
      <div
        role="tablist"
        aria-label="Seções da conta do cliente"
        className="flex overflow-x-auto gap-6 sm:gap-8 border-b border-[#EBDAD3]"
      >
        {[
          {
            id: "ASSINATURA" as const,
            label: "Meu Plano",
          },
          {
            id: "PAGAMENTO" as const,
            label: "Formas de Pagamento",
          },
          {
            id: "DADOS_CONTA" as const,
            label: "Editar Cadastro",
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`acc-tab-${tab.id}`}
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
          ABA 1: MEU PLANO, PREFERÊNCIAS DA SURPRESA, ALTERAR/CANCELAR E VIAGEM
         ==================================================================== */}
      {activeTab === "ASSINATURA" && (
        <div
          role="tabpanel"
          aria-labelledby="acc-tab-ASSINATURA"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8"
        >
          <div className="lg:col-span-8 space-y-8">
            {/* Card Principal: Preferências da Surpresa & Horário */}
            <div className="rounded-3xl bg-[#FFFDFB] p-6 sm:p-10 border border-[#EBDAD3] space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EBDAD3] pb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block mb-1">
                    Plano {activeSub.category} • Status: {activeSub.status}
                  </span>
                  <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                    {activeSub.planName}
                  </h2>
                  <p className="text-xs text-[#75584B] font-light mt-1">
                    Frequência {activeSub.frequency.toLowerCase()} • Período{" "}
                    {activeSub.period.toLowerCase()}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-serif-title text-3xl font-normal text-[#3E2418] whitespace-nowrap">
                    R$ {activeSub.monthlyValue.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="block text-[11px] text-[#75584B] font-light">
                    por mês
                  </span>
                </div>
              </div>

              {/* ITEM 3: CURADORIA SURPRESA DA CHEF + PREFERÊNCIAS DO CLIENTE */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B4A] block mb-1">
                    A Experiência Quero Doce Ca
                  </span>
                  <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                    O sabor de cada entrega é uma surpresa escolhida por nós!
                  </h3>
                  <p className="text-xs text-[#75584B] font-light mt-1 leading-relaxed">
                    Para que toda caixa aberta seja inesquecível, nossa chef
                    seleciona a receita da semana com base nos estilos que você
                    mais gosta abaixo:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PREFERENCE_STYLES.map((style) => {
                    const isChecked = currentStyles.includes(style);
                    return (
                      <label
                        key={style}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-[#FAF6F2] border-[#3E2418] text-[#3E2418] font-medium"
                            : "bg-[#FFFDFB] border-[#EBDAD3] text-[#75584B]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFavoriteStyle(style)}
                          className="w-4 h-4 rounded shrink-0"
                        />
                        <span>{style}</span>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="pref-restrictions"
                    className="block text-xs text-[#75584B] mb-1.5"
                  >
                    Restrições ou ingredientes que prefere evitar nas suas
                    surpresas:
                  </label>
                  <input
                    id="pref-restrictions"
                    type="text"
                    value={activeSub.dietaryRestrictions || ""}
                    onChange={(e) =>
                      updateSubscriptionDetails(activeSub.id, {
                        dietaryRestrictions: e.target.value,
                      })
                    }
                    placeholder="Ex: Não gosto de canela, evitar cobertura escura..."
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* ITEM 4: DIA E PERÍODO DE ENTREGA (COM PERÍODO NOTURNO NO HOME) */}
              <div className="pt-6 border-t border-[#EBDAD3] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="acc-day"
                    className="block text-xs text-[#75584B] mb-1.5"
                  >
                    Dia da entrega ({activeSub.frequency.toLowerCase()})
                  </label>
                  <select
                    id="acc-day"
                    value={activeSub.deliveryDay}
                    onChange={(e) => {
                      updateSubscriptionDetails(activeSub.id, {
                        deliveryDay:
                          e.target.value as SubscriptionRecord["deliveryDay"],
                      });
                      showToast("Dia de entrega atualizado.");
                    }}
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                  >
                    <option value="TERCA">Terça-feira</option>
                    <option value="QUINTA">Quinta-feira</option>
                    <option value="SEXTA">Sexta-feira</option>
                    <option value="SABADO">Sábado</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="acc-shift"
                    className="block text-xs text-[#75584B] mb-1.5"
                  >
                    Período de entrega
                  </label>
                  <select
                    id="acc-shift"
                    value={activeSub.deliveryShift}
                    onChange={(e) => {
                      updateSubscriptionDetails(activeSub.id, {
                        deliveryShift: e.target.value as DeliveryShift,
                      });
                      showToast("Período de entrega atualizado.");
                    }}
                    className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                  >
                    <option value="MANHA">Manhã (08h00 às 11h30)</option>
                    <option value="TARDE">Tarde (13h30 às 17h30)</option>
                    {activeSub.category === "HOME" && (
                      <option value="NOITE">
                        Noite (18h30 às 21h00 • Plano Home)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* ITEM 5: ALTERAR DE PLANO OU CANCELAR ASSINATURA */}
              <div className="pt-6 border-t border-[#EBDAD3] space-y-4">
                <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                  Alterar Meu Plano ou Cancelar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label
                      htmlFor="change-plan-select"
                      className="block text-xs text-[#75584B] mb-1.5"
                    >
                      Mudar tamanho do plano ({activeSub.category}):
                    </label>
                    <select
                      id="change-plan-select"
                      value={activeSub.planCode}
                      onChange={(e) =>
                        handleChangePlanCode(
                          e.target.value as OfficeSize | HomeSize
                        )
                      }
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                    >
                      {activeSub.category === "OFFICE"
                        ? officePlans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.capacityLabel} • {p.unitsPerWeek}{" "}
                              bolo/sem)
                            </option>
                          ))
                        : homePlans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.capacityLabel})
                            </option>
                          ))}
                    </select>
                  </div>

                  {activeSub.category === "HOME" && (
                    <div>
                      <label
                        htmlFor="change-freq-select"
                        className="block text-xs text-[#75584B] mb-1.5"
                      >
                        Mudar frequência:
                      </label>
                      <select
                        id="change-freq-select"
                        value={activeSub.frequency}
                        onChange={(e) => {
                          const newFreq = e.target.value as
                            | "SEMANAL"
                            | "QUINZENAL";
                          const planObj =
                            homePlans.find(
                              (p) => p.id === activeSub.planCode
                            ) || homePlans[0];
                          const base = planObj.basePrices[newFreq];
                          const discount =
                            planObj.discounts[
                              activeSub.period as keyof typeof planObj.discounts
                            ] || 0;
                          updateSubscriptionDetails(activeSub.id, {
                            frequency: newFreq,
                            monthlyValue: Number(
                              (base * (1 - discount / 100)).toFixed(2)
                            ),
                          });
                          showToast(
                            `Frequência alterada para ${newFreq.toLowerCase()}!`
                          );
                        }}
                        className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2.5 text-sm"
                      >
                        <option value="SEMANAL">Semanal (4 entregas/mês)</option>
                        <option value="QUINZENAL">
                          Quinzenal (2 entregas/mês)
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#75584B] font-light">
                    Deseja encerrar sua assinatura ao final do ciclo atual?
                  </span>
                  {activeSub.status !== "CANCELADA" ? (
                    <button
                      type="button"
                      onClick={() => {
                        updateSubscriptionStatus(activeSub.id, "CANCELADA");
                        showToast(
                          "Sua assinatura foi marcada como Cancelada. Você ainda receberá as entregas já pagas do ciclo atual."
                        );
                      }}
                      className="text-red-800 hover:underline font-medium cursor-pointer self-start sm:self-auto"
                    >
                      Cancelar assinatura
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        updateSubscriptionStatus(activeSub.id, "ATIVA");
                        showToast("Sua assinatura foi reativada com sucesso!");
                      }}
                      className="text-[#3E2418] underline font-medium cursor-pointer self-start sm:self-auto"
                    >
                      Reativar assinatura
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA LATERAL: ITEM 6 — SOLUÇÃO INTELIGENTE PARA VIAGEM / RECESSO (COM DATA EXATA E OPÇÃO DE VOLTAR ATRÁS) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-[#F4E6E2]/55 p-6 sm:p-8 border border-[#EBDAD3] space-y-4">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block">
                Próxima Surpresa Programada
              </span>
              <div>
                <p className="font-serif-title text-3xl font-normal text-[#3E2418] whitespace-nowrap">
                  {formatDateBR(activeSub.nextDeliveryDate)}
                </p>
                <p className="text-xs text-[#75584B] font-light mt-1">
                  {dayNamesPT[activeSub.deliveryDay]} • Período da{" "}
                  <strong className="font-medium text-[#3E2418]">
                    {shiftNamesPT[activeSub.deliveryShift]}
                  </strong>
                </p>
              </div>

              {(activeSub.rescheduledDeliveriesCount || 0) > 0 && (
                <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#D5A8A0] text-xs text-[#3E2418] space-y-2">
                  <p className="leading-relaxed">
                    No dia{" "}
                    <strong>{formatDateBR(activeSub.nextDeliveryDate)}</strong>,
                    você receberá{" "}
                    <strong>
                      {activeSub.unitsPerDelivery +
                        (activeSub.rescheduledDeliveriesCount || 0)}{" "}
                      bolo(s) juntos
                    </strong>{" "}
                    ({activeSub.unitsPerDelivery} do plano +{" "}
                    {activeSub.rescheduledDeliveriesCount} acumulado(s)).
                  </p>

                  {activeSub.skippedDates &&
                    activeSub.skippedDates.length > 0 && (
                      <p className="text-[11px] text-[#75584B] font-light">
                        Data(s) pulada(s):{" "}
                        {activeSub.skippedDates.map(formatDateBR).join(", ")}
                      </p>
                    )}

                  {activeSub.skippedDates &&
                    activeSub.skippedDates.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoLastSkip}
                        className="w-full rounded-full border border-[#3E2418] hover:bg-[#3E2418] text-[#3E2418] hover:text-[#FFFDFB] py-2 px-3 text-[11px] uppercase tracking-[0.15em] transition cursor-pointer mt-1"
                      >
                        Voltar atrás (Receber em{" "}
                        {formatDateBR(
                          activeSub.skippedDates[
                            activeSub.skippedDates.length - 1
                          ]
                        )}
                        )
                      </button>
                    )}
                </div>
              )}

              <div className="pt-3 border-t border-[#EBDAD3] space-y-3">
                <p className="text-xs font-medium text-[#3E2418]">
                  Vai viajar ou fechar no dia{" "}
                  {formatDateBR(activeSub.nextDeliveryDate)}?
                </p>
                <p className="text-[11px] text-[#75584B] font-light leading-relaxed">
                  Como sua mensalidade garante todas as fornadas do mês,{" "}
                  <strong>você nunca perde um bolo pago</strong>: pule essa
                  data e receba os bolos acumulados na entrega seguinte!
                </p>
                <button
                  type="button"
                  onClick={handleRescheduleTravelDelivery}
                  className="w-full rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] py-3 px-4 text-[11px] uppercase tracking-[0.16em] transition cursor-pointer"
                >
                  Pular {formatDateBR(activeSub.nextDeliveryDate)} & Acumular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: PAGAMENTO TRANSPARENTE ASAAS DIRETO NO SITE (ITEM 5)
         ==================================================================== */}
      {activeTab === "PAGAMENTO" && (
        <div
          role="tabpanel"
          aria-labelledby="acc-tab-PAGAMENTO"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8"
        >
          <div className="lg:col-span-7 rounded-3xl bg-[#FFFDFB] p-6 sm:p-10 border border-[#EBDAD3] space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block mb-1">
                Checkout Transparente Asaas
              </span>
              <h2 className="font-serif-title text-3xl font-normal text-[#3E2418]">
                Gerenciar Pagamento pelo Site
              </h2>
              <p className="text-xs text-[#75584B] font-light mt-1">
                Altere sua modalidade ou pague sua mensalidade diretamente por
                aqui.
              </p>
            </div>

            {/* Seletor de Modalidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "PIX", label: "PIX Recorrente" },
                  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
                  { id: "BOLETO", label: "Boleto + NFS-e" },
                ] as const
              ).map((method) => {
                const isSelected = activeSub.paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      updateSubscriptionDetails(activeSub.id, {
                        paymentMethod: method.id,
                      });
                      showToast(
                        `Modalidade alterada para ${method.label} no Asaas.`
                      );
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#3E2418] text-[#FFFDFB] border-[#3E2418] font-medium"
                        : "bg-[#FAF6F2] text-[#75584B] border-[#EBDAD3]"
                    }`}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>

            {/* Painel Específico de cada método para o cliente fazer tudo pelo site */}
            {activeSub.paymentMethod === "PIX" && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#3E2418]">
                    PIX Copia e Cola da Fatura Atual (Asaas)
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#B88B4A] whitespace-nowrap">
                    R$ {activeSub.monthlyValue.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <code className="block text-[11px] break-all bg-[#FFFDFB] p-3.5 rounded-xl border border-[#EBDAD3] text-[#3E2418]">
                  00020126580014BR.GOV.BCB.PIX0136querodoceca@assinaturas.com.br5204000053039865802BR5913QUERO
                  DOCE CA6009MOGI CRUZ62070503***6304ABCD
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      "00020126580014BR.GOV.BCB.PIX0136querodoceca@assinaturas.com.br5204000053039865802BR5913QUERO DOCE CA6009MOGI CRUZ62070503***6304ABCD"
                    );
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#3E2418] text-[#FFFDFB] px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] cursor-pointer"
                >
                  {pixCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Código PIX Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Código PIX
                    </>
                  )}
                </button>
              </div>
            )}

            {activeSub.paymentMethod === "CREDIT_CARD" && (
              <form
                onSubmit={handleSaveCreditCardAsaas}
                className="p-6 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#3E2418]">
                    Cartão Cadastrado na Recorrência
                  </span>
                  <span className="text-xs text-[#B88B4A]">
                    {activeSub.cardLast4
                      ? `Final •••• ${activeSub.cardLast4}`
                      : "Nenhum cartão salvo"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="acc-cc-holder"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Nome impresso no novo cartão
                    </label>
                    <input
                      id="acc-cc-holder"
                      type="text"
                      required
                      value={ccHolder}
                      onChange={(e) => setCcHolder(e.target.value)}
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="acc-cc-num"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Número do Cartão
                    </label>
                    <input
                      id="acc-cc-num"
                      type="text"
                      inputMode="numeric"
                      required
                      value={ccNumber}
                      onChange={(e) => setCcNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="acc-cc-exp"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      Validade (MM/AA)
                    </label>
                    <input
                      id="acc-cc-exp"
                      type="text"
                      required
                      value={ccExpiry}
                      onChange={(e) => setCcExpiry(e.target.value)}
                      placeholder="09/29"
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="acc-cc-cvv"
                      className="block text-[11px] text-[#75584B] mb-1"
                    >
                      CVV
                    </label>
                    <input
                      id="acc-cc-cvv"
                      type="text"
                      inputMode="numeric"
                      required
                      value={ccCvv}
                      onChange={(e) => setCcCvv(e.target.value)}
                      placeholder="123"
                      className="w-full rounded-xl border border-[#EBDAD3] bg-[#FFFDFB] px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#3E2418] text-[#FFFDFB] px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] cursor-pointer"
                >
                  Salvar Cartão na Assinatura
                </button>
              </form>
            )}

            {activeSub.paymentMethod === "BOLETO" && (
              <div className="p-6 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] space-y-3">
                <p className="text-xs font-medium text-[#3E2418]">
                  Boleto Bancário + Nota Fiscal Automática (Asaas)
                </p>
                <p className="text-xs text-[#75584B] font-light">
                  Documento vinculado: <strong>{activeSub.document}</strong>
                </p>
                <p className="text-[11px] text-[#75584B] font-light">
                  Linha digitável do mês atual:{" "}
                  <code className="bg-[#FFFDFB] px-2 py-1 rounded border border-[#EBDAD3] block mt-1">
                    46191.11008 00000.000004 01234.567890 1 99120000039591
                  </code>
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-[#FFFDFB] p-8 border border-[#EBDAD3] space-y-5">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#B88B4A] block mb-1">
                Extrato Asaas
              </span>
              <h3 className="font-serif-title text-2xl font-normal text-[#3E2418]">
                Faturas da Assinatura
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] flex items-center justify-between">
                <div>
                  <span className="text-[#3E2418] font-medium block">
                    Novembro / 2026
                  </span>
                  <span className="text-[#75584B] font-light">
                    R$ {activeSub.monthlyValue.toFixed(2).replace(".", ",")} •{" "}
                    {activeSub.paymentMethod}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] bg-[#F4E6E2] text-[#3E2418] px-3 py-1 rounded-full">
                  Pago • NFS-e
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EBDAD3] flex items-center justify-between">
                <div>
                  <span className="text-[#3E2418] font-medium block">
                    Dezembro / 2026
                  </span>
                  <span className="text-[#75584B] font-light">
                    R$ {activeSub.monthlyValue.toFixed(2).replace(".", ",")} •{" "}
                    {activeSub.paymentMethod}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#75584B]">
                  Agendada
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: EDITAR CADASTRO & ENDEREÇO
         ==================================================================== */}
      {activeTab === "DADOS_CONTA" && (
        <div
          role="tabpanel"
          aria-labelledby="acc-tab-DADOS_CONTA"
          className="rounded-3xl bg-[#FFFDFB] p-8 sm:p-10 border border-[#EBDAD3] max-w-3xl"
        >
          <h2 className="font-serif-title text-3xl font-normal text-[#3E2418] mb-6">
            Editar Informações Cadastrais & Endereço
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast("Informações atualizadas com sucesso.");
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Nome do Responsável
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={activeSub.customerName}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      customerName: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-doc"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  CPF ou CNPJ
                </label>
                <input
                  id="edit-doc"
                  type="text"
                  value={activeSub.document}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      document: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-email"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  E-mail
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={activeSub.email}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-whatsapp"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  WhatsApp
                </label>
                <input
                  id="edit-whatsapp"
                  type="tel"
                  value={activeSub.whatsapp}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      whatsapp: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-address"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Endereço Completo
                </label>
                <input
                  id="edit-address"
                  type="text"
                  value={activeSub.address}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      address: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-neighborhood"
                  className="block text-xs text-[#75584B] mb-1"
                >
                  Bairro
                </label>
                <input
                  id="edit-neighborhood"
                  type="text"
                  value={activeSub.neighborhood}
                  onChange={(e) =>
                    updateSubscriptionDetails(activeSub.id, {
                      neighborhood: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-notes"
                className="block text-xs text-[#75584B] mb-1"
              >
                Observações de Entrega (Recepção / Portaria)
              </label>
              <input
                id="edit-notes"
                type="text"
                value={activeSub.notes || ""}
                onChange={(e) =>
                  updateSubscriptionDetails(activeSub.id, {
                    notes: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#EBDAD3] bg-[#FAF6F2]/50 px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-[#3E2418] hover:bg-[#523223] text-[#FFFDFB] px-8 py-3.5 text-xs uppercase tracking-[0.2em] transition cursor-pointer"
            >
              Salvar Alterações
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
