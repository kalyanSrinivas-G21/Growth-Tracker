"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Flame, Pencil, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TAG_COLORS } from "../lib/drive";

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
  const [editMode, setEditMode] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const days = useMemo(() => lastNDays(120), []);
  const today = toISO(new Date());

  function addHabit() {
    const name = newHabit.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    updateData((prev) => ({
      ...prev,
      habits: [...prev.habits, { id, name, color: newColor }],
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
    <div className="fade-in">
      <div className="habit-header">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Tap daily. Watch the streak build.
          </p>
        </div>
        <button className="btn" onClick={() => setEditMode((v) => !v)}>
          <span className="row-icon">
            {editMode ? <X size={14} /> : <Pencil size={14} />}
            {editMode ? "Done editing" : "Edit habits"}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {editMode && (
          <motion.div
            className="card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="card__title">Add a habit</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <input
                className="input"
                style={{ maxWidth: 220 }}
                placeholder="e.g. Read 10 pages"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
              />
              <div className="swatch-row">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${newColor === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
              <button className="btn btn-primary" onClick={addHabit}>
                <span className="row-icon"><Plus size={14} /> Add</span>
              </button>
            </div>

            <div className="card__title" style={{ fontSize: 13 }}>Existing habits</div>
            {data.habits.length === 0 && (
              <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>None yet.</p>
            )}
            {data.habits.map((h) => (
              <div className="entry-row" key={h.id}>
                <span className="row-icon">
                  <span className="tag-dot" style={{ background: h.color || "var(--color-accent)" }} />
                  {h.name}
                </span>
                <button className="icon-btn danger" onClick={() => removeHabit(h.id)} aria-label={`Remove ${h.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {data.habits.length === 0 && !editMode && (
        <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
          No habits yet — click "Edit habits" to add your first one.
        </p>
      )}

      {data.habits.map((habit) => {
        const log = data.habitLogs[habit.id] || [];
        const set = new Set(log);
        const streak = computeStreak(log);
        const doneToday = set.has(today);
        const color = habit.color || "var(--color-accent)";
        return (
          <div className="card" key={habit.id}>
            <div className="habit-title-row" style={{ marginBottom: 16 }}>
              <button
                className={`icon-btn icon-btn-lg ${doneToday ? "on" : ""}`}
                style={doneToday ? { background: color, borderColor: color } : { color }}
                onClick={() => toggleToday(habit.id)}
                aria-label={doneToday ? "Marked done today" : "Mark today done"}
              >
                {doneToday ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>
              <div>
                <div className="card__title" style={{ marginBottom: 2 }}>{habit.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
                  {doneToday ? "Done today" : "Not done yet today"}
                </div>
              </div>
            </div>

            <div className="habit-track">
              <div className="habit-scroll">
                <div className="habit-grid">
                  {days.map((d) => (
                    <div
                      key={d}
                      className="habit-cell"
                      title={d}
                      style={{
                        background: set.has(d) ? color : "var(--color-border)",
                        opacity: set.has(d) ? 1 : 0.45,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="streak-badge">
                <div className="streak-badge__num" style={{ color }}>
                  <Flame size={16} /> {streak}
                </div>
                <div className="streak-badge__label">day streak</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
