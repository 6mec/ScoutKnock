"use client";

import { CircleAlert, ImageUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { removeProjectImage, saveProjectWork, uploadProjectImage } from "@/lib/portfolio/actions";
import { MAX_IMAGE_BYTES, MAX_IMAGE_WIDTH, publicImageUrl } from "@/lib/portfolio/images";
import { canShowWork, LIMITS } from "@/lib/portfolio/rules";
import type { ClientProject } from "@/lib/projects/rules";

const copy = ptPT.projects.work;
type ErrorKey = keyof typeof copy.errors;

// Reduz a captura no browser: no máximo 1600 px de largura, em WebP, a baixar a qualidade
// até ficar abaixo do limite. Se o browser não fizer WebP, fica em JPEG.
async function shrink(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    for (const type of ["image/webp", "image/jpeg"]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
      if (blob && blob.type === type && blob.size <= MAX_IMAGE_BYTES - 16_384) return blob;
    }
  }
  return null;
}

export function ProjectPortfolio({ project }: { project: ClientProject }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    show: project.portfolio_show ?? false,
    summary: project.portfolio_summary ?? "",
    url: project.portfolio_url ?? "",
  });
  const [image, setImage] = useState(project.portfolio_image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, startUpload] = useTransition();
  const allowed = canShowWork(project.status);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveProjectWork(project.id, form);
      if (result.ok) {
        toast.success(copy.saved);
        if (!form.show) setImage(null);
        router.refresh();
      } else {
        setError(copy.errors[result.error as ErrorKey]);
      }
    });
  }

  function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    startUpload(async () => {
      if (!/^image\/(webp|jpeg|png)$/.test(file.type)) {
        setError(copy.errors.type);
        return;
      }
      // Se o browser não conseguir abrir a imagem, o ficheiro não é uma imagem válida.
      const blob = await shrink(file).catch(() => "invalid" as const);
      if (blob === "invalid") {
        setError(copy.errors.type);
        return;
      }
      if (!blob) {
        setError(copy.errors.size);
        return;
      }
      const data = new FormData();
      data.set("image", new File([blob], blob.type === "image/webp" ? "captura.webp" : "captura.jpg", { type: blob.type }));
      const result = await uploadProjectImage(project.id, data);
      if (result.ok) {
        setImage(result.path);
        toast.success(copy.uploaded);
        router.refresh();
      } else {
        setError(copy.errors[result.error]);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function remove() {
    setError(null);
    startUpload(async () => {
      const { ok } = await removeProjectImage(project.id);
      if (ok) {
        setImage(null);
        toast.success(copy.removed);
        router.refresh();
      } else {
        setError(copy.errors.generic);
      }
    });
  }

  return (
    <section aria-labelledby="project-portfolio" className="flex flex-col gap-3 border-t border-border pt-4" data-testid="project-portfolio">
      <h3 id="project-portfolio" className="text-15 font-semibold">
        {copy.title}
      </h3>
      <p className="text-13 text-muted">{allowed ? copy.help : copy.notYet}</p>
      {allowed && (
        <form onSubmit={save} className="flex flex-col gap-3" noValidate>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor={`work-show-${project.id}`} className="flex flex-col gap-1">
              <span className="text-14 font-medium">{copy.show}</span>
              <span className="text-13 text-muted">{copy.showHelp}</span>
            </label>
            <Switch id={`work-show-${project.id}`} checked={form.show} onCheckedChange={(show) => setForm({ ...form, show })} />
          </div>
          <Field label={copy.summary}>
            <Input
              name="portfolioSummary"
              value={form.summary}
              maxLength={LIMITS.summary}
              placeholder={copy.summaryPlaceholder}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
            />
          </Field>
          <Field label={copy.url}>
            <Input
              name="portfolioUrl"
              inputMode="url"
              value={form.url}
              maxLength={LIMITS.url}
              placeholder={copy.urlPlaceholder}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
            />
          </Field>

          {form.show && (
            <div className="flex flex-col gap-2">
              <span className="text-14 font-medium">{copy.image}</span>
              {image && (
                // Pré-visualização no painel; na página pública passa pelo otimizador do Next.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={publicImageUrl(image, supabaseUrl)}
                  alt={copy.imageAlt(project.company_name)}
                  className="aspect-video w-full max-w-sm rounded-md border border-border object-cover"
                  data-testid="work-image"
                />
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/webp,image/jpeg,image/png"
                  className="sr-only"
                  id={`work-image-${project.id}`}
                  data-testid="work-image-input"
                  onChange={(event) => choose(event.target.files?.[0])}
                />
                <Button type="button" variant="secondary" size="sm" loading={uploading} loadingText={copy.uploading} onClick={() => fileRef.current?.click()}>
                  <ImageUp aria-hidden="true" size={15} />
                  {image ? copy.imageReplace : copy.imageChoose}
                </Button>
                {image && (
                  <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={remove}>
                    <Trash2 aria-hidden="true" size={15} />
                    {copy.imageRemove}
                  </Button>
                )}
              </div>
              <p className="text-13 text-muted">{copy.imageHelp}</p>
            </div>
          )}

          <div aria-live="polite">
            {error && (
              <p data-testid="work-error" className="flex items-start gap-2 text-14 text-danger">
                <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
          <div>
            <Button type="submit" variant="secondary" loading={pending} loadingText={copy.saving}>
              {copy.save}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
