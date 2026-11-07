import { useState } from "react";
import { supabase } from "../supabase";
import { useAccount } from "../AccountContext";
export function AccountPanel({
  plan,
  onLoad,
  revision,
  onRevision,
}: {
  plan: unknown;
  onLoad: (plan: unknown) => void;
  revision: number;
  onRevision: (n: number) => void;
}) {
  const { session } = useAccount();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function auth(signup: boolean) {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: location.origin },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      setMessage(
        error
          ? error.message
          : signup
            ? "Check your inbox to confirm your account, then sign in."
            : "Signed in. Your account has a separate workspace.",
      );
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function sync(load: boolean) {
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = load
        ? await supabase.rpc("load_workspace")
        : await supabase.rpc("save_workspace", {
            payload: plan,
            expected_revision: revision,
          });
      if (error) throw error;
      if (load) {
        onRevision(data.revision || 0);
        onLoad(data.plan);
        setMessage("Account workspace loaded on this device.");
      } else {
        onRevision(data);
        setMessage("Workspace saved to your account.");
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Sync failed. Load the latest cloud workspace before saving; your local copy is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="profile-form">
      <h2>Your workspace, your account.</h2>
      <p className="note">
        Your guest workspace saves in this browser. Sign-in and cloud sync are
        optional; if you enable them, load before editing and save when ready.
      </p>
      {!supabase ? (
        <div className="config-state">
          <h3>Cloud sign-in is not configured on this app yet</h3>
          <p>
            You are using a guest workspace. It works in this browser, but
            sign-in and cross-device sync need a Supabase project. The Gemini
            API key is separate and does not create user accounts.
          </p>
          <ol className="application-instructions account-setup-steps">
            <li>
              Create a Supabase project and enable Email provider sign-in.
            </li>
            <li>
              In its SQL Editor, run{" "}
              <code>supabase/migrations/001_grantly.sql</code>.
            </li>
            <li>
              In <code>.env.local</code>, set <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> from that project.
            </li>
            <li>
              Set the Supabase Site URL and redirect URL to{" "}
              <code>http://127.0.0.1:5173</code>, then restart{" "}
              <code>npm run dev</code>.
            </li>
          </ol>
          <p>
            Use only the publishable key—never a service-role or secret key.
            Your guest progress remains saved in this browser.
          </p>
        </div>
      ) : session ? (
        <>
          <p>
            Signed in as <b>{session.user.email}</b>
          </p>
          <button
            className="outline"
            onClick={() => {
              try {
                const guest = localStorage.getItem("grantly-v2-guest");
                if (!guest) {
                  setMessage("No guest workspace found on this device.");
                  return;
                }
                if (
                  confirm(
                    "Copy this device’s guest progress into the signed-in local workspace? Cloud data is not changed until you save.",
                  )
                ) {
                  onLoad(JSON.parse(guest));
                  setMessage(
                    "Guest progress copied locally. Save to account when ready.",
                  );
                }
              } catch {
                setMessage("Guest progress could not be read.");
              }
            }}
          >
            Copy guest progress on this device
          </button>
          <div className="modal-actions">
            <button
              disabled={busy}
              className="primary"
              onClick={() => sync(false)}
            >
              Save to account
            </button>
            <button
              disabled={busy}
              className="outline"
              onClick={() => {
                if (
                  confirm(
                    "Replace this device’s workspace with your saved account workspace?",
                  )
                )
                  void sync(true);
              }}
            >
              Load from account
            </button>
            <button
              className="outline"
              onClick={() => supabase?.auth.signOut()}
            >
              Sign out
            </button>
          </div>
          <p className="note">
            Concurrent changes are protected by a revision check. If another
            device saved changes, load the latest workspace before saving again.
          </p>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void auth(false);
          }}
        >
          <div className="form-grid">
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          <div className="modal-actions">
            <button disabled={busy} className="primary">
              {busy ? "Connecting…" : "Sign in"}
            </button>
            <button
              disabled={busy || password.length < 8 || !email.includes("@")}
              className="outline"
              type="button"
              onClick={() => auth(true)}
            >
              Create account
            </button>
          </div>
        </form>
      )}
      <p role="status" className="note">
        {message}
      </p>
    </section>
  );
}
