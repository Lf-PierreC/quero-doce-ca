"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CakeFlavor,
  DeliveryCityRule,
  DeliveryOrder,
  HomePlanRule,
  INITIAL_CAKE_FLAVORS,
  INITIAL_DELIVERY_HISTORY,
  INITIAL_DELIVERY_ZONES,
  INITIAL_HOME_PLANS,
  INITIAL_OFFICE_PLANS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_WEEKLY_DELIVERIES,
  OfficePlanRule,
  STORE_DATA_VERSION,
  SubscriptionRecord,
} from "./store-data";
import { supabase } from "./supabase";

export interface CartItem {
  id: string;
  flavorId: string;
  flavorName: string;
  size: "FAMILIA" | "INDIVIDUAL";
  unitPrice: number;
  extraSyrup: boolean;
  extraSyrupPrice: number;
  quantity: number;
}

export interface CustomerProfile {
  name: string;
  email: string;
  whatsapp: string;
  document?: string;
  address?: string;
  neighborhood?: string;
  favoriteStyles: string[];
  dietaryRestrictions?: string;
}

export interface AuthSession {
  role: "CUSTOMER" | "ADMIN";
  email: string;
  name: string;
  subscriptionId?: string;
  profile?: CustomerProfile;
}

interface PortalStoreContextType {
  officePlans: OfficePlanRule[];
  homePlans: HomePlanRule[];
  cakeFlavors: CakeFlavor[];
  subscriptions: SubscriptionRecord[];
  weeklyDeliveries: DeliveryOrder[];
  deliveryHistory: DeliveryOrder[];
  deliveryZones: DeliveryCityRule[];
  cart: CartItem[];
  currentUser: AuthSession | null;
  supabaseConnected: boolean;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; role?: "CUSTOMER" | "ADMIN"; error?: string }>;
  registerCustomerAccount: (profile: CustomerProfile, password?: string) => void;
  logout: () => void;
  updateOfficePlan: (updated: OfficePlanRule) => void;
  updateHomePlan: (updated: HomePlanRule) => void;
  updateCakeFlavor: (updated: CakeFlavor) => void;
  addCakeFlavor: (newFlavor: CakeFlavor) => void;
  deleteCakeFlavor: (id: string) => void;
  updateDeliveryZone: (updated: DeliveryCityRule) => void;
  addDeliveryZone: (newZone: DeliveryCityRule) => void;
  deleteDeliveryZone: (id: string) => void;
  addSubscription: (sub: SubscriptionRecord) => void;
  updateSubscriptionStatus: (
    id: string,
    status: SubscriptionRecord["status"]
  ) => void;
  updateSubscriptionDetails: (
    id: string,
    updates: Partial<SubscriptionRecord>
  ) => void;
  updateDeliveryStatus: (
    id: string,
    status: DeliveryOrder["productionStatus"]
  ) => void;
  addAvulsoOrder: (order: DeliveryOrder) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  resetToDefaults: () => void;
}

const PortalStoreContext = createContext<PortalStoreContextType | undefined>(
  undefined
);

const STORAGE_KEY = "quero_doce_ca_portal_v3";

async function syncToSupabase(action: string, payload: unknown) {
  try {
    await fetch("/api/portal/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
  } catch (err) {
    console.warn(`[Supabase sync] falha ao enviar ${action}:`, err);
  }
}

export function PortalStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [officePlans, setOfficePlans] =
    useState<OfficePlanRule[]>(INITIAL_OFFICE_PLANS);
  const [homePlans, setHomePlans] =
    useState<HomePlanRule[]>(INITIAL_HOME_PLANS);
  const [cakeFlavors, setCakeFlavors] =
    useState<CakeFlavor[]>(INITIAL_CAKE_FLAVORS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(
    INITIAL_SUBSCRIPTIONS
  );
  const [weeklyDeliveries, setWeeklyDeliveries] = useState<DeliveryOrder[]>(
    INITIAL_WEEKLY_DELIVERIES
  );
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryOrder[]>(
    INITIAL_DELIVERY_HISTORY
  );
  const [deliveryZones, setDeliveryZones] = useState<DeliveryCityRule[]>(
    INITIAL_DELIVERY_ZONES
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 1. Carrega cache local imediatamente + sincroniza com Supabase em seguida
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version === STORE_DATA_VERSION) {
          if (parsed.officePlans) {
            const mergedOffice = INITIAL_OFFICE_PLANS.map((initPlan) => {
              const savedPlan = parsed.officePlans.find(
                (p: OfficePlanRule) => p.id === initPlan.id
              );
              return savedPlan
                ? {
                    ...savedPlan,
                    features: initPlan.features,
                    capacityLabel: initPlan.capacityLabel,
                  }
                : initPlan;
            });
            setOfficePlans(mergedOffice);
          }
          if (parsed.homePlans) {
            const mergedHome = INITIAL_HOME_PLANS.map((initPlan) => {
              const savedPlan = parsed.homePlans.find(
                (p: HomePlanRule) => p.id === initPlan.id
              );
              return savedPlan
                ? {
                    ...savedPlan,
                    features: initPlan.features,
                    capacityLabel: initPlan.capacityLabel,
                  }
                : initPlan;
            });
            setHomePlans(mergedHome);
          }
          if (parsed.cakeFlavors) setCakeFlavors(parsed.cakeFlavors);
          if (parsed.subscriptions) setSubscriptions(parsed.subscriptions);
          if (parsed.weeklyDeliveries)
            setWeeklyDeliveries(parsed.weeklyDeliveries);
          if (parsed.deliveryHistory)
            setDeliveryHistory(parsed.deliveryHistory);
          if (parsed.deliveryZones) setDeliveryZones(parsed.deliveryZones);
          if (parsed.cart) setCart(parsed.cart);
          if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        }
      }
    } catch (e) {
      console.error("Failed to load local store:", e);
    }
    setHydrated(true);

    // 2. Busca dados reais do Supabase (/api/portal/sync)
    (async () => {
      try {
        const res = await fetch("/api/portal/sync", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.connected) {
          setSupabaseConnected(true);
          if (Array.isArray(data.officePlans) && data.officePlans.length > 0) {
            setOfficePlans(data.officePlans);
          }
          if (Array.isArray(data.homePlans) && data.homePlans.length > 0) {
            setHomePlans(data.homePlans);
          }
          if (Array.isArray(data.cakeFlavors) && data.cakeFlavors.length > 0) {
            setCakeFlavors(data.cakeFlavors);
          }
          if (
            Array.isArray(data.subscriptions) &&
            data.subscriptions.length > 0
          ) {
            setSubscriptions(data.subscriptions);
          }
          if (
            Array.isArray(data.weeklyDeliveries) &&
            data.weeklyDeliveries.length > 0
          ) {
            setWeeklyDeliveries(data.weeklyDeliveries);
          }
          if (
            Array.isArray(data.deliveryHistory) &&
            data.deliveryHistory.length > 0
          ) {
            setDeliveryHistory(data.deliveryHistory);
          }
        }
      } catch (err) {
        console.warn("[Supabase Sync] Usando cache local:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORE_DATA_VERSION,
          officePlans,
          homePlans,
          cakeFlavors,
          subscriptions,
          weeklyDeliveries,
          deliveryHistory,
          deliveryZones,
          cart,
          currentUser,
        })
      );
    } catch (e) {
      console.error("Failed to save local store:", e);
    }
  }, [
    hydrated,
    officePlans,
    homePlans,
    cakeFlavors,
    subscriptions,
    weeklyDeliveries,
    deliveryHistory,
    deliveryZones,
    cart,
    currentUser,
  ]);

  const loginWithEmail = async (emailInput: string, passwordInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !passwordInput) {
      return {
        ok: false,
        error: "Informe seu e-mail e sua senha para entrar.",
      };
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });

      if (error || !data.user) {
        return {
          ok: false,
          error:
            "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
        };
      }

      // Consulta o perfil real (role: ADMIN ou CUSTOMER) no Supabase
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role, full_name, whatsapp")
        .eq("id", data.user.id)
        .maybeSingle();

      const role: "ADMIN" | "CUSTOMER" =
        profileRow?.role === "ADMIN" ? "ADMIN" : "CUSTOMER";

      if (role === "ADMIN") {
        const session: AuthSession = {
          role: "ADMIN",
          email: data.user.email || cleanEmail,
          name: profileRow?.full_name || "Ateliê Quero Doce Ca (Admin)",
        };
        setCurrentUser(session);
        return { ok: true, role: "ADMIN" as const };
      }

      // Cliente comum: vincula assinatura ativa (se existir) pelo e-mail
      const matchedSub = subscriptions.find(
        (s) => s.email.toLowerCase() === cleanEmail
      );

      const session: AuthSession = {
        role: "CUSTOMER",
        email: data.user.email || cleanEmail,
        name:
          matchedSub?.companyOrClinicName ||
          matchedSub?.customerName ||
          profileRow?.full_name ||
          "Cliente Quero Doce Ca",
        subscriptionId: matchedSub?.id,
        profile: {
          name:
            matchedSub?.customerName ||
            profileRow?.full_name ||
            "Cliente Quero Doce Ca",
          email: data.user.email || cleanEmail,
          whatsapp: matchedSub?.whatsapp || profileRow?.whatsapp || "",
          document: matchedSub?.document,
          address: matchedSub?.address,
          neighborhood: matchedSub?.neighborhood,
          favoriteStyles: matchedSub?.favoriteStyles || [
            "Com Chocolate & Brigadeiro",
          ],
          dietaryRestrictions: matchedSub?.dietaryRestrictions || "",
        },
      };
      setCurrentUser(session);
      return { ok: true, role: "CUSTOMER" as const };
    }

    return {
      ok: false,
      error: "Serviço de autenticação não configurado.",
    };
  };

  const registerCustomerAccount = (
    profile: CustomerProfile,
    password?: string
  ) => {
    const session: AuthSession = {
      role: "CUSTOMER",
      email: profile.email,
      name: profile.name,
      // Sem subscriptionId obrigatório: cliente pode comprar só bolos avulsos ou assinar depois!
      subscriptionId: undefined,
      profile,
    };
    setCurrentUser(session);

    // Persiste no Supabase Auth + tabela public.customers
    (async () => {
      let profileId: string | null = null;
      if (supabase && password) {
        try {
          const { data } = await supabase.auth.signUp({
            email: profile.email,
            password,
            options: {
              data: { full_name: profile.name, whatsapp: profile.whatsapp },
            },
          });
          profileId = data.user?.id || null;
        } catch {
          // Segue salvando o registro em customers mesmo se o e-mail já existir no Auth
        }
      }
      await syncToSupabase("register_customer", { ...profile, profileId });
    })();
  };

  const logout = () => {
    setCurrentUser(null);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const updateOfficePlan = (updated: OfficePlanRule) => {
    setOfficePlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    syncToSupabase("update_office_plan", updated);
  };

  const updateHomePlan = (updated: HomePlanRule) => {
    setHomePlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    syncToSupabase("update_home_plan", updated);
  };

  const updateCakeFlavor = (updated: CakeFlavor) => {
    setCakeFlavors((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    syncToSupabase("upsert_flavor", updated);
  };

  const addCakeFlavor = (newFlavor: CakeFlavor) => {
    setCakeFlavors((prev) => [...prev, newFlavor]);
    syncToSupabase("upsert_flavor", newFlavor);
  };

  const deleteCakeFlavor = (id: string) => {
    setCakeFlavors((prev) => prev.filter((f) => f.id !== id));
    syncToSupabase("delete_flavor", { id });
  };

  const addSubscription = (sub: SubscriptionRecord) => {
    setSubscriptions((prev) => [sub, ...prev]);
    const dayLabels: Record<SubscriptionRecord["deliveryDay"], string> = {
      TERCA: "Terça-feira",
      QUINTA: "Quinta-feira",
      SEXTA: "Sexta-feira",
      SABADO: "Sábado",
    };
    const newDelivery: DeliveryOrder = {
      id: `PED-${Math.floor(900 + Math.random() * 900)}`,
      subscriptionId: sub.id,
      orderType:
        sub.category === "OFFICE" ? "ASSINATURA_OFFICE" : "ASSINATURA_HOME",
      customerName: sub.customerName,
      companyName: sub.companyOrClinicName,
      whatsapp: sub.whatsapp,
      deliveryDate: sub.nextDeliveryDate,
      deliveryDayLabel: dayLabels[sub.deliveryDay],
      shift: sub.deliveryShift,
      items: sub.selectedFlavorsNextDelivery.map((f) => ({
        flavorName: f,
        size: sub.category === "OFFICE" ? "G_OFFICE" : "FAMILIA",
        quantity: 1,
      })),
      address: sub.address,
      neighborhood: sub.neighborhood,
      productionStatus: "FILA",
      totalValue: Number((sub.monthlyValue / 4).toFixed(2)),
    };
    setWeeklyDeliveries((prev) => [newDelivery, ...prev]);

    setCurrentUser({
      role: "CUSTOMER",
      email: sub.email,
      name: sub.companyOrClinicName || sub.customerName,
      subscriptionId: sub.id,
      profile: {
        name: sub.customerName,
        email: sub.email,
        whatsapp: sub.whatsapp,
        document: sub.document,
        address: sub.address,
        neighborhood: sub.neighborhood,
        favoriteStyles: sub.favoriteStyles || ["Com Chocolate & Brigadeiro"],
        dietaryRestrictions: sub.dietaryRestrictions,
      },
    });

    syncToSupabase("create_subscription", { sub, delivery: newDelivery });
  };

  const updateSubscriptionStatus = (
    id: string,
    status: SubscriptionRecord["status"]
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    syncToSupabase("update_subscription", { id, updates: { status } });
  };

  const updateSubscriptionDetails = (
    id: string,
    updates: Partial<SubscriptionRecord>
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        let nextHistory = s.planHistory || [];
        if (updates.planName && updates.planName !== s.planName) {
          nextHistory = [
            ...nextHistory,
            {
              date: new Date().toISOString().split("T")[0],
              title: `Alteração de Plano • ${s.planName} → ${updates.planName}`,
              description: `Plano atualizado pelo portal para R$ ${(
                updates.monthlyValue ?? s.monthlyValue
              )
                .toFixed(2)
                .replace(".", ",")}/mês.`,
            },
          ];
        } else if (updates.frequency && updates.frequency !== s.frequency) {
          nextHistory = [
            ...nextHistory,
            {
              date: new Date().toISOString().split("T")[0],
              title: `Mudança de Frequência • ${s.frequency} → ${updates.frequency}`,
              description: `Frequência de entregas atualizada pelo cliente.`,
            },
          ];
        }
        return { ...s, ...updates, planHistory: nextHistory };
      })
    );
    syncToSupabase("update_subscription", { id, updates });
  };

  const updateDeliveryStatus = (
    id: string,
    productionStatus: DeliveryOrder["productionStatus"]
  ) => {
    setWeeklyDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updatedOrder: DeliveryOrder = {
          ...d,
          productionStatus,
          deliveredAt:
            productionStatus === "ENTREGUE"
              ? "Hoje (Confirmado pelo Admin)"
              : d.deliveredAt,
        };
        if (productionStatus === "ENTREGUE") {
          setDeliveryHistory((hist) =>
            hist.some((h) => h.id === d.id)
              ? hist.map((h) => (h.id === d.id ? updatedOrder : h))
              : [updatedOrder, ...hist]
          );
        }
        return updatedOrder;
      })
    );
    syncToSupabase("update_order_status", { id, productionStatus });
  };

  const addAvulsoOrder = (order: DeliveryOrder) => {
    setWeeklyDeliveries((prev) => [order, ...prev]);
    syncToSupabase("create_order", order);
  };

  const addToCart = (item: Omit<CartItem, "id">) => {
    const id = `${item.flavorId}-${item.size}-${item.extraSyrup ? "calda" : "sem"}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, id }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateDeliveryZone = (updated: DeliveryCityRule) => {
    setDeliveryZones((prev) =>
      prev.map((z) => (z.id === updated.id ? updated : z))
    );
  };

  const addDeliveryZone = (newZone: DeliveryCityRule) => {
    setDeliveryZones((prev) => [...prev, newZone]);
  };

  const deleteDeliveryZone = (id: string) => {
    setDeliveryZones((prev) => prev.filter((z) => z.id !== id));
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOfficePlans(INITIAL_OFFICE_PLANS);
    setHomePlans(INITIAL_HOME_PLANS);
    setCakeFlavors(INITIAL_CAKE_FLAVORS);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setWeeklyDeliveries(INITIAL_WEEKLY_DELIVERIES);
    setDeliveryHistory(INITIAL_DELIVERY_HISTORY);
    setDeliveryZones(INITIAL_DELIVERY_ZONES);
    setCart([]);
  };

  return (
    <PortalStoreContext.Provider
      value={{
        officePlans,
        homePlans,
        cakeFlavors,
        subscriptions,
        weeklyDeliveries,
        deliveryHistory,
        deliveryZones,
        cart,
        currentUser,
        supabaseConnected,
        loginWithEmail,
        registerCustomerAccount,
        logout,
        updateOfficePlan,
        updateHomePlan,
        updateCakeFlavor,
        addCakeFlavor,
        deleteCakeFlavor,
        updateDeliveryZone,
        addDeliveryZone,
        deleteDeliveryZone,
        addSubscription,
        updateSubscriptionStatus,
        updateSubscriptionDetails,
        updateDeliveryStatus,
        addAvulsoOrder,
        addToCart,
        removeFromCart,
        clearCart,
        resetToDefaults,
      }}
    >
      {children}
    </PortalStoreContext.Provider>
  );
}

export function usePortalStore() {
  const ctx = useContext(PortalStoreContext);
  if (!ctx) {
    throw new Error("usePortalStore must be used within PortalStoreProvider");
  }
  return ctx;
}
