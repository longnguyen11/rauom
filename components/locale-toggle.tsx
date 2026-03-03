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
        className={locale === "en" ? "locale-button active" : "locale-button"}
        onClick={() => void setLocale("en")}
        disabled={pending !== null}
      >
        {t.localeToggle.english}
      </button>
      <button
        type="button"
        className={locale === "vi" ? "locale-button active" : "locale-button"}
        onClick={() => void setLocale("vi")}
        disabled={pending !== null}
      >
        {t.localeToggle.vietnamese}
      </button>
    </div>
  );
}
