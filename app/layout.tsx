import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Personal evolution dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mission Control",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ConvexClientProvider>
          <Sidebar />
          <div className="main-wrapper">
            <header className="top-header">
              <span className="top-header-title">Mission Control</span>
              <span className="top-header-date" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </header>
            <main className="main-content">
              {children}
            </main>
          </div>
          <BottomNav />
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
