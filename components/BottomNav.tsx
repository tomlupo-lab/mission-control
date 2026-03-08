"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayoutDashboard, Bell, Heart, MoreHorizontal, TrendingUp, UtensilsCrossed, Gamepad2, FileText, Settings, X } from "lucide-react";
import { useState } from "react";

const primaryTabs = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/feed", label: "Feed", Icon: Bell, badge: true },
  { href: "/health", label: "Health", Icon: Heart },
];

const moreItems = [
  { href: "/trading", label: "Trading", Icon: TrendingUp },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", Icon: Gamepad2 },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/systems", label: "Ops", Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useQuery(api.feed.unreadCount);
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Bottom sheet overlay */}
      {moreOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setMoreOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <nav className="bottom-sheet-nav">
              {moreItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`bottom-sheet-link${active ? " active" : ""}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <item.Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="bottom-nav-spacer" />

      {/* Nav bar */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {primaryTabs.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className={`bottom-nav-tab${active ? " active" : ""}`}>
                <span className="bottom-nav-icon">
                  <item.Icon size={20} />
                  {item.badge && (unreadCount ?? 0) > 0 && (
                    <span className="bottom-nav-badge">{unreadCount}</span>
                  )}
                </span>
                <span className="bottom-nav-label">{item.label}</span>
              </Link>
            );
          })}
          <button
            aria-label="More"
            className={`bottom-nav-tab${isMoreActive ? " active" : ""}${moreOpen ? " active" : ""}`}
            onClick={() => setMoreOpen(!moreOpen)}
          >
            <span className="bottom-nav-icon">
              {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
            </span>
            <span className="bottom-nav-label">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
