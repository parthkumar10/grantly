import { useState, useEffect } from "react";
import { opportunities, daysLeft, deadlineLabel } from "../../lib/scholarships";
export function Deadlines({
  saved,
  apps,
  onOpen,
  storageKey,
}: {
  saved: number[];
  apps: Record<number, string>;
  onOpen: (id: number) => void;
  storageKey: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const [view, setView] = useState("Timeline");
  const [month, setMonth] = useState(() =>
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    ).getMonth(),
  );
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [prefs, setPrefs] = useState(() => {
    try {
      const v = JSON.parse(
        localStorage.getItem(storageKey + "-reminders") || "{}",
      );
      return {
        enabled: v.enabled === true,
        lead: [1, 3, 7, 14, 30].includes(v.lead) ? v.lead : 7,
      };
    } catch {
      return { enabled: false, lead: 7 };
    }
  });
  const [error, setError] = useState("");
  const known = opportunities.filter(
    (s) => s.deadlineStatus === "verified" && s.deadline,
  );
  const reminders = known.filter(
    (s) =>
      (saved.includes(s.id) || apps[s.id]) &&
      !["Submitted", "Decision Pending", "Awarded", "Not selected"].includes(
        apps[s.id],
      ) &&
      daysLeft(s) >= 0 &&
      daysLeft(s) <= prefs.lead,
  );
  function update(next: typeof prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(storageKey + "-reminders", JSON.stringify(next));
      setError("");
    } catch {
      setError("Reminder preferences could not be saved.");
    }
  }
  function move(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  return (
    <section className="deadline-workspace">
      <div className="reminder-settings">
        <div>
          <h2>Know what is due. Know what is verified.</h2>
          <p>
            Dates checked against official sources on 7 November 2026. Always
            confirm on the provider portal.
          </p>
        </div>
        <label>
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => update({ ...prefs, enabled: e.target.checked })}
          />{" "}
          In-app reminders
        </label>
        <label>
          Remind within
          <select
            value={prefs.lead}
            onChange={(e) => update({ ...prefs, lead: Number(e.target.value) })}
          >
            {[1, 3, 7, 14, 30].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="note">
        Reminders appear here while Grantly is open for saved or active
        applications. No email or push delivery is claimed.
      </p>
      {error && <p role="alert">{error}</p>}
      {prefs.enabled && (
        <div role="status" className="reminder-notice">
          {reminders.length
            ? `${reminders.length} saved or active opportunities are due within ${prefs.lead} days.`
            : "No saved or active applications are due within your reminder window."}
          {reminders.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)}>
              {s.name} · {deadlineLabel(s)} ↗
            </button>
          ))}
        </div>
      )}
      <div className="chips">
        {["Timeline", "Calendar"].map((v) => (
          <button
            className={view === v ? "chip selected" : "chip"}
            key={v}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </div>
      {view === "Timeline" ? (
        <div className="timeline">
          {known
            .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
            .map((s) => (
              <button
                className="deadline-row"
                key={s.id}
                onClick={() => onOpen(s.id)}
              >
                <span className="date-tile">
                  <strong>{s.deadline?.slice(8)}</strong>
                  <small>
                    {new Date(s.deadline + "T12:00:00Z").toLocaleString("en", {
                      month: "short",
                      timeZone: "UTC",
                    })}
                  </small>
                </span>
                <span>
                  <b>{s.name}</b>
                  <small>
                    {s.deadline} · {deadlineLabel(s)} · verified on{" "}
                    {s.lastVerified}
                  </small>
                </span>
              </button>
            ))}
        </div>
      ) : (
        <div className="calendar-panel">
          <div className="section-title">
            <button aria-label="Previous month" onClick={() => move(-1)}>
              ←
            </button>
            <h2>
              {new Date(year, month).toLocaleString("en", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button aria-label="Next month" onClick={() => move(1)}>
              →
            </button>
          </div>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <b key={d}>{d}</b>
            ))}
            {Array.from(
              { length: new Date(year, month, 1).getDay() },
              (_, i) => (
                <span key={"blank" + i} />
              ),
            )}
            {Array.from(
              { length: new Date(year, month + 1, 0).getDate() },
              (_, i) => {
                const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const items = known.filter((s) => s.deadline === date);
                return (
                  <div
                    key={date}
                    className={
                      items.length ? "calendar-day has-events" : "calendar-day"
                    }
                  >
                    <span>{i + 1}</span>
                    {items.map((s) => (
                      <button key={s.id} onClick={() => onOpen(s.id)}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
      <div className="config-state">
        <h3>Needs confirmation</h3>
        {opportunities
          .filter((s) => s.deadlineStatus !== "verified" || !s.deadline)
          .map((s) => (
            <div key={s.id}>
              <b>{s.name}</b>
              <p>{s.verificationNote}</p>
              <a href={s.deadlineSource} target="_blank" rel="noreferrer">
                Check official deadline source ↗
              </a>
            </div>
          ))}
      </div>
    </section>
  );
}
