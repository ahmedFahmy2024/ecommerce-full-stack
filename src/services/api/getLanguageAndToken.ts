import { getCookie } from "cookies-next/client";
import type { Session } from "next-auth";
import { LOCALE_COOKIE } from "@/constants";
import { isServer } from "./environment";

type ClientUser = { accessToken?: string } & Session["user"];

export const getLanguageAndToken = async () => {
  if (isServer()) {
    const { getLocale } = await import("next-intl/server");
    const { auth } = await import("@/auth");

    const session = await auth();

    return {
      lang: await getLocale(),
      token: session?.user?.accessToken || "",
    };
  } else {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const user = session?.user as ClientUser | undefined;

    return {
      lang: (getCookie(LOCALE_COOKIE) as string) || "en",
      token: user?.accessToken ?? "",
    };
  }
};
