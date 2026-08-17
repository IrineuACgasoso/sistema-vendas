import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Vendas",
  description: "Cadastro e baixa de vendas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-gray-100 min-h-screen text-gray-900 antialiased">{children}</body>
    </html>
  );
}
