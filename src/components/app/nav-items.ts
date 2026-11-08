import {
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  Globe,
  House,
  Radar,
  Settings,
  UserRoundCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ptPT } from "@/i18n/pt-PT";
import { canOpen, type AccessRole } from "@/lib/team/rules";

const copy = ptPT.app.nav;

export type NavItem = {
  href: string;
  // Primeiro segmento depois de /painel (null no Dashboard).
  segment: string | null;
  label: string;
  icon: LucideIcon;
  // Na barra de baixo do telemóvel; os outros vão para "Mais".
  mobileBar?: boolean;
};

export type NavGroup = { id: string; label: string | null; items: NavItem[] };

// O menu, pelo ciclo do trabalho. Uma só fonte para a barra lateral, o "Mais" e o caminho
// (breadcrumbs). Os Pedidos são um separador de Projetos; as Definições são a página Conta.
export const NAV_GROUPS: NavGroup[] = [
  { id: "inicio", label: null, items: [{ href: "/painel", segment: null, label: copy.home, icon: House, mobileBar: true }] },
  {
    id: "prospecao",
    label: copy.groups.prospecting,
    items: [
      { href: "/painel/radar", segment: "radar", label: copy.radar, icon: Radar, mobileBar: true },
      { href: "/painel/contactos", segment: "contactos", label: copy.contacts, icon: Users, mobileBar: true },
    ],
  },
  {
    id: "clientes",
    label: copy.groups.clients,
    items: [{ href: "/painel/projetos", segment: "projetos", label: copy.projects, icon: FolderKanban, mobileBar: true }],
  },
  {
    id: "presenca",
    label: copy.groups.presence,
    items: [
      { href: "/painel/portfolio", segment: "portfolio", label: copy.portfolio, icon: BriefcaseBusiness },
      { href: "/painel/demos", segment: "demos", label: copy.demos, icon: Globe },
    ],
  },
  {
    id: "gestao",
    label: copy.groups.management,
    items: [
      { href: "/painel/equipa", segment: "equipa", label: copy.team, icon: UserRoundCog },
      { href: "/painel/conta", segment: "conta", label: copy.settings, icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

// O menu do Comercial: sem as páginas só do dono; os Pedidos (separador de Projetos) ficam
// no lugar dos Projetos. Grupos sem páginas desaparecem.
const SALES_REQUESTS: NavItem = { href: "/painel/pedidos", segment: "pedidos", label: copy.requests, icon: ClipboardList, mobileBar: true };

export function navGroupsFor(role: AccessRole): NavGroup[] {
  if (role === "owner") return NAV_GROUPS;
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.id === "clientes" ? [SALES_REQUESTS] : group.items.filter((item) => canOpen(role, item.segment)),
  })).filter((group) => group.items.length > 0);
}

// Páginas fora do menu que pertencem a um grupo (para o caminho no topo).
const EXTRA: Record<string, { group: string; label: string; parent?: NavItem }> = {
  pedidos: { group: "clientes", label: copy.requests },
  planos: { group: "gestao", label: ptPT.plans.title },
  ui: { group: "gestao", label: ptPT.uiPreview.title },
};

// Subpáginas conhecidas, pelo último segmento.
const SUBPAGES: Record<string, string> = {
  proposta: copy.crumbs.proposal,
  sessao: ptPT.contacts.session.title,
};

export type Crumb = { label: string; href?: string };

// O caminho da página: grupo › página › subpágina. O último é a página atual (sem link).
export function crumbsFor(segments: string[]): Crumb[] {
  const [first, ...rest] = segments;
  if (!first) return [{ label: copy.home }];
  const item = NAV_ITEMS.find((entry) => entry.segment === first);
  const extra = EXTRA[first];
  const group = NAV_GROUPS.find((entry) => (item ? entry.items.includes(item) : entry.id === extra?.group));
  const crumbs: Crumb[] = [];
  if (group?.label) crumbs.push({ label: group.label });
  const label = item?.label ?? extra?.label ?? first;
  const href = item?.href ?? `/painel/${first}`;
  const sub = rest.length > 0 ? (SUBPAGES[rest[rest.length - 1]] ?? (first === "demos" ? copy.crumbs.demo : null)) : null;
  crumbs.push(sub ? { label, href } : { label });
  if (sub) crumbs.push({ label: sub });
  return crumbs;
}
