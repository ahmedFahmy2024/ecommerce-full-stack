"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/api/auth";

export const dynamic = "force-dynamic";
import { ApiClientError } from "@/services/api/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Browser-direct login page (remediation T15).
 *
 * Previous implementation used `next-auth` `signIn("credentials")` which
 * performed a server-side `fetch` to `POST /auth/login`. That server fetch
 * cannot deliver Nest's `Set-Cookie: refresh_token` to the browser because
 * the cookie is set on the Nest API origin (`http://localhost:3001`) with
 * `SameSite=Strict` and `Path=/v1/auth/refresh`.
 *
 * Remediation: call Nest directly from the browser with `credentials: "include"`
 * via `services/api/auth.ts` `login()`. The browser then stores the HttpOnly
 * `refresh_token` cookie for the Nest origin and sends it on `POST /auth/refresh`.
 * The short-lived access token is kept only in `services/api/session.client.ts`
 * (browser memory, never localStorage).
 */
export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      // On success the browser now holds `refresh_token` (HttpOnly, Nest origin)
      // and `session.client.ts` holds the access token for `Authorization: Bearer`.
      router.push(callbackUrl);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Do not expose raw backend error payload — use normalized message
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="z-10 w-full max-w-md border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
