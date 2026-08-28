"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    if (state?.message) {
      toast.error(state.message);
    }
  }, [state?.message]);

  return (
    <Card className="z-10 w-full max-w-md border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          {t("login_title")}
        </CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          {t("login_description")}
        </CardDescription>
      </CardHeader>
      <form action={action}>
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t("email_label")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@admin.com"
              required
              className="bg-transparent"
              aria-describedby="email-error"
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-sm text-red-500">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password_label")}</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="bg-transparent"
              aria-describedby="password-error"
            />
            {state?.errors?.password && (
              <p id="password-error" className="text-sm text-red-500">
                {state.errors.password[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            disabled={pending}
          >
            {pending ? t("signing_in") : t("sign_in_button")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
