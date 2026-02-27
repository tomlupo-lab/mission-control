"use client";

import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: "1.2rem" }}>🚀</span>
        <span className="gradient-text" style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Mission Control</span>
      </div>
      <NavLinks />
    </aside>
  );
}
