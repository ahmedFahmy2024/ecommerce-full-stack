"use server";

import { signIn } from "@/auth";
import { LoginFormSchema, type FormState } from "@/lib/definitions";
import { AuthError } from "next-auth";
import { getLocale } from "next-intl/server";

export async function login(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  // Use callbackUrl from Proxy redirect, fall back to locale-aware home
  const callbackUrl = formData.get("callbackUrl") as string | null;
  const locale = await getLocale();
  const redirectTo = callbackUrl || (locale === "en" ? "/" : `/${locale}`);

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? { message: "Invalid credentials." }
        : { message: "Something went wrong." };
    }
    throw error; // Re-throw NEXT_REDIRECT — Next.js handles it
  }
}
