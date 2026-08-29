/**
 * Shared constants.
 *
 * The old template's entity-name registry was removed along with the old
 * education domain (T22); the e-commerce API layer derives its identifiers
 * from `src/services/api/query-keys.ts` instead. Only genuinely shared
 * constants live here.
 */

/** Cookie that persists the active locale (`en` | `ar`) for next-intl. */
export const LOCALE_COOKIE = "inox";
