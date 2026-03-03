"use client";

import { useState } from "react";

import { getMessages, type Locale } from "@/lib/i18n-dictionary";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = getMessages(locale);

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
        setError(data.error ?? t.newsletter.defaultError);
        return;
      }

      setMessage(data.message ?? t.newsletter.defaultSuccess);
      setEmail("");
    } catch {
      setError(t.newsletter.defaultError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="newsletter-inline" aria-labelledby="newsletter-heading">
      <h2 id="newsletter-heading">{t.newsletter.title}</h2>
      <p>{t.newsletter.subtitle}</p>

      <form onSubmit={submit}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.newsletter.inputPlaceholder}
          aria-label={t.newsletter.inputAria}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? t.newsletter.submitting : t.newsletter.join}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
