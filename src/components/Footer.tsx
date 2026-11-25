"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePortalStore } from "@/lib/store-context";

export function Footer() {
  const { currentUser } = usePortalStore();

  return (
    <footer className="bg-[#FFFDFB] border-t border-[#EBDAD3] text-[#3E2418] mt-28 py-20 px-6">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#D5A8A0]/50 shadow-2xs">
            <Image
              src="/logo-marrom.png"
              alt="Quero Doce Ca"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-serif-title text-3xl font-normal tracking-wide text-[#3E2418]">
              Quero Doce Ca
            </h3>
            <p className="font-serif-title italic text-lg text-[#75584B] mt-0.5">
              Confeitaria Afetiva • Mogi das Cruzes
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#75584B] max-w-md mx-auto leading-relaxed">
          Assamos cada bolo na manhã da sua entrega, com manteiga extra,
          ingredientes frescos e o cuidado de uma cozinha afetiva.
        </p>

        <nav
          aria-label="Links do rodapé"
          className="flex flex-wrap items-center justify-center gap-8 pt-2 text-[11px] uppercase tracking-[0.2em] text-[#3E2418]"
        >
          <Link href="/#planos" className="hover:text-[#B88B4A] transition">
            Assinatura Empresas & Casa
          </Link>
          <Link href="/avulsos" className="hover:text-[#B88B4A] transition">
            Cardápio
          </Link>
          <Link href="/minha-conta" className="hover:text-[#B88B4A] transition">
            Minha Conta
          </Link>
          {currentUser?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-[#B88B4A] transition">
              Painel Admin
            </Link>
          )}
          <a
            href="https://wa.me/5511971661789"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#B88B4A] transition"
          >
            WhatsApp (11) 97166-1789
          </a>
        </nav>

        <div className="pt-10 border-t border-[#EBDAD3]/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#75584B] gap-3">
          <p>© 2026 Quero Doce Ca • Confeitaria Afetiva.</p>
          <p>Pagamentos recorrentes e Nota Fiscal integrados via Asaas.</p>
        </div>
      </div>
    </footer>
  );
}
