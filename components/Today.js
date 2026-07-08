"use client";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function Today({ data, onNavigate }) {
  const today = toISO(new Date());
  const todayEntries = data.timeEntries.filter((e) =>
    toISO(new Date(e.startedAt)) === today
  );
  const totalMs = todayEntries.reduce((sum, e) => sum + (e.endedAt - e.startedAt), 0);
  const hasJournal = data.journalEntries.some((e) => e.date === today);
  const habitsDone = data.habits.filter((h) => (data.habitLogs[h.id] || []).includes(today));

  return (
    <>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
          <div>
            {data.activeTimer
              ? `Currently tracking: ${data.activeTimer.category}`
              : totalMs > 0
              ? `Logged ${Math.round(totalMs / 60000)} minutes today`
              : "No time logged yet today"}
            {" — "}
            <button className="sidebar__signout" onClick={() => onNavigate("time")}>
              open time
            </button>
          </div>
          <div>
            {hasJournal ? "Journal entry written today" : "No journal entry yet today"}
            {" — "}
            <button className="sidebar__signout" onClick={() => onNavigate("journal")}>
              open journal
            </button>
          </div>
          <div>
            {data.habits.length === 0
              ? "No habits set up yet"
              : `${habitsDone.length} of ${data.habits.length} habits done today`}
            {" — "}
            <button className="sidebar__signout" onClick={() => onNavigate("habits")}>
              open habits
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
