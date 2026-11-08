// Funções da equipa. Hoje só existe o dono (sempre administrador); a estrutura fica pronta.
export const TEAM_ROLES = ["admin", "sales", "read_only"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export type TeamMember = {
  id: string;
  email: string;
  role: TeamRole;
  status: "invited" | "active" | "removed";
  created_at: string;
};

export function isTeamRole(value: unknown): value is TeamRole {
  return TEAM_ROLES.some((role) => role === value);
}

export function parseInviteEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
}

// Quem está a usar a app: o dono da conta ou um membro "Comercial" da equipa dele.
export type AccessRole = "owner" | "sales";

// Páginas do painel (primeiro segmento depois de /painel) que o Comercial não abre:
// projetos e pagamentos, portfólio, equipa, planos e a pré-visualização da interface.
// Os Pedidos, que são um separador de Projetos, abrem para ele em /painel/pedidos.
export const OWNER_ONLY_SEGMENTS = ["projetos", "portfolio", "equipa", "planos", "ui"] as const;

export function canOpen(role: AccessRole, segment: string | null) {
  return role === "owner" || !OWNER_ONLY_SEGMENTS.some((item) => item === segment);
}
