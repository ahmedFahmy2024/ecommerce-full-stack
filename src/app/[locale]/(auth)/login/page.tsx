import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

/**
 * Server Component — renders the static chrome only.
 *
 * Per `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md:18`
 * pages are Server Components by default. This file has no `"use client"` so the
 * Card shell streams without JS. Interactivity is isolated to the leaf
 * `LoginForm` (`"use client"` + `useActionState` from `react@19.2.8`
 * `packages/react/src/ReactHooks.js:234`), which is required because
 * `services/api/auth.ts:221` `login()` must run in the browser with
 * `credentials: "include"` — a Server Action would fetch from the Next server
 * (3000→3001) and the Nest `Set-Cookie: refresh_token` (HttpOnly,
 * Path=/v1/auth/refresh, SameSite=Strict) would never reach the browser.
 * See `AGENTS.md:52` (Client only where browser API needed) and `AGENTS.md:58`
 * (browser-direct auth, token in `session.client.ts`).
 */
export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="z-10 w-full max-w-md border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </div>
  );
}
