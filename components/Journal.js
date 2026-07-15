"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Circle, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [title, setTitle] = useState(existingToday?.title ?? "");
  const [draft, setDraft] = useState(existingToday?.text ?? "");
  const [newTodo, setNewTodo] = useState("");
  const [query, setQuery] = useState("");

  const todos = existingToday?.todos ?? [];

  // Ensure today's entry exists so todos have somewhere to live, without
  // wiping title/text the user hasn't saved yet.
  function withTodayEntry(updater) {
    updateData((prev) => {
      const others = prev.journalEntries.filter((e) => e.date !== today);
      const base = prev.journalEntries.find((e) => e.date === today) ?? {
        id: crypto.randomUUID(),
        date: today,
        title: "",
        text: "",
        todos: [],
      };
      const updated = updater(base);
      return {
        ...prev,
        journalEntries: [updated, ...others].sort((a, b) => (a.date < b.date ? 1 : -1)),
      };
    });
  }

  function saveEntry() {
    withTodayEntry((entry) => ({ ...entry, title, text: draft }));
  }

  function addTodo() {
    const text = newTodo.trim();
    if (!text) return;
    withTodayEntry((entry) => ({
      ...entry,
      todos: [...entry.todos, { id: crypto.randomUUID(), text, status: "pending" }],
    }));
    setNewTodo("");
  }

  function setTodoStatus(id, status) {
    withTodayEntry((entry) => ({
      ...entry,
      todos: entry.todos.map((t) =>
        t.id === id ? { ...t, status: t.status === status ? "pending" : status } : t
      ),
    }));
  }

  function removeTodo(id) {
    withTodayEntry((entry) => ({ ...entry, todos: entry.todos.filter((t) => t.id !== id) }));
  }

  // Lifetime tally across every day's todo list — the running "follow-through" score.
  const tally = useMemo(() => {
    let done = 0;
    let missed = 0;
    for (const entry of data.journalEntries) {
      for (const t of entry.todos || []) {
        if (t.status === "done") done += 1;
        else if (t.status === "missed") missed += 1;
      }
    }
    return { done, missed };
  }, [data.journalEntries]);

  const pastEntries = useMemo(() => {
    return data.journalEntries
      .filter((e) => e.date !== today)
      .filter(
        (e) =>
          e.text.toLowerCase().includes(query.toLowerCase()) ||
          (e.title || "").toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data.journalEntries, today, query]);

  return (
    <div className="fade-in">
      <div className="habit-header">
        <div>
          <h1 className="page-title">Journal</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Write a little about today. Read it back whenever you need to.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="tally green">
            <CheckCircle2 size={14} /> {tally.done}
          </span>
          <span className="tally red">
            <XCircle size={14} /> {tally.missed}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card__title">{formatDateLabel(today)}</div>
        <input
          className="input"
          style={{ marginBottom: 10, fontFamily: "var(--font-display)", fontSize: 16 }}
          placeholder="Give today a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What happened today? How did it feel?"
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={saveEntry}>
            Save entry
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Today's to-dos</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Add something to get done today…"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button className="btn btn-primary" onClick={addTodo}>
            <Plus size={14} />
          </button>
        </div>
        {todos.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
            Nothing on today's list yet.
          </p>
        )}
        <AnimatePresence initial={false}>
          {todos.map((t) => (
            <motion.div
              className="todo-row"
              key={t.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <button
                className={`icon-btn ${t.status === "done" ? "on" : ""}`}
                style={t.status === "done" ? { background: "#4a7a55", borderColor: "#4a7a55" } : {}}
                onClick={() => setTodoStatus(t.id, "done")}
                aria-label="Mark done"
              >
                {t.status === "done" ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <span
                className={`todo-row__text ${t.status === "done" ? "done" : ""} ${
                  t.status === "missed" ? "missed" : ""
                }`}
              >
                {t.text}
              </span>
              <button
                className="icon-btn"
                style={
                  t.status === "missed"
                    ? { background: "var(--color-danger)", borderColor: "var(--color-danger)", color: "#fff" }
                    : {}
                }
                onClick={() => setTodoStatus(t.id, "missed")}
                aria-label="Mark not done"
              >
                <XCircle size={16} />
              </button>
              <button className="icon-btn" onClick={() => removeTodo(t.id)} aria-label="Delete todo">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
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
          <div key={e.id} style={{ marginBottom: 22 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--color-ink-soft)",
                marginBottom: 4,
              }}
            >
              {formatDateLabel(e.date)}
            </div>
            {e.title && (
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 4 }}>
                {e.title}
              </div>
            )}
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
