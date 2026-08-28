import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "next-intl";
import { FormExamples } from "@/components/form/examples/FormExamples";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* <FormExamples /> */}
    </div>
  );
}
