"use client";

import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import LiveDate from "@/components/LiveDate";
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Mission Control</title>
        <meta name="description" content="Personal evolution dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0d14" />
        <link rel="manifest" href="/mc/manifest.json" />
        <link rel="apple-touch-icon" href="/mc/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mission Control" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <ConvexClientProvider>
          <Sidebar />
          <div className="main-wrapper">
            <header className="top-header">
              <div className="top-header-left">
                <span className="top-header-title">Mission Control</span>
              </div>
              <span className="top-header-date" suppressHydrationWarning>
                <LiveDate />
              </span>
            </header>
            <main>
              {children}
            </main>
          </div>
          <BottomNav />
        </ConvexClientProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/mc/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  );
}
