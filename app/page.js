"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import LoginScreen from "../components/LoginScreen";
import Sidebar from "../components/Sidebar";
import Today from "../components/Today";
import TimeTracker from "../components/TimeTracker";
import Journal from "../components/Journal";
import Habits from "../components/Habits";
import { useTrackerData } from "../lib/useTrackerData";

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [tab, setTab] = useState("today");
  const { data, status, updateData } = useTrackerData();

  if (authStatus === "loading") return null;
  if (!session) return <LoginScreen />;

  return (
    <div className="shell">
      <Sidebar active={tab} onChange={setTab} status={status} userEmail={session.user?.email} />
      <main className="main">
        {status === "loading" && <p>Loading your data from Drive…</p>}
        {status === "error" && (
          <p style={{ color: "var(--color-danger)" }}>
            Couldn't reach Google Drive. Try refreshing — if it keeps happening, sign out and
            sign back in.
          </p>
        )}
        {data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === "today" && <Today data={data} onNavigate={setTab} />}
              {tab === "time" && <TimeTracker data={data} updateData={updateData} />}
              {tab === "journal" && <Journal data={data} updateData={updateData} />}
              {tab === "habits" && <Habits data={data} updateData={updateData} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
