"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { usePortalStore } from "@/lib/store-context";

export function Navbar() {
  const pathname = usePathname();
  const { cart, currentUser } = usePortalStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Somente exibe a sessão Admin se o usuário logado tiver role === 'ADMIN'
  const navItems = [
    { href: "/", label: "Assinaturas" },
    { href: "/avulsos", label: "Cardápio" },
    {
      href: "/minha-conta",
      label: currentUser ? "Minha Conta" : "Conta",
    },
    ...(currentUser?.role === "ADMIN"
      ? [{ href: "/admin", label: "Painel Admin" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDFB]/90 backdrop-blur-md border-b border-[#EBDAD3]">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 h-20 flex items-center justify-between">
        {/* 1. Logo na Esquerda */}
        <Link href="/" className="flex items-center gap-3.5 group shrink-0">
          {/*<div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#EBDAD3]">
            <Image
              src="/logo-marrom.png"
              alt="Quero Doce Ca"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>*/}
          <div className="text-left">
            <span className="font-serif-title text-2xl sm:text-[26px] font-normal tracking-wide text-[#3E2418] block leading-none">
              Quero Doce Ca
            </span>
            
          </div>
        </Link>

        {/* 2. Itens de Navegação e Cesta na Direita */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav
            aria-label="Navegação Principal"
            className="hidden lg:flex items-center gap-7"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-xs uppercase tracking-[0.18em] transition-colors py-1 flex items-center gap-1.5 ${
                    isActive
                      ? "text-[#3E2418] font-semibold border-b border-[#3E2418]"
                      : "text-[#75584B] hover:text-[#3E2418]"
                  }`}
                >
                  {item.href === "/minha-conta" && (
                    <User
                      className="w-3.5 h-3.5 stroke-[1.5]"
                      aria-hidden="true"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/avulsos#sacola"
            className="relative inline-flex items-center gap-2 rounded-full bg-[#FFFDFB] border border-[#EBDAD3] hover:border-[#D5A8A0] px-4 py-2 text-[#3E2418] transition text-xs uppercase tracking-[0.15em]"
            aria-label={`Sacola de bolos avulsos com ${totalCartItems} itens`}
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            <span className="hidden sm:inline">Cesta</span>
            {totalCartItems > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium bg-[#D5A8A0] text-[#3E2418] rounded-full">
                {totalCartItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            className="lg:hidden p-2 text-[#3E2418]"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden bg-[#FFFDFB] border-b border-[#EBDAD3] px-6 py-6 flex flex-col gap-4"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`text-xs uppercase tracking-[0.2em] py-2 ${
                  isActive ? "text-[#3E2418] font-semibold" : "text-[#75584B]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
