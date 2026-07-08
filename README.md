# Ground — a quiet personal growth tracker

Time tracking, a daily journal, and habit streaks — all stored as a single
JSON file in **your own Google Drive**. There's no database and no third
server: this app just reads and writes one file it creates in your Drive,
using a scope (`drive.file`) that only lets it see files it made itself —
never anything else in your Drive.

It's a real Next.js app, meant to be deployed on **Vercel's free Hobby
tier**, which costs nothing for personal use like this.

---

## What you're setting up

Two things need to exist before this works:

1. A **Google Cloud OAuth client** (so the app can ask Google "let this
   person sign in and let me create one file in their Drive")
2. A **Vercel deployment** (so the app has a URL and runs for free)

This takes about 15 minutes the first time. You only do it once.

---

## Part 1 — Google Cloud setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   create a new project (top-left project dropdown → **New Project**). Call
   it anything, e.g. "Ground Tracker".

2. **Enable the Drive API**: in the search bar, type "Google Drive API" →
   open it → click **Enable**.

3. **Configure the OAuth consent screen**: left sidebar → *APIs & Services*
   → *OAuth consent screen*.
   - User type: **External** (this just means "any Google account," not
     "public" — you'll be the only one who ever signs in)
   - Fill in app name (e.g. "Ground"), your email as support email, and your
     email again as developer contact
   - On the **Scopes** step, click **Add or remove scopes** and add:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `https://www.googleapis.com/auth/drive.file`
   - On the **Test users** step, add your own Google email address
   - Save through to the end

4. **Create credentials**: *APIs & Services* → *Credentials* → **Create
   Credentials** → **OAuth client ID**.
   - Application type: **Web application**
   - Name: anything
   - **Authorized redirect URIs** — add both of these for now (you'll add
     your real Vercel URL after deploying in Part 2):
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**. Copy the **Client ID** and **Client Secret** — you'll
     need them in a minute.

5. **About the 7-day sign-in limit**: while your app is in "Testing" status,
   Google expires your login every 7 days (a safeguard for unverified apps).
   Since this is just for you, the simplest fix is: once everything works,
   go to *OAuth consent screen* → **Publish App**. You'll see an "unverified
   app" warning when you sign in — click **Advanced → Go to Ground
   (unsafe)** — that's expected for a personal project that hasn't gone
   through Google's public-app review, and it removes the 7-day limit.

---

## Part 2 — Deploy to Vercel (free)

**Option A — via GitHub (recommended)**

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in, click **Add New →
   Project**, and import that repository.
3. Before deploying, expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | from Part 1 step 4 |
   | `GOOGLE_CLIENT_SECRET` | from Part 1 step 4 |
   | `NEXTAUTH_SECRET` | run `openssl rand -base64 32` locally and paste the result |
   | `NEXTAUTH_URL` | your future Vercel URL, e.g. `https://ground-tracker.vercel.app` (Vercel shows you this before you deploy — you can also edit it after) |
4. Click **Deploy**.

**Option B — via Vercel CLI**

```bash
npm install -g vercel
cd growth-tracker
vercel
# follow the prompts, then set env vars:
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel --prod
```

**After your first deploy**, copy your real `https://your-app.vercel.app`
URL and:
- Add `https://your-app.vercel.app/api/auth/callback/google` to the
  **Authorized redirect URIs** in your Google OAuth client (Part 1, step 4)
- Update the `NEXTAUTH_URL` environment variable on Vercel to match exactly
- Redeploy (Vercel → Deployments → ⋯ → Redeploy)

That's it — visit your URL, sign in with Google, and it'll create
`growth-tracker-data.json` in your Drive the first time you log in.

---

## Running it locally first (optional but recommended)

```bash
cd growth-tracker
npm install
cp .env.local.example .env.local
# fill in .env.local with your Client ID/Secret and a generated NEXTAUTH_SECRET
npm run dev
```
Visit `http://localhost:3000`.

---

## How your data is stored

Everything lives in one file: **`growth-tracker-data.json`**, visible in
your own Google Drive (search for it there any time). It looks like:

```json
{
  "timeEntries": [{ "id": "...", "category": "Deep work", "startedAt": 0, "endedAt": 0 }],
  "activeTimer": null,
  "journalEntries": [{ "id": "...", "date": "2026-07-08", "text": "..." }],
  "habits": [{ "id": "...", "name": "Read 10 pages" }],
  "habitLogs": { "habit-id": ["2026-07-08"] }
}
```

You can open it in Drive, download it, back it up, or edit it by hand if
you're comfortable with JSON — it's not locked away anywhere.

## Notes on "free forever"

- **Vercel Hobby tier**: free for personal, non-commercial projects, with
  generous limits you won't come close to for an app like this.
- **Google APIs**: the Drive API has no cost for this kind of light,
  personal read/write usage.
- Nothing here requires a credit card.
