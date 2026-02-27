"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Heart, TrendingUp, UtensilsCrossed, Gamepad2, FileText, Settings, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/health", label: "Health", Icon: Heart },
  { href: "/trading", label: "Trading", Icon: TrendingUp },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", Icon: Gamepad2 },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/systems", label: "Ops", Icon: Settings },
];

export default function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={`drawer-backdrop${open ? " open" : ""}`} onClick={onClose} />
      <nav className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span style={{ fontSize: "1.2rem" }}>🚀</span>
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Mission Control</span>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-nav">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link${active ? " active" : ""}`} onClick={onClose}>
                <span className="sidebar-icon"><item.Icon size={18} /></span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
