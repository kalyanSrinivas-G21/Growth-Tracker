"use client";

import { Clock, BookOpen, Flame, ArrowRight } from "lucide-react";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function Today({ data, onNavigate }) {
  const today = toISO(new Date());
  const todayEntries = data.timeEntries.filter((e) => toISO(new Date(e.startedAt)) === today);
  const totalMs = todayEntries.reduce((sum, e) => sum + (e.endedAt - e.startedAt), 0);
  const todayJournal = data.journalEntries.find((e) => e.date === today);
  const todos = todayJournal?.todos ?? [];
  const doneCount = todos.filter((t) => t.status === "done").length;
  const habitsDone = data.habits.filter((h) => (data.habitLogs[h.id] || []).includes(today));

  const rows = [
    {
      icon: <Clock size={16} />,
      text: data.activeTimer
        ? `Currently tracking: ${data.activeTimer.sessionType || "a session"}`
        : data.focusSession
        ? "Focus session in progress"
        : totalMs > 0
        ? `Logged ${Math.round(totalMs / 60000)} minutes today`
        : "No time logged yet today",
      tab: "time",
      cta: "open time",
    },
    {
      icon: <BookOpen size={16} />,
      text: todayJournal
        ? `Journal entry written · ${doneCount}/${todos.length || 0} to-dos done`
        : "No journal entry yet today",
      tab: "journal",
      cta: "open journal",
    },
    {
      icon: <Flame size={16} />,
      text:
        data.habits.length === 0
          ? "No habits set up yet"
          : `${habitsDone.length} of ${data.habits.length} habits done today`,
      tab: "habits",
      cta: "open habits",
    },
  ];

  return (
    <div className="fade-in">
      <h1 className="page-title">Today</h1>
      <p className="page-sub">
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="card">
        <div className="card__title">Snapshot</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((row) => (
            <div
              key={row.tab}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span className="row-icon" style={{ fontSize: 14, color: "var(--color-ink)" }}>
                <span style={{ color: "var(--color-accent)" }}>{row.icon}</span>
                {row.text}
              </span>
              <button
                className="btn btn-sm"
                onClick={() => onNavigate(row.tab)}
              >
                <span className="row-icon">{row.cta} <ArrowRight size={12} /></span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
