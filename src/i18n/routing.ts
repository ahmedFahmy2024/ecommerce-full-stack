import { defineRouting } from "next-intl/routing";
import { LOCALE_COOKIE } from "@/constants";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ar"],

  // Used when no locale matches
  defaultLocale: "en",

  localePrefix: "as-needed",

  // Disable automatic locale detection to force English as default
  localeDetection: false,

  // Custom cookie configuration for locale persistence
  localeCookie: {
    // Custom cookie name
    name: LOCALE_COOKIE,
    // Expire in one year
    maxAge: 60 * 60 * 24 * 365,
  },
});
