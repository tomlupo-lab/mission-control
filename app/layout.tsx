"use client";

import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Sidebar from "@/components/Sidebar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import LiveDate from "@/components/LiveDate";
import Script from "next/script";
import { Menu } from "lucide-react";
import NavLinks from "@/components/NavLinks";
import { useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <html lang="en">
      <head>
        <title>Mission Control</title>
        <meta name="description" content="Personal evolution dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0d14" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mission Control" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ConvexClientProvider>
          <Sidebar />
          <div className="main-wrapper">
            <header className="top-header">
              <div className="top-header-left">
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <button className="hamburger" aria-label="Open menu">
                      <Menu size={22} />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" style={{
                    background: "rgba(7, 10, 16, 0.95)",
                    backdropFilter: "blur(20px)",
                    borderRight: "1px solid rgba(34, 48, 74, 0.4)",
                  }}>
                    <div style={{ padding: "var(--space-xl) 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "0 var(--space-lg)", marginBottom: "var(--space-2xl)" }}>
                        <span style={{ fontSize: "1.2rem" }}>🚀</span>
                        <span className="gradient-text" style={{ fontWeight: 800, fontSize: "var(--text-lg)", letterSpacing: "0.5px", filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))" }}>Mission Control</span>
                      </div>
                      <NavLinks onNavigate={() => setDrawerOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
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
        </ConvexClientProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  );
}
