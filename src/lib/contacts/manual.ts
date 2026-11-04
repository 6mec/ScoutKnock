import type { Company } from "@/lib/radar/types";
import { MAX_LABEL, type Contact } from "./rules";

// Empresas adicionadas à mão: os dados são os que o freelancer escreveu, por isso não
// há chamada ao Google. O id começa sempre por este prefixo e nunca é um place_id.
export const MANUAL_PREFIX = "manual-";
export const MAX_MANUAL_NICHE = 80;
export const MAX_MANUAL_LOCALITY = 80;
export const MAX_MANUAL_ADDRESS = 200;
export const MAX_MANUAL_PHONE = 40;
export const MAX_MANUAL_WEBSITE = 300;
export const MAX_MANUAL_REVIEWS = 1_000_000;
export const MAX_IMPORT_ROWS = 200;

export type ManualCompany = {
  name: string;
  niche: string | null;
  locality: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  reviews: number | null;
  hours: boolean | null;
};

export type ManualColumns = Pick<
  Contact,
  | "manual_niche"
  | "manual_locality"
  | "manual_address"
  | "manual_phone"
  | "manual_website"
  | "manual_reviews"
  | "manual_hours"
>;

export function isManualCompanyId(id: string) {
  return id.startsWith(MANUAL_PREFIX);
}

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length > max) return undefined;
  return clean || null;
}

// Aceita "exemplo.pt" e acrescenta https://. Recusa tudo o que não seja http(s).
export function normalizeWebsite(value: string) {
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (!url.hostname.includes(".")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function reviewsValue(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const number =
    typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  if (!Number.isInteger(number) || number < 0 || number > MAX_MANUAL_REVIEWS) {
    return undefined;
  }
  return number;
}

export function parseManualCompany(value: unknown): ManualCompany | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;

  const name = text(raw.name, MAX_LABEL);
  const niche = text(raw.niche, MAX_MANUAL_NICHE);
  const locality = text(raw.locality, MAX_MANUAL_LOCALITY);
  const address = text(raw.address, MAX_MANUAL_ADDRESS);
  const phone = text(raw.phone, MAX_MANUAL_PHONE);
  const websiteText = text(raw.website, MAX_MANUAL_WEBSITE);
  const reviews = reviewsValue(raw.reviews);
  const hours =
    raw.hours === undefined || raw.hours === null
      ? null
      : typeof raw.hours === "boolean"
        ? raw.hours
        : undefined;

  if (!name) return null;
  if (
    [niche, locality, address, phone, websiteText, reviews, hours].includes(
      undefined,
    )
  ) {
    return null;
  }

  const website = websiteText ? normalizeWebsite(websiteText) : null;
  if (website === undefined || (website && website.length > MAX_MANUAL_WEBSITE)) {
    return null;
  }

  return {
    name,
    niche: niche ?? null,
    locality: locality ?? null,
    address: address ?? null,
    phone: phone ?? null,
    website,
    reviews: reviews ?? null,
    hours: hours ?? null,
  };
}

export function manualColumns(company: ManualCompany): ManualColumns {
  return {
    manual_niche: company.niche,
    manual_locality: company.locality,
    manual_address: company.address,
    manual_phone: company.phone,
    manual_website: company.website,
    manual_reviews: company.reviews,
    manual_hours: company.hours,
  };
}

export function manualCompanyOf(
  contact: Pick<Contact, "label"> & ManualColumns,
): ManualCompany {
  return {
    name: contact.label,
    niche: contact.manual_niche,
    locality: contact.manual_locality,
    address: contact.manual_address,
    phone: contact.manual_phone,
    website: contact.manual_website,
    reviews: contact.manual_reviews,
    hours: contact.manual_hours,
  };
}

// Para a nota e a mensagem. O que o freelancer não escreveu nunca vira um motivo:
// sem número de avaliações não há "poucas avaliações", e sem resposta sobre o
// horário não há "sem horário".
export function companyFromManual(id: string, company: ManualCompany): Company {
  return {
    id,
    name: company.name,
    niche: company.niche ?? "",
    locality: company.locality ?? "",
    address: company.address ?? "",
    phone: company.phone,
    website: company.website,
    reviewCount: company.reviews ?? null,
    hasOpeningHours: company.hours ?? true,
    site: { isSlow: null, isMobileFriendly: null, isOutdated: null },
  };
}

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function phoneDigits(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  // 912 345 678 e +351 912 345 678 são o mesmo número.
  return digits.length > 9 && digits.startsWith("351") ? digits.slice(3) : digits;
}

const HEADERS: Record<keyof Omit<ManualCompany, "hours">, RegExp> = {
  name: /^(nome|name|empresa|negocio)$/,
  phone: /^(telefone|telemovel|phone|whatsapp|contacto|numero)$/,
  niche: /^(nicho|categoria|tipo|setor)$/,
  locality: /^(localidade|cidade|concelho|local)$/,
  website: /^(site|website|url|pagina)$/,
  address: /^(morada|endereco|address)$/,
  reviews: /^(avaliacoes|reviews|opinioes)$/,
};
const DEFAULT_ORDER = ["name", "phone", "niche", "locality", "website"] as const;

function splitLine(line: string) {
  const separator = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

export type ParsedList = {
  companies: ManualCompany[];
  invalid: number;
  duplicates: number;
  tooMany: boolean;
};

// Uma empresa por linha. Com cabeçalho, as colunas lêem-se pelo nome; sem ele, a
// ordem é nome, telefone, nicho, localidade e site. Repetidas, pelo telefone ou
// pelo nome, contam-se mas não entram.
export function parseCompanyList(
  input: string,
  existing: { label: string; phone: string | null }[] = [],
): ParsedList {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { companies: [], invalid: 0, duplicates: 0, tooMany: false };
  }

  const first = splitLine(lines[0]).map(normalizeName);
  const headerColumns = first.map(
    (cell) =>
      (Object.keys(HEADERS) as (keyof typeof HEADERS)[]).find((key) =>
        HEADERS[key].test(cell),
      ) ?? null,
  );
  const hasHeader = headerColumns.includes("name");
  const columns = hasHeader ? headerColumns : [...DEFAULT_ORDER];
  const rows = hasHeader ? lines.slice(1) : lines;

  const seenNames = new Set(existing.map((item) => normalizeName(item.label)));
  const seenPhones = new Set(
    existing.map((item) => phoneDigits(item.phone)).filter(Boolean),
  );
  const companies: ManualCompany[] = [];
  let invalid = 0;
  let duplicates = 0;

  for (const row of rows.slice(0, MAX_IMPORT_ROWS)) {
    const cells = splitLine(row);
    const raw: Record<string, string> = {};
    columns.forEach((column, index) => {
      if (column && cells[index]) raw[column] = cells[index];
    });

    const company = parseManualCompany(raw);
    if (!company) {
      invalid++;
      continue;
    }

    const name = normalizeName(company.name);
    const phone = phoneDigits(company.phone);
    if (seenNames.has(name) || (phone && seenPhones.has(phone))) {
      duplicates++;
      continue;
    }
    seenNames.add(name);
    if (phone) seenPhones.add(phone);
    companies.push(company);
  }

  return {
    companies,
    invalid,
    duplicates,
    tooMany: rows.length > MAX_IMPORT_ROWS,
  };
}

// Link oficial do Google Maps para procurar à mão: abre o Maps, não lê nada dele.
export function googleMapsSearchUrl(niche: string, locality: string) {
  const query = [niche.trim(), locality.trim()].filter(Boolean).join(" em ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
