import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { AccessRole } from "./rules";

export type Access = {
  userId: string;
  email: string;
  role: AccessRole;
  // Em nome de quem se escreve: o dono, se for Comercial; senão, a própria pessoa.
  workspaceId: string;
};

// Quem está a usar a app. A base de dados confirma o convite ativo, o email confirmado e
// igual ao do convite (sales_owner). Sem ligação ainda, tenta aceitar o convite com o
// mesmo email: serve para a conta criada pelo convite do Supabase e para a criada à mão.
// Uma vez por pedido. Sem a migração 20261129, toda a gente é dona da sua conta.
export const getAccess = cache(async (): Promise<Access> => {
  const user = await requireUser();
  const supabase = await createClient();
  const salesOwner = async () => {
    const { data, error } = await supabase.rpc("sales_owner");
    return !error && typeof data === "string" ? data : null;
  };
  let owner = await salesOwner();
  if (!owner) {
    const { data } = await supabase.rpc("accept_team_invite");
    if (data === "ok") owner = await salesOwner();
  }
  return owner
    ? { userId: user.id, email: user.email, role: "sales", workspaceId: owner }
    : { userId: user.id, email: user.email, role: "owner", workspaceId: user.id };
});

// Páginas só do dono (Projetos, Portfólio, Equipa, Planos): o Comercial vai para os Contactos.
export async function requireOwner(): Promise<Access> {
  const access = await getAccess();
  if (access.role !== "owner") redirect("/painel/contactos");
  return access;
}
