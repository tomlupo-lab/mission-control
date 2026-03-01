"use client";

import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: "1.2rem", filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))" }}>🚀</span>
        <span className="gradient-text" style={{ fontWeight: 800, fontSize: "var(--text-lg)", letterSpacing: "0.5px", filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))" }}>Mission Control</span>
      </div>
      <NavLinks />
    </aside>
  );
}
