"use client";

import { signOut } from "next-auth/react";

const TABS = [
  { id: "today", label: "Today" },
  { id: "time", label: "Time" },
  { id: "journal", label: "Journal" },
  { id: "habits", label: "Habits" },
];

export default function Sidebar({ active, onChange, status, userEmail }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        ground<span>.</span>
      </div>
      <nav className="sidebar__nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar__link ${active === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div>{status === "saving" ? "Saving…" : "Synced to Drive"}</div>
        <div style={{ marginTop: 2, opacity: 0.7 }}>{userEmail}</div>
        <button className="sidebar__signout" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
