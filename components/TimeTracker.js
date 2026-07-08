"use client";

import { useEffect, useMemo, useState } from "react";

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function formatClock(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TimeTracker({ data, updateData }) {
  const [category, setCategory] = useState("");
  const [now, setNow] = useState(Date.now());
  const activeTimer = data.activeTimer;

  useEffect(() => {
    if (!activeTimer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeTimer]);

  const recentCategories = useMemo(() => {
    const set = new Set(data.timeEntries.map((e) => e.category));
    return Array.from(set).slice(-8);
  }, [data.timeEntries]);

  function startTimer() {
    const label = category.trim();
    if (!label) return;
    updateData((prev) => ({
      ...prev,
      activeTimer: { category: label, startedAt: Date.now() },
    }));
    setCategory("");
  }

  function stopTimer() {
    if (!activeTimer) return;
    const entry = {
      id: crypto.randomUUID(),
      category: activeTimer.category,
      startedAt: activeTimer.startedAt,
      endedAt: Date.now(),
    };
    updateData((prev) => ({
      ...prev,
      activeTimer: null,
      timeEntries: [entry, ...prev.timeEntries],
    }));
  }

  function deleteEntry(id) {
    updateData((prev) => ({
      ...prev,
      timeEntries: prev.timeEntries.filter((e) => e.id !== id),
    }));
  }

  const todayEntries = data.timeEntries.filter((e) =>
    isSameDay(new Date(e.startedAt), new Date())
  );

  const monthlyByCategory = useMemo(() => {
    const nowDate = new Date();
    const totals = {};
    for (const e of data.timeEntries) {
      const d = new Date(e.startedAt);
      if (
        d.getMonth() === nowDate.getMonth() &&
        d.getFullYear() === nowDate.getFullYear()
      ) {
        totals[e.category] = (totals[e.category] || 0) + (e.endedAt - e.startedAt);
      }
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [data.timeEntries]);

  const maxTotal = monthlyByCategory.length ? monthlyByCategory[0][1] : 0;

  return (
    <>
      <h1 className="page-title">Time</h1>
      <p className="page-sub">Log what you're doing. Review it monthly.</p>

      <div className="card">
        <div className="card__title">
          {activeTimer ? `Tracking: ${activeTimer.category}` : "Start a session"}
        </div>
        {activeTimer ? (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="timer-display">
              {formatClock(now - activeTimer.startedAt)}
            </div>
            <button className="btn btn-danger" onClick={stopTimer}>
              Stop
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              placeholder="e.g. Deep work, Reading, Exercise"
              list="categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startTimer()}
            />
            <datalist id="categories">
              {recentCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <button className="btn btn-primary" onClick={startTimer}>
              Start
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__title">Today</div>
        {todayEntries.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
            Nothing logged yet today.
          </p>
        )}
        {todayEntries.map((e) => (
          <div className="entry-row" key={e.id}>
            <span className="tag">
              <span className="dot" /> {e.category}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-soft)" }}>
              {formatDuration(e.endedAt - e.startedAt)}
            </span>
            <button className="btn btn-sm" onClick={() => deleteEntry(e.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__title">This month, by category</div>
        {monthlyByCategory.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
            No sessions logged this month yet.
          </p>
        )}
        {monthlyByCategory.map(([cat, ms]) => (
          <div className="bar-row" key={cat}>
            <div className="bar-row__label">{cat}</div>
            <div className="bar-row__track">
              <div
                className="bar-row__fill"
                style={{ width: `${maxTotal ? (ms / maxTotal) * 100 : 0}%` }}
              />
            </div>
            <div className="bar-row__value">{formatDuration(ms)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
