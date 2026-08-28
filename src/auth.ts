import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginFormSchema } from "@/lib/definitions";
import { buildApiUrl, getDashboardApiKey } from "@/services/api/config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    accessToken?: string;
    role?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsedCredentials = LoginFormSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        try {
          // Single session owner: NextAuth Credentials stores short-lived Nest access token.
          // Direct fetch to POST /auth/login with dashboard platform key, x-lang, credentials include.
          const url = buildApiUrl("/auth/login");
          let lang = "en";
          try {
            const { getLocale } = await import("next-intl/server");
            const locale = await getLocale();
            lang = locale === "ar" ? "ar" : "en";
          } catch {
            lang = "en";
          }

          const res = await fetch(url, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Access-Api": getDashboardApiKey(),
              "x-lang": lang,
            },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) return null;

          const text = await res.text();
          const json = text ? (JSON.parse(text) as unknown) : null;
          // Nest success envelope: { success:true, data:{ accessToken, tokenType, expiresIn, user }, meta }
          const envelope = json as {
            success?: boolean;
            data?: {
              accessToken?: string;
              tokenType?: string;
              expiresIn?: number;
              user?: {
                id: string;
                email: string;
                firstName?: string;
                lastName?: string;
                fullName?: string;
                avatarMediaId?: string | null;
                isActive?: boolean;
              };
              refreshToken?: string;
            };
          } | null;

          const data = envelope?.success ? envelope.data : null;
          const accessToken = data?.accessToken;
          const user = data?.user;

          if (
            typeof accessToken === "string" &&
            accessToken.trim() &&
            user?.id
          ) {
            // Do not log tokens. Store only in JWT (encrypted httpOnly NextAuth cookie).
            // Keep shape minimal: id, email, accessToken, role (role not yet from /auth/me).
            const displayName =
              (user as unknown as { fullName?: string; firstName?: string })
                .fullName ??
              [user.firstName, user.lastName].filter(Boolean).join(" ") ??
              user.email;

            return {
              id: String(user.id),
              name: displayName,
              email: user.email,
              image: undefined as unknown as string,
              accessToken: accessToken.trim(),
              role: undefined,
            };
          }
          return null;
        } catch {
          // Never log credentials or tokens
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      // Allow client-side `update({ accessToken })` after refresh to patch JWT without re-login
      if (
        trigger === "update" &&
        session &&
        typeof (session as Record<string, unknown>).accessToken === "string"
      ) {
        const next = (session as Record<string, unknown>).accessToken as string;
        if (next.trim()) token.accessToken = next.trim();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accessToken = token.accessToken as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
