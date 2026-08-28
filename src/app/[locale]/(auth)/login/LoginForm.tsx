"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/services/api/contracts";
import { login } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";

/**
 * Client leaf for login — browser-direct only.
 *
 * Why "use client" is required here (and only here):
 * - `login()` in `services/api/auth.ts:221` asserts `typeof window !== "undefined"`
 *   and uses `credentials: "include"` so Nest's `Set-Cookie: refresh_token`
 *   (HttpOnly, Path=/v1/auth/refresh, SameSite=Strict, origin http://localhost:3001)
 *   lands on the browser. A Server Action (`"use server"` in
 *   `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md:23`)
 *   would fetch from the Next server (3000→3001) — the Set-Cookie never reaches
 *   the browser.
 * - Per `AGENTS.md:52` favor Server Components by default, Client only where
 *   browser APIs matter, and per `AGENTS.md:58` keep tokens in `session.client.ts`
 *   (never server global/localStorage/NextAuth). So the page stays Server, this
 *   leaf is the only Client boundary.
 *
 * Why `useActionState` (React 19):
 * - Source-verified: `react@19.2.8` `packages/react/src/ReactHooks.js:234`
 *   `useActionState<S,P>(action, initialState) => [state, dispatch, isPending]`.
 *   It gives pending/error without manual `useState` + avoids duplicate submit.
 *   The action itself is still a *client* action (not a Server Action) — it calls
 *   `login()` directly in the browser, which is the approved boundary
 *   (`services/api/auth.ts` → `transportFetch` with `credentials: "include"`).
 */
export function LoginForm() {
  const router = useRouter();

  const [error, formAction, isPending] = useActionState(
    async (_prevState: string | null, formData: FormData) => {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      try {
        await login({ email, password });
        router.push("/");
        return null;
      } catch (err) {
        if (err instanceof ApiClientError) {
          return err.message;
        }
        return "Something went wrong. Please try again.";
      }
    },
    null as string | null,
  );

  return (
    <form action={formAction} noValidate>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@admin.com"
            required
            autoComplete="email"
            autoFocus
            className="bg-transparent"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="bg-transparent"
          />
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </CardFooter>
    </form>
  );
}
