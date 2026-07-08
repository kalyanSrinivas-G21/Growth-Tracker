"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Loads data on mount, and exposes a `save` function that writes the whole
// object back to the Drive file. Writes are debounced slightly so rapid
// edits (like typing in the journal) don't fire a request per keystroke.
export function useTrackerData() {
  const [data, setData] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error | saving
  const saveTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setStatus("error");
          return;
        }
        setData(json.data);
        setFileId(json.fileId);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    (nextData, fid) => {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setStatus("saving");
        try {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: fid, data: nextData }),
          });
          setStatus("ready");
        } catch {
          setStatus("error");
        }
      }, 500);
    },
    []
  );

  // Call this with an updater function: updateData(prev => ({...prev, ...}))
  const updateData = useCallback(
    (updater) => {
      setData((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persist(next, fileId);
        return next;
      });
    },
    [fileId, persist]
  );

  return { data, status, updateData };
}
