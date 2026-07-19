import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  type Locale,
  LOCALE_COOKIE_NAME,
  getMessages,
  normalizeLocale,
} from "@/lib/i18n-dictionary";

export async function getCurrentLocale(fallbackLocale: Locale = DEFAULT_LOCALE): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(value ?? fallbackLocale);
}

export async function getCurrentMessages(fallbackLocale: Locale = DEFAULT_LOCALE) {
  const locale = await getCurrentLocale(fallbackLocale);
  return {
    locale,
    messages: getMessages(locale),
  };
}

export { LOCALE_COOKIE_NAME };
