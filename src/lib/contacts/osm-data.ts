// Empresas do OpenStreetMap: a ficha guarda o nome, a morada e o telefone (dados
// abertos, licença ODbL, sempre com atribuição), editáveis, e o dia em que vieram de lá.
// Do Google não se guarda nada disto: só o place_id e o que o freelancer escreve.
import type { Company } from "@/lib/radar/types";
import { MAX_MANUAL_ADDRESS, MAX_MANUAL_PHONE } from "./manual";

export const OSM_PREFIX = "osm-";

export function isOsmCompanyId(id: string) {
  return id.startsWith(OSM_PREFIX);
}

export type OsmDetails = { address: string | null; phone: string | null };

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length > max) return undefined;
  return clean || null;
}

export function parseOsmDetails(value: unknown): OsmDetails | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const address = text(raw.address, MAX_MANUAL_ADDRESS);
  const phone = text(raw.phone, MAX_MANUAL_PHONE);
  if (address === undefined || phone === undefined) return null;
  return { address, phone };
}

// O que se grava ao guardar a empresa: só a morada e o telefone, cortados ao limite.
export function osmColumns(company: Pick<Company, "address" | "phone">, today: string) {
  const address = text(company.address?.slice(0, MAX_MANUAL_ADDRESS), MAX_MANUAL_ADDRESS) ?? null;
  const phone = text(company.phone?.slice(0, MAX_MANUAL_PHONE), MAX_MANUAL_PHONE) ?? null;
  return { manual_address: address, manual_phone: phone, osm_data_on: today };
}
