import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ptPT } from "@/i18n/pt-PT";
import { isUiPreviewEnabled } from "@/lib/ui-preview";
import { UiPreview } from "./ui-preview";

export const metadata: Metadata = {
  title: ptPT.uiPreview.title,
  robots: { index: false },
};

export default function UiPreviewPage() {
  if (!isUiPreviewEnabled()) notFound();

  return <UiPreview />;
}
