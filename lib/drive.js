const FILE_NAME = "growth-tracker-data.json";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";

// Curated palette so tag colors stay consistent with the app's theme.
export const TAG_COLORS = [
  "#5B7A62", // sage (default accent)
  "#7A6A9B", // muted violet
  "#B08650", // ochre
  "#4F7A8C", // slate blue
  "#A25B4A", // clay
  "#6E8C5B", // moss
  "#8C6B8F", // plum
  "#5B7A9B", // steel blue
];

const EMPTY_DATA = {
  tags: [], // { id, name, color }
  timeEntries: [], // { id, tagId, sessionType, startedAt, endedAt, mode: "open" | "focus" }
  activeTimer: null, // { tagId, sessionType, startedAt } or null
  focusSession: null, // { tagId, sessionType, startedAt, durationMs } or null
  journalEntries: [], // { id, date, title, text, todos: [{id, text, status}] }
  journalStats: { done: 0, missed: 0 }, // lifetime tally of todo outcomes
  habits: [], // { id, name, color }
  habitLogs: {}, // { [habitId]: ["2026-07-01", ...] }
};

async function driveFetch(accessToken, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API error ${res.status}: ${text}`);
  }
  return res;
}

async function findFileId(accessToken) {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const url = `${DRIVE_API}?q=${q}&spaces=drive&fields=files(id,name)`;
  const res = await driveFetch(accessToken, url);
  const json = await res.json();
  return json.files && json.files.length > 0 ? json.files[0].id : null;
}

async function createFile(accessToken, data) {
  const metadata = { name: FILE_NAME, mimeType: "application/json" };
  const boundary = "growth_tracker_boundary";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`;

  const res = await driveFetch(
    accessToken,
    `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  const json = await res.json();
  return json.id;
}

async function readFile(accessToken, fileId) {
  const res = await driveFetch(accessToken, `${DRIVE_API}/${fileId}?alt=media`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return EMPTY_DATA;
  }
}

async function updateFile(accessToken, fileId, data) {
  await driveFetch(accessToken, `${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function loadData(accessToken) {
  let fileId = await findFileId(accessToken);
  if (!fileId) {
    fileId = await createFile(accessToken, EMPTY_DATA);
    return { fileId, data: EMPTY_DATA };
  }
  const data = await readFile(accessToken, fileId);
  // Merge with defaults so older data files (or partially-written ones)
  // never crash the UI on missing fields.
  const merged = {
    ...EMPTY_DATA,
    ...data,
    journalStats: { ...EMPTY_DATA.journalStats, ...(data.journalStats || {}) },
  };
  return { fileId, data: merged };
}

export async function saveData(accessToken, fileId, data) {
  await updateFile(accessToken, fileId, data);
}

export { EMPTY_DATA };
