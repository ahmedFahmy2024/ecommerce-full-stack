import { type Formats, hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [Common, Auth, IndexPage, Users, Categories, Roles] = await Promise.all(
    [
      import(`../../messages/${locale}/Common.json`),
      import(`../../messages/${locale}/Auth.json`),
      import(`../../messages/${locale}/IndexPage.json`),
      import(`../../messages/${locale}/Users.json`),
      import(`../../messages/${locale}/Categories.json`),
      import(`../../messages/${locale}/Roles.json`),
    ],
  );

  const messages = {
    Common: Common.default,
    Auth: Auth.default,
    IndexPage: IndexPage.default,
    Users: Users.default,
    Categories: Categories.default,
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
