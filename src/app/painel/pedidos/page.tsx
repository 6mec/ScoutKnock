import { redirect } from "next/navigation";

// Os Pedidos passaram a separador dos Projetos (T16). Fica o endereço antigo a reencaminhar.
export default function RequestsPage() {
  redirect("/painel/projetos?separador=pedidos");
}
