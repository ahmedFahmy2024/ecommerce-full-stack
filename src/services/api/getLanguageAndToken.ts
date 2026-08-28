import { getCookie } from "cookies-next/client";
import type { Session } from "next-auth";
import { LOCALE_COOKIE } from "../../constants/index.ts";
import { isServer } from "./environment.ts";

type ClientUser = { accessToken?: string } & Session["user"];

type SupportedLang = "en" | "ar";

function normalizeLang(value: unknown): SupportedLang {
  return value === "ar" ? "ar" : "en";
}

/**
 * Resolves the active locale and access token in a server-safe / client-safe way.
 *
 * - Server: `next-intl/server` `getLocale()` + `next-auth` `auth()`.
 * - Client: `cookies-next` locale cookie + `next-auth/react` `getSession()`.
 *
 * Always returns `x-lang` compatible `en` | `ar` (fallback `en`) and an optional
 * bearer token. Callers must send `x-lang` (not `lang`) and add
 * `Authorization: Bearer <token>` only when `token` is present.
 */
export const getLanguageAndToken = async (): Promise<{
  lang: SupportedLang;
  token?: string;
}> => {
  if (isServer()) {
    const { getLocale } = await import("next-intl/server");
    const { auth } = await import("@/auth");

    const session = await auth();
    const locale = await getLocale();
    const rawToken = (session?.user as ClientUser | undefined)?.accessToken;

    return {
      lang: normalizeLang(locale),
      token:
        typeof rawToken === "string" && rawToken.trim().length > 0
          ? rawToken
          : undefined,
    };
  }

  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  const user = session?.user as ClientUser | undefined;
  const rawToken = user?.accessToken;
  const rawLang = getCookie(LOCALE_COOKIE) as string | undefined;

  return {
    lang: normalizeLang(rawLang),
    token:
      typeof rawToken === "string" && rawToken.trim().length > 0
        ? rawToken
        : undefined,
  };
};
