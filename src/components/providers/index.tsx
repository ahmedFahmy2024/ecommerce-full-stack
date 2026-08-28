"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { DirectionProvider } from "@/components/ui/direction";
import { getDirection } from "@/lib/direction";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { NextIntlClientProvider, type Locale } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { QueryProvider } from "./query-provider";
import { SessionProvider } from "./session-provider";
import type { Session } from "next-auth";

interface AppProvidersProps {
  children: React.ReactNode;
  session: Session | null;
  locale: Locale;
  messages: AbstractIntlMessages;
}

export function AppProviders({
  children,
  session,
  locale,
  messages,
}: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <NuqsAdapter>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <DirectionProvider dir={getDirection(locale)}>
              <TooltipProvider>{children}</TooltipProvider>
            </DirectionProvider>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </QueryProvider>
    </SessionProvider>
  );
}
