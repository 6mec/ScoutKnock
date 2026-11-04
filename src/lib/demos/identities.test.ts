import { describe, expect, it } from "vitest";
import {
  contrast,
  heroButton,
  IDENTITIES,
  IDENTITY_KEYS,
  identityOf,
  inLocality,
  matchIdentity,
  textOn,
} from "./identities";
import { DEMO_COLORS } from "./rules";

describe("matchIdentity", () => {
  it.each([
    ["Barbearias", "barbearia"],
    ["Cabeleireiro unissexo", "cabeleireiro"],
    ["Restaurantes", "restaurante"],
    ["Pastelaria", "cafe"],
    ["Clínica de fisioterapia", "clinica"],
    ["Dentistas", "dentista"],
    ["Ginásios", "ginasio"],
    ["Pet shop", "animais"],
    ["Oficinas", "oficina"],
    ["Imobiliárias", "imobiliaria"],
    ["Advogados", "escritorio"],
    ["Floristas", "loja"],
    ["Lavandarias", "generico"],
  ])("%s → %s", (niche, key) => {
    expect(matchIdentity(niche)).toBe(key);
  });

  it("usa a identidade guardada e, sem ela, adivinha pelo nicho", () => {
    expect(identityOf("loja", "Barbearias").key).toBe("loja");
    expect(identityOf(null, "Barbearias").key).toBe("barbearia");
    expect(identityOf("nao-existe", "Barbearias").key).toBe("barbearia");
  });
});

describe("inLocality", () => {
  it.each([
    ["Porto", "no Porto"],
    ["Maia", "na Maia"],
    ["Póvoa de Varzim", "na Póvoa de Varzim"],
    ["Lisboa", "em Lisboa"],
    ["Braga", "em Braga"],
  ])("%s → %s", (locality, expected) => {
    expect(inLocality(locality)).toBe(expected);
  });

  it("os títulos já usam a preposição certa", () => {
    expect(IDENTITIES.barbearia.headline("Porto")).toBe("Corte e barba com tempo, no Porto");
  });
});

describe("contraste das identidades (WCAG AA)", () => {
  it.each(IDENTITY_KEYS)("%s lê-se bem", (key) => {
    const p = IDENTITIES[key].palette;
    expect(contrast(p.text, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.text, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.muted, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.muted, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.heroText, p.heroBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.heroMuted, p.heroBackground)).toBeGreaterThanOrEqual(4.5);
    // Ícones e destaques sobre o fundo da página.
    expect(contrast(p.accent, p.background)).toBeGreaterThanOrEqual(3);
  });

  it.each(IDENTITY_KEYS)("%s: os botões leem-se com qualquer cor aceite", (key) => {
    const p = IDENTITIES[key].palette;
    for (const accent of [p.accent, ...Object.values(DEMO_COLORS)]) {
      expect(contrast(accent, textOn(accent))).toBeGreaterThanOrEqual(4.5);
      const hero = heroButton(p, accent);
      expect(contrast(hero, p.heroBackground)).toBeGreaterThanOrEqual(3);
      expect(contrast(hero, textOn(hero))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
