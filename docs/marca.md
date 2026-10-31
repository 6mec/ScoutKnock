# ScoutKnock — identidade visual e tom

Fonte única para visual e textos. O Claude Code deve seguir este ficheiro ao construir qualquer ecrã.

## Ideia da marca

**Scout** = explorar, encontrar (o radar). **Knock** = bater à porta com uma proposta já pronta. O produto faz as duas coisas, por isso o nome e o símbolo juntam radar + ponto encontrado.

Personalidade: direta, honesta, tecnológica, sem exageros. Fala como um colega que sabe do assunto, não como um vendedor de cursos.

## Slogan

- **Principal (PT):** Bate à porta certa.
- Apoio: Encontra empresas que precisam do teu serviço e chega com a proposta pronta.
- **EN:** Knock on the right door.
- Alternativas: "Clientes perto de ti, propostas prontas." / "Menos procura. Mais conversas."

## Símbolo e logótipo

- Símbolo: `public/brand/scoutknock-mark.svg` (quadrado arredondado escuro, arcos de radar e linha de varrimento em verde, ponto laranja = empresa encontrada).
- Logótipo em texto: **Scout** em `--foreground` + **Knock** em `--accent`, tudo em Geist Sans, peso 700.
- O símbolo não é legível abaixo de 24 px. Para o favicon usar o símbolo a 32 px ou mais.
- Não esticar, não rodar, não mudar as cores do símbolo.

## Cores

Tema escuro ("radar") por defeito, com a classe `dark` no `<html>` (ver `docs/design.md`); os tokens claros continuam disponíveis. Todas as combinações abaixo passam o contraste mínimo de acessibilidade (4,5:1 para texto).

| Papel | Escuro | Claro |
| --- | --- | --- |
| Fundo | `#0B0F14` | `#F7F9FB` |
| Superfície (cartões) | `#121821` | `#FFFFFF` |
| Borda | `#1F2937` | `#E3E8EE` |
| Texto | `#E6EDF3` | `#0B0F14` |
| Texto secundário | `#8B98A9` | `#566273` |
| Destaque (verde radar) | `#2DE2A6` | `#0A7F5B` |
| Ação secundária / ponto encontrado (âmbar) | `#FFB547` | `#A15C00` |
| Erro | `#FF6B6B` | `#C62828` |

Regras de uso:

- **Verde** = ação principal e "oportunidade forte". Um só botão principal por ecrã.
- **Âmbar** = destaque pontual (a empresa encontrada, avisos, a nota média). Nunca em botões principais.
- **Vermelho** só para erros. Nunca para nota baixa de oportunidade.
- Texto sobre verde ou âmbar (botões): `#0B0F14` no tema escuro e `#FFFFFF` no tema claro.
- Nota de oportunidade: 70 a 100 verde ("Forte"), 40 a 69 âmbar ("Média"), 0 a 39 texto secundário ("Fraca").
- Cartões: fundo de superfície, borda de 1 px, cantos de 12 px. Sem sombras pesadas nem gradientes.

### Tokens prontos para o `globals.css` (Tailwind v4)

```css
@import "tailwindcss";

:root {
  --background: #f7f9fb;
  --surface: #ffffff;
  --border: #e3e8ee;
  --foreground: #0b0f14;
  --muted: #566273;
  --accent: #0a7f5b;
  --accent-contrast: #ffffff;
  --amber: #a15c00;
  --danger: #c62828;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0b0f14;
    --surface: #121821;
    --border: #1f2937;
    --foreground: #e6edf3;
    --muted: #8b98a9;
    --accent: #2de2a6;
    --accent-contrast: #0b0f14;
    --amber: #ffb547;
    --danger: #ff6b6b;
  }
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-contrast: var(--accent-contrast);
  --color-amber: var(--amber);
  --color-danger: var(--danger);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

Nota: o ficheiro atual força `Arial` no `body`. Substituir pela linha acima, para a letra Geist (já carregada no `layout.tsx`) ser usada.

## Tipografia

- Interface e títulos: **Geist Sans** (já instalada no projeto).
- Números, códigos e a nota de oportunidade: **Geist Mono**.
- Títulos: peso 700, espaçamento ligeiramente apertado. Texto corrente: 400, linha de 1,6.
- Escala e tamanhos mínimos: ver `docs/design.md` (16 px nos campos no telemóvel; 12 a 14 px permitidos em etiquetas).

## Tom dos textos

Português de Portugal por defeito, com versão para o Brasil (pt-BR) em ficheiro de traduções separado. Tratar o utilizador por "tu" em PT e "você" em BR.

- Frases curtas, verbos de ação, sem jargão desnecessário.
- Dizer o que a ferramenta faz, não prometer resultados.
- **Nunca** prometer ganhos ("ganha 2000 € por mês"), garantias ("clientes garantidos"), nem falsa escassez ("só restam 3 vagas") ou contadores falsos.
- Mostrar sempre dados reais. Se não houver resultados, dizê-lo.

Exemplos de microtextos (PT-PT):

| Onde | Texto |
| --- | --- |
| Botão principal da busca | Procurar empresas |
| Estado vazio da busca | Escolhe um serviço, um nicho e uma localidade para começar. |
| Sem resultados | Não encontrámos empresas com estes filtros. Experimenta outra localidade ou outro nicho. |
| Botão de mensagem | Gerar mensagem |
| Aviso antes de enviar | Revê a mensagem antes de enviar. O envio é sempre feito por ti, um contacto de cada vez. |
| Botão do demo | Criar site demo |
| Aviso no demo | Proposta não oficial. Feita por [nome do freelancer] para [empresa]. |
| Botão de publicação | Publicar como oficial |
| Teste grátis | Começar teste grátis de 7 dias |
| Limite atingido | Chegaste ao limite de buscas deste mês. Passa para o pack seguinte ou espera pela renovação. |
| Erro genérico | Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte. |

## Bios das redes

TikTok (máx. 80 caracteres, esta tem 72):

> Bate à porta certa 🚪 Radar de clientes para freelancers. Teste grátis ⬇️

Instagram (máx. 150 caracteres, esta tem 124):

> Radar de clientes para freelancers. Encontra empresas que precisam do teu serviço e recebe a proposta pronta. Teste grátis 👇

Nome de utilizador: `@scoutknock` (livre no TikTok e no Instagram no momento da verificação; confirmar ao criar).

## Landing page: estrutura sugerida

1. Cabeçalho com símbolo, "Entrar" e botão "Começar teste grátis".
2. Herói: slogan + frase de apoio + botão do teste + captura real da busca.
3. Como funciona, em 3 passos: Encontra → Entende → Propõe (radar, nota com motivos, mensagem + site demo).
4. Exemplo da nota de oportunidade com os motivos (só com dados reais ou claramente marcado como exemplo).
5. Packs e preços (ver `docs/plano.md`).
6. Perguntas frequentes (inclui: como se usam os dados, envio manual, cancelamento).
7. Rodapé com privacidade, termos e contacto.
