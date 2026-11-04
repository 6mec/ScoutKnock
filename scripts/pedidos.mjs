// Pedidos de trabalho, para o comando /pedidos do Claude Code. Corre só no computador
// do Daniel, com a chave de serviço do .env.local. Nunca mostra chaves nem as escreve.
//
//   node scripts/pedidos.mjs list                      pedidos por fazer e em curso
//   node scripts/pedidos.mjs show <id>                 um pedido, com a ficha e a demo
//   node scripts/pedidos.mjs start <id>                passa a "em curso"
//   node scripts/pedidos.mjs update-demo <id> <json>   escreve os textos da demo do pedido
//   node scripts/pedidos.mjs done <id> <nota> [url]    passa a "feito", com o que foi feito
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY no .env.local.");
  process.exit(1);
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const REQUEST_COLUMNS =
  "id, user_id, contact_id, demo_id, company_name, kind, brief, status, result_note, result_url, created_at";
const DEMO_COLUMNS =
  "id, user_id, slug, company_name, niche, locality, address, phone, template, accent_color, niche_style, headline, intro, subheadline, cta_label, about, services, highlights, booking_enabled, booking_hours, expires_at";
const IDENTITY_KEYS = [
  "barbearia", "cabeleireiro", "restaurante", "cafe", "clinica", "dentista", "ginasio",
  "animais", "oficina", "imobiliaria", "escritorio", "loja", "generico",
];
const TEXT_LIMITS = { headline: 120, intro: 400, subheadline: 200, cta_label: 40, about: 800, booking_hours: 120 };

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function getRequest(id) {
  const { data, error } = await db.from("work_requests").select(REQUEST_COLUMNS).eq("id", id).maybeSingle();
  if (error) fail(`Erro a ler o pedido: ${error.message}`);
  if (!data) fail("Pedido não encontrado.");
  return data;
}

async function details(request) {
  const [contact, demo] = await Promise.all([
    request.contact_id
      ? db.from("contacts").select("*").eq("id", request.contact_id).maybeSingle()
      : { data: null },
    request.demo_id
      ? db.from("demo_sites").select(DEMO_COLUMNS).eq("id", request.demo_id).maybeSingle()
      : { data: null },
  ]);
  // Sem demo ligada, procura a demo da mesma empresa (pela ficha), se existir.
  let linkedDemo = demo.data;
  if (!linkedDemo && contact.data?.company_id) {
    const { data } = await db
      .from("demo_sites")
      .select(DEMO_COLUMNS)
      .eq("user_id", request.user_id)
      .eq("company_id", contact.data.company_id)
      .maybeSingle();
    linkedDemo = data;
  }
  return {
    ...request,
    user_id: undefined,
    contact: contact.data ? { ...contact.data, user_id: undefined } : null,
    demo: linkedDemo ? { ...linkedDemo, user_id: undefined } : null,
    site_url: env.SITE_URL ?? null,
  };
}

function cleanItems(value, max, name) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max) fail(`${name}: no máximo ${max} itens.`);
  return value.map((item, index) => {
    const title = typeof item?.title === "string" ? item.title.trim() : "";
    const description = typeof item?.description === "string" ? item.description.trim() : "";
    if (!title || title.length > 60) fail(`${name}[${index}].title: 1 a 60 caracteres.`);
    if (description.length > 160) fail(`${name}[${index}].description: até 160 caracteres.`);
    return { title, description };
  });
}

async function updateDemo(id, file) {
  const request = await getRequest(id);
  const { demo } = await details(request);
  if (!demo) fail("Este pedido não tem site demo: cria-o primeiro na app.");

  const input = JSON.parse(readFileSync(file, "utf8"));
  const update = {};
  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    if (input[field] === undefined) continue;
    if (typeof input[field] !== "string" || input[field].trim().length > max) fail(`${field}: até ${max} caracteres.`);
    update[field] = input[field].trim() || null;
  }
  if (update.headline === null || update.intro === null) fail("headline e intro não podem ficar vazios.");
  const services = cleanItems(input.services, 6, "services");
  const highlights = cleanItems(input.highlights, 3, "highlights");
  if (services) update.services = services;
  if (highlights) update.highlights = highlights;
  if (input.booking_enabled !== undefined) {
    if (typeof input.booking_enabled !== "boolean") fail("booking_enabled: true ou false.");
    update.booking_enabled = input.booking_enabled;
  }
  if (input.niche_style !== undefined) {
    if (!IDENTITY_KEYS.includes(input.niche_style)) fail(`niche_style: um de ${IDENTITY_KEYS.join(", ")}.`);
    update.niche_style = input.niche_style;
  }
  if (input.template !== undefined) {
    if (!["classic", "bold", "soft"].includes(input.template)) fail("template: classic, bold ou soft.");
    update.template = input.template;
  }
  if (Object.keys(update).length === 0) fail("Nada para mudar.");

  // A demo tem de ser de quem fez o pedido.
  const { data, error } = await db
    .from("demo_sites")
    .update(update)
    .eq("id", demo.id)
    .eq("user_id", request.user_id)
    .select("id, slug");
  if (error) fail(`Erro a guardar a demo: ${error.message}`);
  if (!data?.length) fail("A demo não é de quem fez o pedido.");
  console.log(JSON.stringify({ ok: true, demo_id: demo.id, slug: data[0].slug, fields: Object.keys(update) }, null, 2));
}

async function setStatus(id, status, extra = {}) {
  await getRequest(id);
  const { error } = await db.from("work_requests").update({ status, ...extra }).eq("id", id);
  if (error) fail(`Erro a atualizar o pedido: ${error.message}`);
  console.log(JSON.stringify({ ok: true, id, status }, null, 2));
}

const [command, id, ...args] = process.argv.slice(2);

if (command === "list") {
  const { data, error } = await db
    .from("work_requests")
    .select(REQUEST_COLUMNS)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: true });
  if (error) fail(`Erro a ler os pedidos: ${error.message}`);
  console.log(JSON.stringify(await Promise.all((data ?? []).map(details)), null, 2));
} else if (command === "show" && id) {
  console.log(JSON.stringify(await details(await getRequest(id)), null, 2));
} else if (command === "start" && id) {
  await setStatus(id, "in_progress");
} else if (command === "update-demo" && id && args[0]) {
  await updateDemo(id, args[0]);
} else if (command === "done" && id && args[0]) {
  const note = args[0].trim().slice(0, 2000);
  const url = args[1]?.trim();
  if (url && !/^https?:\/\//.test(url)) fail("O url tem de começar por http:// ou https://.");
  await setStatus(id, "done", { result_note: note, result_url: url ? url.slice(0, 300) : null });
} else {
  fail("Uso: list | show <id> | start <id> | update-demo <id> <ficheiro.json> | done <id> <nota> [url]");
}
