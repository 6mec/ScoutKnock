// Capturas dos trabalhos no armazenamento do Supabase (espaço "portfolio", leitura pública).
// O browser reduz a imagem antes de enviar; o servidor volta a confirmar tipo e tamanho.

export const PORTFOLIO_BUCKET = "portfolio";
// Igual ao limite do espaço no Supabase (1 MiB).
export const MAX_IMAGE_BYTES = 1_048_576;
export const MAX_IMAGE_WIDTH = 1600;
export const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

// O tipo verdadeiro pelos primeiros bytes (não confia no nome nem no que o browser diz).
export function sniffImage(bytes: Uint8Array): ImageType | null {
  const at = (offset: number, values: number[]) => values.every((value, index) => bytes[offset + index] === value);
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

const EXTENSIONS: Record<ImageType, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

// Caminho novo a cada envio, para o browser e a cache não mostrarem a imagem antiga.
export function imagePath(userId: string, projectId: string, type: ImageType, stamp = Date.now()) {
  return `${userId}/${projectId}-${stamp.toString(36)}.${EXTENSIONS[type]}`;
}

export function publicImageUrl(path: string, supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
