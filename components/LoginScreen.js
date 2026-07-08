"use client";

import { signIn } from "next-auth/react";

export default function LoginScreen() {
  return (
    <div className="login-screen">
      <h1>
        A quiet place to track your <span style={{ color: "var(--color-accent)" }}>growth</span>.
      </h1>
      <p>
        Time, journal entries, and habit streaks — stored as one plain file in
        your own Google Drive. Nothing goes to any other server. If you delete
        the file, your data is gone with it.
      </p>
      <button className="btn btn-primary" onClick={() => signIn("google")}>
        Continue with Google
      </button>
    </div>
  );
}
