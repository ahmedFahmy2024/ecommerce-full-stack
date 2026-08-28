const RTL_LOCALES = ["ar"] as const;

export function getDirection(locale: string): "ltr" | "rtl" {
  return (RTL_LOCALES as readonly string[]).includes(locale) ? "rtl" : "ltr";
}

export function isRTL(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}
