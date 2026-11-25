import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { PortalStoreProvider } from "@/lib/store-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quero Doce Ca | Assinatura de Bolos Artesanais para Clínicas e Casa",
  description:
    "Clube de assinatura de bolos caseiros afetivos assados no dia para consultórios, clínicas (Plano Office) e residências (Plano Home) em Mogi das Cruzes.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PortalStoreProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </PortalStoreProvider>
      </body>
    </html>
  );
}
