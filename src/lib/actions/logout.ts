"use server";

import { signOut } from "@/auth";
import { getLocale } from "next-intl/server";

export async function logoutAction() {
  const locale = await getLocale();
  const redirectTo = locale === "en" ? "/login" : `/${locale}/login`;
  await signOut({ redirectTo });
}
