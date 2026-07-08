const FILE_NAME = "growth-tracker-data.json";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";

const EMPTY_DATA = {
  timeEntries: [], // { id, category, startedAt, endedAt, note }
  activeTimer: null, // { category, startedAt } or null
  journalEntries: [], // { id, date, text }
  habits: [], // { id, name, color }
  habitLogs: {}, // { [habitId]: ["2026-07-01", "2026-07-02", ...] }
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

// Finds the app's data file in Drive. Because we use the `drive.file` scope,
// this only ever sees files this app itself created — nothing else in the user's Drive.
async function findFileId(accessToken) {
  const q = encodeURIComponent(
    `name='${FILE_NAME}' and trashed=false`
  );
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
  const res = await driveFetch(
    accessToken,
    `${DRIVE_API}/${fileId}?alt=media`
  );
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return EMPTY_DATA;
  }
}

async function updateFile(accessToken, fileId, data) {
  await driveFetch(
    accessToken,
    `${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

// Public API: get the current data, creating the file with empty defaults
// the very first time a user logs in.
export async function loadData(accessToken) {
  let fileId = await findFileId(accessToken);
  if (!fileId) {
    fileId = await createFile(accessToken, EMPTY_DATA);
    return { fileId, data: EMPTY_DATA };
  }
  const data = await readFile(accessToken, fileId);
  return { fileId, data: { ...EMPTY_DATA, ...data } };
}

export async function saveData(accessToken, fileId, data) {
  await updateFile(accessToken, fileId, data);
}

export { EMPTY_DATA };
