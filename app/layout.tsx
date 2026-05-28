import type { Metadata } from "next";
import "./globals.css";
import { AnimationObserver } from "./components/AnimationObserver";

export const metadata: Metadata = {
  title: "Victor | Desenvolvedor Freelancer",
  description:
    "Portfólio de projetos e orçamentador de serviços WordPress, performance, SEO e ajustes técnicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AnimationObserver />
        {children}
      </body>
    </html>
  );
}
