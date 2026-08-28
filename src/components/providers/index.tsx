"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { DirectionProvider } from "@/components/ui/direction";
import { getDirection } from "@/lib/direction";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { NextIntlClientProvider, type Locale } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { QueryProvider } from "./query-provider";

interface AppProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
}

export function AppProviders({
  children,
  locale,
  messages,
}: AppProvidersProps) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DirectionProvider dir={getDirection(locale)}>
            <TooltipProvider>{children}</TooltipProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </NuqsAdapter>
    </QueryProvider>
  );
}
