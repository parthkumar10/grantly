import { useState } from "react";
import { opportunities } from "../../lib/scholarships";
import { useAccount } from "../AccountContext";
export function Assistant() {
  const { session } = useAccount();
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<
    {
      question: string;
      answer: string;
      sources: { name: string; url: string }[];
    }[]
  >([]);
  const [error, setError] = useState("");
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session
            ? { Authorization: "Bearer " + session.access_token }
            : {}),
        },
        body: JSON.stringify({
          question,
          scholarshipId: selected ? Number(selected) : null,
        }),
        signal: AbortSignal.timeout(35000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assistant unavailable");
      setMessages((v) => [
        ...v,
        { question, answer: data.answer, sources: data.sources },
      ]);
      setQuestion("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect to the assistant.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="assistant-panel profile-form">
      <span className="eyebrow">GROUNDED IN OFFICIAL SOURCES</span>
      <h2>Make the next step clearer.</h2>
      <p className="note">
        Gemini identifies the relevant scholarship and topic. Grantly returns
        facts from its curated official-source records, not free-form policy
        claims. Your question goes to Google when configured; do not include
        IDs, bank details or sensitive documents.
      </p>
      <div className="suggestions">
        {[
          "What documents do I need?",
          "How do I apply?",
          "Which deadlines are confirmed?",
        ].map((q) => (
          <button key={q} className="chip" onClick={() => setQuestion(q)}>
            {q}
          </button>
        ))}
      </div>
      <div className="conversation" aria-live="polite">
        {messages.map((m, i) => (
          <article key={i}>
            <p className="question">{m.question}</p>
            <div className="answer">{m.answer}</div>
            <div className="source-links">
              {m.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {s.name} ↗
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
      <form onSubmit={ask}>
        <label>
          Scholarship context
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">All sourced scholarships</option>
            {opportunities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Your question
          <textarea
            required
            maxLength={1500}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about requirements, documents or next steps…"
          />
        </label>
        <button className="primary" disabled={busy || !question.trim()}>
          {busy ? "Checking the source records…" : "Ask assistant"}
        </button>
      </form>
      {error && (
        <div className="config-state" role="alert">
          {error}
          <p>
            You can still read eligibility, documents and official links in each
            scholarship’s details.
          </p>
        </div>
      )}
    </section>
  );
}
