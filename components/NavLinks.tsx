"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Heart, TrendingUp, UtensilsCrossed, Gamepad2, FileText, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/health", label: "Health", Icon: Heart },
  { href: "/trading", label: "Trading", Icon: TrendingUp },
  { href: "/meals", label: "Meals", Icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", Icon: Gamepad2 },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/systems", label: "Ops", Icon: Settings },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="sidebar-nav">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`sidebar-link${active ? " active" : ""}`}>
            <span className="sidebar-icon"><item.Icon size={18} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
