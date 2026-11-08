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
