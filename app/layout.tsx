import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnimationObserver } from "./components/AnimationObserver";
import { LanguageProvider } from "./lib/LanguageContext";

const SITE_URL = "https://next-portfolio-navy-five-46.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-3WS5PGSFHJ"; // ID de medição do Google Analytics
const GSC_VERIFICATION =
  process.env.NEXT_PUBLIC_GSC_VERIFICATION || "ZNYzSqJjgcBydgdfyXjVLILKJns2c3Q6aikzhMTo6Ms"; // verificação do Search Console

const OG_DESC = "Sites, lojas e landing pages que vendem. Veja meus projetos e monte seu orçamento.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Victor | Desenvolvedor Freelancer",
  description:
    "Portfólio de projetos e orçamentador de serviços WordPress, performance, SEO e ajustes técnicos.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Victor — Desenvolvedor Web",
    title: "Victor | Desenvolvedor Web Freelancer",
    description: OG_DESC,
    locale: "pt_BR",
    images: [{ url: "/social/og.png", width: 1200, height: 630, alt: "Victor — Desenvolvedor Web Freelancer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Victor | Desenvolvedor Web Freelancer",
    description: OG_DESC,
    images: ["/social/og.png"],
  },
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <LanguageProvider>
          <AnimationObserver />
          {children}
        </LanguageProvider>

        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
