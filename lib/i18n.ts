import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  type Locale,
  LOCALE_COOKIE_NAME,
  getMessages,
  normalizeLocale,
} from "@/lib/i18n-dictionary";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(value ?? DEFAULT_LOCALE);
}

export async function getCurrentMessages() {
  const locale = await getCurrentLocale();
  return {
    locale,
    messages: getMessages(locale),
  };
}

export { LOCALE_COOKIE_NAME };
