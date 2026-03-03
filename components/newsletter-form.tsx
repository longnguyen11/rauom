"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Subscription failed.");
        return;
      }

      setMessage(data.message ?? "Check your inbox to confirm subscription.");
      setEmail("");
    } catch {
      setError("Subscription failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="newsletter-inline" aria-labelledby="newsletter-heading">
      <h2 id="newsletter-heading">Get weekly featured dishes</h2>
      <p>Double opt-in enabled. One-click unsubscribe in every email.</p>

      <form onSubmit={submit}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Join newsletter"}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
