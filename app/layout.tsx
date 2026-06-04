import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnimationObserver } from "./components/AnimationObserver";
import { LanguageProvider } from "./lib/LanguageContext";

const SITE_URL = "https://next-portfolio-navy-five-46.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // ex: G-XXXXXXXXXX
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION; // código do Search Console

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Victor | Desenvolvedor Freelancer",
  description:
    "Portfólio de projetos e orçamentador de serviços WordPress, performance, SEO e ajustes técnicos.",
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
