import { type Formats, hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [
    Common,
    Auth,
    IndexPage,
    Users,
    Classes,
    Materials,
    Categories,
    Stages,
    Batches,
    Roles,
  ] = await Promise.all([
    import(`../../messages/${locale}/Common.json`),
    import(`../../messages/${locale}/Auth.json`),
    import(`../../messages/${locale}/IndexPage.json`),
    import(`../../messages/${locale}/Users.json`),
    import(`../../messages/${locale}/Classes.json`),
    import(`../../messages/${locale}/Materials.json`),
    import(`../../messages/${locale}/Categories.json`),
    import(`../../messages/${locale}/Stages.json`),
    import(`../../messages/${locale}/Batches.json`),
    import(`../../messages/${locale}/Roles.json`),
  ]);

  const messages = {
    Common: Common.default,
    Auth: Auth.default,
    IndexPage: IndexPage.default,
    Users: Users.default,
    Classes: Classes.default,
    Materials: Materials.default,
    Categories: Categories.default,
    Stages: Stages.default,
    Batches: Batches.default,
    Roles: Roles.default,
  };

  return {
    locale,
    messages,
    timeZone: "Africa/Cairo",
  };
});

export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: "long",
      type: "conjunction",
    },
  },
} satisfies Formats;
