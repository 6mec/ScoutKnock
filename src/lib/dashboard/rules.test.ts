import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/account/rules";
import { ptPT } from "@/i18n/pt-PT";
import {
  daysUntil,
  nextStep,
  parseStatusFilter,
  repeatQuery,
  totalLeads,
  usageMeters,
  type DashboardData,
} from "./rules";

const NOW = new Date("2026-11-10T12:00:00Z").getTime();
const inDays = (days: number) => new Date(NOW + days * 86_400_000).toISOString();

function data(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    subscription: {
      status: null,
      plan: null,
      trial_end: null,
      trial_used: false,
      cancel_at_period_end: false,
      has_customer: false,
    },
    usage: {
      period_end: inDays(20),
      searches_used: 0,
      searches_limit: 10,
      demos_used: 0,
      demos_limit: 2,
      lookups_used: 0,
      lookups_limit: 90,
      lookups_today: 0,
      lookups_daily_limit: 3,
    },
    leads: {},
    searches: [],
    demos: { active: 0, items: [] },
    ...overrides,
  };
}

const search = {
  service: "website_creation",
  niche: "Barbearias",
  locality: "Porto",
  count: 4,
  created_at: inDays(-1),
};
const full = { ...data().usage, searches_used: 10 };
const active = (plan: string) => ({
  ...data().subscription,
  status: "active",
  plan,
  has_customer: true,
});

describe("próximo passo no modo pessoal", () => {
  const demoSoon = { active: 1, items: [{ id: "d1", company_name: "Café", expires_at: inDays(1) }] };

  it("um projeto atrasado passa à frente de tudo", () => {
    const step = nextStep(data({ usage: full, leads: { to_contact: 2 } }), NOW, {
      selling: false,
      lateProjects: [{ company_name: "Barbearia do Zé" }, { company_name: "Café" }],
    });
    expect(step).toEqual({ kind: "lateProject", name: "Barbearia do Zé", count: 2 });
  });

  it("sem packs nem demos a avisar", () => {
    const personal = { selling: false };
    expect(nextStep(data({ usage: full, searches: [search] }), NOW, personal).kind).toBe("saveCompany");
    expect(
      nextStep(data({ searches: [search], demos: demoSoon as DashboardData["demos"], leads: { won: 1 } }), NOW, personal).kind,
    ).toBe("newSearch");
    expect(nextStep(data({ searches: [search], leads: { to_contact: 3 } }), NOW, personal)).toEqual({
      kind: "toContact",
      count: 3,
    });
  });
});

describe("próximo passo", () => {
  it("conta nova: primeira busca", () => {
    expect(nextStep(data(), NOW).kind).toBe("firstSearch");
  });

  it("com buscas e sem contactos: guardar uma empresa", () => {
    expect(nextStep(data({ searches: [search] }), NOW).kind).toBe("saveCompany");
  });

  it("com contactos por contactar", () => {
    expect(
      nextStep(data({ searches: [search], leads: { to_contact: 3 } }), NOW),
    ).toEqual({ kind: "toContact", count: 3 });
  });

  it("com tudo em dia: nova busca", () => {
    expect(
      nextStep(data({ searches: [search], leads: { won: 1 } }), NOW).kind,
    ).toBe("newSearch");
  });

  it("uma demo a 7 dias ou menos passa à frente dos contactos", () => {
    const step = nextStep(
      data({
        leads: { to_contact: 3 },
        demos: {
          active: 1,
          items: [{ id: "d", company_name: "Escrita", expires_at: inDays(7) }],
        },
      }),
      NOW,
    );
    expect(step).toEqual({ kind: "expiringDemo", id: "d", name: "Escrita", days: 7 });
  });

  it("uma demo a mais de 7 dias não é urgente", () => {
    const step = nextStep(
      data({
        leads: { to_contact: 3 },
        demos: {
          active: 1,
          items: [{ id: "d", company_name: "Escrita", expires_at: inDays(8) }],
        },
      }),
      NOW,
    );
    expect(step.kind).toBe("toContact");
  });

  it("limite atingido sem pack: subscrever", () => {
    expect(nextStep(data({ usage: full }), NOW).kind).toBe("limitSubscribe");
  });

  it("no teste, o limite atingido também sugere subscrever", () => {
    const subscription = { ...data().subscription, status: "trialing", plan: "pro" };
    expect(nextStep(data({ usage: full, subscription }), NOW).kind).toBe("limitSubscribe");
  });

  it("limite atingido com pack: subir de pack", () => {
    expect(
      nextStep(data({ usage: full, subscription: active(PLANS[0].id) }), NOW).kind,
    ).toBe("limitUpgrade");
  });

  it("limite atingido no maior pack: esperar pela renovação", () => {
    expect(
      nextStep(
        data({ usage: full, subscription: active(PLANS[PLANS.length - 1].id) }),
        NOW,
      ).kind,
    ).toBe("limitWait");
  });

  it.each(["past_due", "unpaid"])("pagamento falhado (%s) vem antes de tudo", (status) => {
    const subscription = { ...data().subscription, status, plan: "pro" };
    expect(nextStep(data({ usage: full, subscription }), NOW).kind).toBe("paymentProblem");
  });
});

describe("consumo", () => {
  it("segue os limites recebidos, sem números escritos à mão", () => {
    const meters = usageMeters(
      data({
        usage: {
          ...data().usage,
          searches_used: 7,
          searches_limit: PLANS[0].searches,
          demos_used: 1,
          demos_limit: PLANS[0].demos,
        },
      }),
    );
    expect(meters[0]).toMatchObject({ key: "searches", used: 7, limit: 100, percent: 7, reached: false });
    expect(meters[1]).toMatchObject({ key: "demos", used: 1, limit: 10, percent: 10 });
  });

  it("marca o limite atingido e não passa dos 100%", () => {
    const [searches] = usageMeters(
      data({ usage: { ...data().usage, searches_used: 12, searches_limit: 10 } }),
    );
    expect(searches.reached).toBe(true);
    expect(searches.percent).toBe(100);
  });

  it("limite a 0 conta como atingido", () => {
    const [searches] = usageMeters(
      data({ usage: { ...data().usage, searches_limit: 0 } }),
    );
    expect(searches).toMatchObject({ reached: true, percent: 100 });
  });

  it("o painel não escreve limites nem preços à mão", () => {
    // As classes de CSS têm números que não são limites.
    const source = readFileSync("src/app/painel/page.tsx", "utf8").replace(
      /className=(\{[^}]*\}|"[^"]*")/g,
      "",
    );
    expect(source).not.toMatch(/\b(100|150|245|750|300)\b/);
    expect(source).not.toMatch(/€|R\$/);
  });

  it("o painel não usa fornecedores pagos ao carregar", () => {
    const source = readFileSync("src/app/painel/page.tsx", "utf8");
    expect(source).not.toMatch(/findById|lookupCompany|messages\.stream|provider\.search|provider\.stream/);
  });
});

describe("restantes regras", () => {
  it("dias até ao apagamento arredondam para cima e não ficam negativos", () => {
    expect(daysUntil(inDays(6.2), NOW)).toBe(7);
    expect(daysUntil(inDays(-1), NOW)).toBe(0);
  });

  it("soma os contactos de todos os estados", () => {
    expect(totalLeads({ to_contact: 2, won: 1 })).toBe(3);
    expect(totalLeads({})).toBe(0);
  });

  it("repetir usa o que foi pesquisado e protege o serviço", () => {
    expect(repeatQuery(search)).toEqual({
      service: "website_creation",
      niche: "Barbearias",
      locality: "Porto",
    });
    expect(repeatQuery({ ...search, service: "outro" }).service).toBe("website_creation");
  });

  it("o filtro do CRM só aceita estados que existem", () => {
    expect(parseStatusFilter("won")).toBe("won");
    expect(parseStatusFilter("x")).toBeNull();
    expect(parseStatusFilter(["won"])).toBeNull();
  });

  it("os textos não prometem resultados", () => {
    expect(JSON.stringify(ptPT.dashboard)).not.toMatch(/garant|ganha|clientes garantidos/i);
  });
});
