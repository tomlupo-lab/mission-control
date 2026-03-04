"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayoutDashboard, Heart, TrendingUp, UtensilsCrossed, Gamepad2, FileText, Settings, Bell } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/feed", label: "Feed", Icon: Bell, badge: true },
  { href: "/health", label: "Health", Icon: Heart },
  { href: "/trading", label: "Trading", Icon: TrendingUp },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", Icon: Gamepad2 },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/systems", label: "Ops", Icon: Settings },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const unreadCount = useQuery(api.feed.unreadCount);

  return (
    <nav className="sidebar-nav">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`sidebar-link${active ? " active" : ""}`} onClick={onNavigate}>
            <span className="sidebar-icon"><item.Icon size={18} /></span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (unreadCount ?? 0) > 0 && (
              <span style={{
                padding: "1px 7px",
                fontSize: "0.6rem",
                fontWeight: 700,
                borderRadius: 10,
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                textShadow: "0 0 6px rgba(16,185,129,0.3)",
                lineHeight: "1.4",
              }}>
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
