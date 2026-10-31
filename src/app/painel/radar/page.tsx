import type { Metadata } from "next";
import { RadarScreen } from "@/components/radar/radar-screen";
import { ptPT } from "@/i18n/pt-PT";
import { getCompanyProvider } from "@/lib/radar/provider";

const { radar: copy } = ptPT;

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false },
};

export default function RadarPage() {
  const provider = getCompanyProvider();

  if (!provider) {
    return (
      <p className="type-body mx-auto w-full max-w-3xl px-4 py-12 lg:px-8">
        {copy.unavailable}
      </p>
    );
  }

  return <RadarScreen isSample={provider.usesSampleData} />;
}
