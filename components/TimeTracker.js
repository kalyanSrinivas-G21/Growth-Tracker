"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Timer, Trash2, Plus, Clock3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TAG_COLORS } from "../lib/drive";
import { playAlarm, notify, requestNotificationPermission } from "../lib/beep";

function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
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
  const [mode, setMode] = useState("open"); // "open" | "focus"
  const [overviewView, setOverviewView] = useState("tag"); // "tag" | "session"
  const [tagId, setTagId] = useState(data.tags[0]?.id ?? "");
  const [sessionType, setSessionType] = useState("");
  const [now, setNow] = useState(Date.now());

  // Tag creation
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Focus session inputs
  const [hoursInput, setHoursInput] = useState(0);
  const [minutesInput, setMinutesInput] = useState(25);
  const [alarmFired, setAlarmFired] = useState(false);
  const alarmFiredRef = useRef(false);

  const activeTimer = data.activeTimer;
  const focusSession = data.focusSession;

  useEffect(() => {
    if (!activeTimer && !focusSession) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeTimer, focusSession]);

  // Fire the alarm exactly once when a focus session's time is up.
  useEffect(() => {
    if (!focusSession) {
      alarmFiredRef.current = false;
      setAlarmFired(false);
      return;
    }
    const remaining = focusSession.startedAt + focusSession.durationMs - now;
    if (remaining <= 0 && !alarmFiredRef.current) {
      alarmFiredRef.current = true;
      setAlarmFired(true);
      playAlarm();
      notify("Focus session complete", sessionLabel(focusSession));
    }
  }, [now, focusSession]);

  function sessionLabel(session) {
    const tag = data.tags.find((t) => t.id === session.tagId);
    return `${session.sessionType || "Session"}${tag ? ` · ${tag.name}` : ""}`;
  }

  function getTag(id) {
    return data.tags.find((t) => t.id === id);
  }

  const sessionTypeSuggestions = useMemo(() => {
    const set = new Set(
      data.timeEntries.filter((e) => e.tagId === tagId).map((e) => e.sessionType)
    );
    return Array.from(set).filter(Boolean).slice(-10);
  }, [data.timeEntries, tagId]);

  function addTag() {
    const name = newTagName.trim();
    if (!name) return;
    const tag = { id: crypto.randomUUID(), name, color: newTagColor };
    updateData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTagName("");
    setTagId(tag.id);
  }

  function removeTag(id) {
    updateData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t.id !== id) }));
    if (tagId === id) setTagId("");
  }

  function startOpenTimer() {
    if (!tagId) return;
    updateData((prev) => ({
      ...prev,
      activeTimer: { tagId, sessionType: sessionType.trim(), startedAt: Date.now() },
    }));
  }

  function stopOpenTimer() {
    if (!activeTimer) return;
    const entry = {
      id: crypto.randomUUID(),
      tagId: activeTimer.tagId,
      sessionType: activeTimer.sessionType,
      startedAt: activeTimer.startedAt,
      endedAt: Date.now(),
      mode: "open",
    };
    updateData((prev) => ({
      ...prev,
      activeTimer: null,
      timeEntries: [entry, ...prev.timeEntries],
    }));
  }

  function startFocusSession() {
    if (!tagId) return;
    const durationMs = (Number(hoursInput) * 60 + Number(minutesInput)) * 60000;
    if (durationMs <= 0) return;
    requestNotificationPermission();
    updateData((prev) => ({
      ...prev,
      focusSession: {
        tagId,
        sessionType: sessionType.trim(),
        startedAt: Date.now(),
        durationMs,
      },
    }));
  }

  function endFocusSession() {
    if (!focusSession) return;
    const entry = {
      id: crypto.randomUUID(),
      tagId: focusSession.tagId,
      sessionType: focusSession.sessionType,
      startedAt: focusSession.startedAt,
      endedAt: Date.now(),
      mode: "focus",
    };
    updateData((prev) => ({
      ...prev,
      focusSession: null,
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

  const monthlyByTag = useMemo(() => {
    const nowDate = new Date();
    const totals = {};
    for (const e of data.timeEntries) {
      const d = new Date(e.startedAt);
      if (d.getMonth() === nowDate.getMonth() && d.getFullYear() === nowDate.getFullYear()) {
        totals[e.tagId] = (totals[e.tagId] || 0) + (e.endedAt - e.startedAt);
      }
    }
    return Object.entries(totals)
      .map(([id, ms]) => ({ id, ms, tag: getTag(id) }))
      .sort((a, b) => b.ms - a.ms);
  }, [data.timeEntries, data.tags]);

  const monthlyBySession = useMemo(() => {
    const nowDate = new Date();
    const totals = {};
    for (const e of data.timeEntries) {
      const d = new Date(e.startedAt);
      if (d.getMonth() === nowDate.getMonth() && d.getFullYear() === nowDate.getFullYear()) {
        const key = e.sessionType || "(no session type)";
        if (!totals[key]) totals[key] = { ms: 0, tagId: e.tagId };
        totals[key].ms += e.endedAt - e.startedAt;
      }
    }
    return Object.entries(totals)
      .map(([label, v]) => ({ label, ms: v.ms, tag: getTag(v.tagId) }))
      .sort((a, b) => b.ms - a.ms);
  }, [data.timeEntries, data.tags]);

  const activeList = overviewView === "tag" ? monthlyByTag : monthlyBySession;
  const maxTotal = activeList.length ? activeList[0].ms : 0;

  const focusRemaining = focusSession
    ? focusSession.startedAt + focusSession.durationMs - now
    : 0;
  const focusProgress = focusSession
    ? Math.min(1, Math.max(0, 1 - focusRemaining / focusSession.durationMs))
    : 0;
  const RING_R = 52;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className="fade-in">
      <h1 className="page-title">Time</h1>
      <p className="page-sub">Tag it, time it, review it monthly.</p>

      {/* Tags */}
      <div className="card">
        <div className="card__title">Tags</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {data.tags.length === 0 && (
            <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>
              No tags yet. Create one below — e.g. "Studying", then track "ML" or
              "DBMS" sessions under it.
            </p>
          )}
          {data.tags.map((tag) => (
            <span
              key={tag.id}
              className="tag-chip"
              style={{ background: `${tag.color}22`, color: tag.color }}
            >
              <span className="tag-dot" style={{ background: tag.color }} />
              {tag.name}
              <button
                onClick={() => removeTag(tag.id)}
                style={{ background: "none", border: "none", color: "inherit", padding: 0, display: "flex" }}
                aria-label={`Remove ${tag.name}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ maxWidth: 200 }}
            placeholder="New tag, e.g. Studying"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
          />
          <div className="swatch-row">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${newTagColor === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setNewTagColor(c)}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={addTag}>
            <span className="row-icon"><Plus size={14} /> Add tag</span>
          </button>
        </div>
      </div>

      {/* Start session */}
      <div className="card">
        <div className="habit-header">
          <div className="card__title" style={{ marginBottom: 0 }}>
            {activeTimer
              ? `Tracking: ${activeTimer.sessionType || getTag(activeTimer.tagId)?.name}`
              : focusSession
              ? "Focus session running"
              : "Start a session"}
          </div>
          {!activeTimer && !focusSession && (
            <div className="segmented">
              <button
                className={`segmented__option ${mode === "open" ? "active" : ""}`}
                onClick={() => setMode("open")}
              >
                Open timer
              </button>
              <button
                className={`segmented__option ${mode === "focus" ? "active" : ""}`}
                onClick={() => setMode("focus")}
              >
                Focus session
              </button>
            </div>
          )}
        </div>

        {/* Running open timer */}
        {activeTimer && (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="timer-display">{formatClock(now - activeTimer.startedAt)}</div>
            <button className="btn btn-danger" onClick={stopOpenTimer}>
              <span className="row-icon"><Square size={14} /> Stop</span>
            </button>
          </div>
        )}

        {/* Running focus session */}
        {focusSession && (
          <div className="focus-ring-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120" className="focus-ring">
              <circle cx="60" cy="60" r={RING_R} className="focus-ring__bg" />
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                className="focus-ring__fg"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - focusProgress)}
              />
            </svg>
            <div>
              <div className="timer-display">{formatClock(Math.max(0, focusRemaining))}</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: "8px 0 12px" }}>
                {sessionLabel(focusSession)}
              </div>
              <button className="btn btn-danger" onClick={endFocusSession}>
                <span className="row-icon"><Square size={14} /> {alarmFired ? "Log & finish" : "Stop early"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Idle: pick tag / session type / mode-specific inputs */}
        {!activeTimer && !focusSession && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                className="input"
                style={{ maxWidth: 200 }}
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
              >
                <option value="">Choose a tag…</option>
                {data.tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                style={{ maxWidth: 220 }}
                placeholder="Session type, e.g. ML"
                list="session-types"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
              />
              <datalist id="session-types">
                {sessionTypeSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {mode === "focus" && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                  <Clock3 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                  Duration
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  className="input"
                  style={{ width: 70 }}
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                />
                <span style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>hrs</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  className="input"
                  style={{ width: 70 }}
                  value={minutesInput}
                  onChange={(e) => setMinutesInput(e.target.value)}
                />
                <span style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>min</span>
              </div>
            )}

            <div>
              <button
                className="btn btn-primary"
                disabled={!tagId}
                onClick={mode === "open" ? startOpenTimer : startFocusSession}
              >
                <span className="row-icon">
                  {mode === "open" ? <Play size={14} /> : <Timer size={14} />}
                  {mode === "open" ? "Start" : "Start focus session"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Today */}
      <div className="card">
        <div className="card__title">Today</div>
        {todayEntries.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>Nothing logged yet today.</p>
        )}
        <AnimatePresence initial={false}>
          {todayEntries.map((e) => {
            const tag = getTag(e.tagId);
            return (
              <motion.div
                className="entry-row"
                key={e.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span
                  className="tag-chip"
                  style={{ background: `${tag?.color || "#999"}22`, color: tag?.color || "#999" }}
                >
                  <span className="tag-dot" style={{ background: tag?.color || "#999" }} />
                  {tag?.name || "Untagged"}
                </span>
                <span style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>{e.sessionType}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-soft)" }}>
                  {formatDuration(e.endedAt - e.startedAt)}
                </span>
                <button className="icon-btn danger" onClick={() => deleteEntry(e.id)} aria-label="Remove entry">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Monthly overview */}
      <div className="card">
        <div className="habit-header">
          <div className="card__title" style={{ marginBottom: 0 }}>This month</div>
          <div className="segmented">
            <button
              className={`segmented__option ${overviewView === "tag" ? "active" : ""}`}
              onClick={() => setOverviewView("tag")}
            >
              By tag
            </button>
            <button
              className={`segmented__option ${overviewView === "session" ? "active" : ""}`}
              onClick={() => setOverviewView("session")}
            >
              By session
            </button>
          </div>
        </div>
        {activeList.length === 0 && (
          <p style={{ color: "var(--color-ink-soft)", fontSize: 14 }}>No sessions logged this month yet.</p>
        )}
        {activeList.map((row) => {
          const label = overviewView === "tag" ? row.tag?.name || "Untagged" : row.label;
          const color = row.tag?.color || "#999";
          return (
            <div className="bar-row" key={label}>
              <div className="bar-row__label">{label}</div>
              <div className="bar-row__track">
                <div
                  className="bar-row__fill"
                  style={{
                    width: `${maxTotal ? (row.ms / maxTotal) * 100 : 0}%`,
                    background: color,
                  }}
                />
              </div>
              <div className="bar-row__value">{formatDuration(row.ms)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
