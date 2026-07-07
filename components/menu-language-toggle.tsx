"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Locale } from "@/lib/i18n-dictionary";

interface MenuLanguageToggleProps {
  locale: Locale;
}

export function MenuLanguageToggle({ locale }: MenuLanguageToggleProps) {
  const router = useRouter();
  const [pending, setPending] = useState<Locale | null>(null);

  async function setLocale(nextLocale: Locale) {
    if (nextLocale === locale || pending) {
      return;
    }

    setPending(nextLocale);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
    } finally {
      setPending(null);
      router.refresh();
    }
  }

  return (
    <div className="menu-language-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={locale === "vi" ? "active" : ""}
        disabled={pending !== null}
        onClick={() => void setLocale("vi")}
      >
        VI
      </button>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        disabled={pending !== null}
        onClick={() => void setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
