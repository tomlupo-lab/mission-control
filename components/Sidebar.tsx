"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/health", label: "Health", icon: "❤️" },
  { href: "/trading", label: "Trading", icon: "📈" },
  { href: "/meals", label: "Meals", icon: "🍽️" },
  { href: "/progress", label: "Progress", icon: "🎮" },
  { href: "/reports", label: "Reports", icon: "📋" },
  { href: "/systems", label: "Ops", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: "1.2rem" }}>🚀</span>
        <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Mission Control</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link${active ? " active" : ""}`}>
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
