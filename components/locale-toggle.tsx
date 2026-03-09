"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getMessages, type Locale } from "@/lib/i18n-dictionary";

interface LocaleToggleProps {
  locale: Locale;
}

export function LocaleToggle({ locale }: LocaleToggleProps) {
  const router = useRouter();
  const [pending, setPending] = useState<Locale | null>(null);
  const t = getMessages(locale);
  const nextLocale: Locale = locale === "vi" ? "en" : "vi";
  const buttonLabel =
    nextLocale === "en" ? t.localeToggle.english : t.localeToggle.vietnamese;

  async function setLocale(nextLocale: Locale) {
    if (nextLocale === locale || pending) {
      return;
    }

    setPending(nextLocale);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: nextLocale }),
      });
    } finally {
      setPending(null);
      router.refresh();
    }
  }

  return (
    <div className="locale-toggle" role="group" aria-label={t.localeToggle.ariaLabel}>
      <button
        type="button"
        className="locale-button active"
        onClick={() => void setLocale(nextLocale)}
        disabled={pending !== null}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
