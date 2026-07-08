"use client";

import { useMemo, useState } from "react";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function lastNDays(n) {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(toISO(day));
  }
  return days;
}

function computeStreak(log) {
  const set = new Set(log);
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // If today isn't logged yet, streak counts back from yesterday so it
  // doesn't drop to zero the moment the clock passes midnight.
  if (!set.has(toISO(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (set.has(toISO(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function Habits({ data, updateData }) {
  const [newHabit, setNewHabit] = useState("");
  const days = useMemo(() => lastNDays(70), []);
  const today = toISO(new Date());

  function addHabit() {
    const name = newHabit.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    updateData((prev) => ({
      ...prev,
      habits: [...prev.habits, { id, name }],
      habitLogs: { ...prev.habitLogs, [id]: [] },
    }));
    setNewHabit("");
  }

  function toggleToday(habitId) {
    updateData((prev) => {
      const log = prev.habitLogs[habitId] || [];
      const has = log.includes(today);
      const nextLog = has ? log.filter((d) => d !== today) : [...log, today];
      return { ...prev, habitLogs: { ...prev.habitLogs, [habitId]: nextLog } };
    });
  }

  function removeHabit(habitId) {
    updateData((prev) => {
      const { [habitId]: _, ...restLogs } = prev.habitLogs;
      return {
        ...prev,
        habits: prev.habits.filter((h) => h.id !== habitId),
        habitLogs: restLogs,
      };
    });
  }

  return (
    <>
      <h1 className="page-title">Habits</h1>
      <p className="page-sub">Show up daily. Watch the streak build.</p>

      <div className="card">
        <div className="card__title">Add a habit</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="e.g. Read 10 pages"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
          />
          <button className="btn btn-primary" onClick={addHabit}>
            Add
          </button>
        </div>
      </div>

      {data.habits.length === 0 && (
        <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
          No habits yet — add your first one above.
        </p>
      )}

      {data.habits.map((habit) => {
        const log = data.habitLogs[habit.id] || [];
        const set = new Set(log);
        const streak = computeStreak(log);
        const doneToday = set.has(today);
        return (
          <div className="card" key={habit.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div className="card__title" style={{ marginBottom: 4 }}>
                  {habit.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                  {streak > 0
                    ? `${streak} day${streak === 1 ? "" : "s"} streak`
                    : "No streak yet"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`btn btn-sm ${doneToday ? "btn-primary" : ""}`}
                  onClick={() => toggleToday(habit.id)}
                >
                  {doneToday ? "Done today ✓" : "Mark today"}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => removeHabit(habit.id)}>
                  Remove
                </button>
              </div>
            </div>
            <div className="heatmap">
              {days.map((d) => (
                <div
                  key={d}
                  className="heatmap__cell"
                  title={d}
                  style={{
                    background: set.has(d) ? "var(--color-accent)" : "var(--color-border)",
                    opacity: set.has(d) ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
