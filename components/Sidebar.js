"use client";

import { signOut } from "next-auth/react";
import { Sun, Clock, BookOpen, Flame, LogOut } from "lucide-react";

const TABS = [
  { id: "today", label: "Today", icon: Sun },
  { id: "time", label: "Time", icon: Clock },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "habits", label: "Habits", icon: Flame },
];

export default function Sidebar({ active, onChange, status, userEmail }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        ground<span>.</span>
      </div>
      <nav className="sidebar__nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sidebar__link ${active === tab.id ? "active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__footer">
        <div>{status === "saving" ? "Saving…" : "Synced to Drive"}</div>
        <div style={{ marginTop: 2, opacity: 0.7 }}>{userEmail}</div>
        <button className="sidebar__signout" onClick={() => signOut()}>
          <span className="row-icon"><LogOut size={12} /> Sign out</span>
        </button>
      </div>
    </aside>
  );
}
