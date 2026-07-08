"use client";

import { useMemo, useState } from "react";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Journal({ data, updateData }) {
  const today = todayISO();
  const existingToday = data.journalEntries.find((e) => e.date === today);
  const [draft, setDraft] = useState(existingToday ? existingToday.text : "");
  const [query, setQuery] = useState("");

  function save() {
    updateData((prev) => {
      const withoutToday = prev.journalEntries.filter((e) => e.date !== today);
      const entry = { id: existingToday?.id ?? crypto.randomUUID(), date: today, text: draft };
      return {
        ...prev,
        journalEntries: [entry, ...withoutToday].sort((a, b) =>
          a.date < b.date ? 1 : -1
        ),
      };
    });
  }

  const pastEntries = useMemo(() => {
    return data.journalEntries
      .filter((e) => e.date !== today)
      .filter((e) => e.text.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.journalEntries, today, query]);

  return (
    <>
      <h1 className="page-title">Journal</h1>
      <p className="page-sub">Write a little about today. Read it back whenever you need to.</p>

      <div className="card">
        <div className="card__title">{formatDateLabel(today)}</div>
        <textarea
          className="textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What happened today? How did it feel?"
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={save}>
            Save entry
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Look back</div>
        <input
          className="input"
          placeholder="Search past entries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {pastEntries.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
            {data.journalEntries.length <= 1
              ? "Nothing here yet — come back after a few more days."
              : "No entries match that search."}
          </p>
        )}
        {pastEntries.map((e) => (
          <div key={e.id} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--color-ink-soft)",
                marginBottom: 6,
              }}
            >
              {formatDateLabel(e.date)}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {e.text}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
