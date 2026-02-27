"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryTabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/health", label: "Health", icon: "❤️" },
  { href: "/trading", label: "Trading", icon: "📈" },
];

const moreTabs = [
  { href: "/meals", label: "Meals", icon: "🍽️" },
  { href: "/progress", label: "Progress", icon: "🎮" },
  { href: "/reports", label: "Reports", icon: "📋" },
  { href: "/systems", label: "Ops", icon: "⚙️" },
];

const allSecondary = [...moreTabs];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = allSecondary.some((t) => t.href === "/" ? pathname === "/" : pathname.startsWith(t.href));

  return (
    <>
      {moreOpen && <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMoreOpen(false)} />}
      <nav className="bottom-nav">
        {moreOpen && (
          <div style={{
            position: "absolute", bottom: "100%", right: 8, background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
            padding: "var(--space-sm)", marginBottom: 4, minWidth: 160,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
          }}>
            {allSecondary.map((t) => {
              const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} onClick={() => setMoreOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: "var(--radius-sm)", textDecoration: "none",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    background: active ? "var(--accent-dim)" : "transparent",
                    fontSize: "var(--text-base)", fontWeight: active ? 600 : 400,
                  }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </Link>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 1200, margin: "0 auto" }}>
          {primaryTabs.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={active ? "active" : ""}>
                <span className="nav-icon">{t.icon}</span>
                <span style={{ fontWeight: active ? 600 : 400 }}>{t.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(!moreOpen)} className={moreActive ? "active" : ""}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", fontSize: "var(--text-xs)", color: moreActive ? "var(--accent)" : "var(--muted)" }}>
            <span className="nav-icon">•••</span>
            <span style={{ fontWeight: moreActive ? 600 : 400 }}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
