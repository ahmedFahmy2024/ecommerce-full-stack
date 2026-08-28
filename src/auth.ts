import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginFormSchema } from "@/lib/definitions";
import apiClient from "@/services/api";
import { SYSTEM_USERS_LOGIN } from "@/services/api/queries";

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
          // Call the existing NestJS login endpoint via apiClient
          const response = await apiClient<{
            accessToken: string;
            user: {
              id: string;
              name: string;
              email: string;
              image: string;
              role: string;
            };
          }>(SYSTEM_USERS_LOGIN, {
            body: { email, password },
          });

          // based on ApiResponse<T> where payload is in response.data
          if (response?.data) {
            const { accessToken, user } = response.data;

            if (accessToken && user) {
              return {
                id: String(user.id),
                name: user.name,
                email: user.email,
                image: user.image,
                accessToken: accessToken,
                role: user.role,
              };
            }
          }
          return null;
        } catch (error) {
          console.error("Auth.js authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
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
