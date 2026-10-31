# ScoutKnock — direção de arte e movimento

Fonte única para o aspeto e o comportamento de todos os ecrãs. Complementa `docs/marca.md` (cores base, tom, logótipo) e `docs/landing-pt-PT.md` (textos). Se houver conflito, os textos vêm do `landing-pt-PT.md` / `src/i18n`, as cores base do `marca.md` e tudo o resto daqui.

Objetivo: um programador ou designer abre o site e pensa "isto foi feito por uma equipa a sério". Isso não vem de efeitos a mais. Vem de detalhe, consistência, velocidade e de cada animação ter um motivo.

## 1. Direção: "instrumento de precisão"

O ScoutKnock é um radar. O site deve parecer um instrumento: escuro, preciso, calmo, com sinais de vida pontuais (o varrimento, o ponto "ao vivo", um número a subir) e nunca ruidoso.

Três palavras para decidir qualquer dúvida: **preciso**, **vivo**, **honesto**.

- Preciso: linhas de 1 px, alinhamentos perfeitos, números em letra mono com algarismos de largura fixa, espaçamentos de uma escala só.
- Vivo: a interface responde a tudo (hover, clique, carregamento, sucesso). O que está a acontecer de verdade vê-se a acontecer.
- Honesto: nada de contadores falsos, números inventados ou "x pessoas a ver agora". Exemplos sempre marcados como exemplo.

Inspiração (não copiar): a sobriedade e as linhas finas do Linear, a forma como a Stripe mostra o produto real em cada secção, a ideia de "porquê esta empresa" do Insites/SeekerAi. Evitar: brilho roxo, menu flutuante em pílula, gradientes de cor em fundos inteiros, ilustrações 3D genéricas, emojis na interface.

Tema: **escuro por defeito** (classe `dark` no `<html>`), tema claro disponível mais tarde com um botão. Os tokens claros já existem e têm de continuar a funcionar.

## 2. Fundação visual

### Camadas de fundo (escuro)

| Token | Valor | Uso |
| --- | --- | --- |
| `--canvas` | `#070A0E` | Fundo atrás de tudo na app (área de trabalho) |
| `--background` | `#0B0F14` | Fundo das páginas, menu lateral |
| `--surface` | `#121821` | Cartões, painéis |
| `--surface-raised` | `#161E29` | Hover de cartões, menus, diálogos |
| `--border-subtle` | `#1A222E` | Divisões de secções |
| `--border` | `#1F2937` | Bordas de cartões |
| `--border-strong` | `#2B3647` | Botões secundários |
| `--border-input` | `#627085` | Campos de formulário (contraste ≥ 3:1) |
| `--foreground` | `#E6EDF3` | Texto |
| `--muted` | `#8B98A9` | Texto secundário (mínimo para texto pequeno; nada mais escuro que isto em texto) |
| `--accent` | `#2DE2A6` | Ação principal, oportunidade forte |
| `--accent-soft` | `rgba(45,226,166,.12)` | Fundos de seleção, halo |
| `--amber` | `#FFB547` | Empresa em destaque, nota média, avisos |
| `--danger` | `#FF6B6B` | Só erros |

Regras:
- Profundidade faz-se com camadas de cor e bordas, não com sombras. Sombra só em elementos flutuantes (menus, diálogos, toasts): `0 16px 48px -12px rgba(0,0,0,.6)`.
- Brilho verde (`box-shadow` com o acento) só em: botão principal no hover, foco de teclado, elemento "ao vivo". Nunca em cartões parados.
- Texturas permitidas: grelha de 48 px em `#121A24` atrás de áreas de produto; anéis de radar finos em `--border` atrás do herói e do formulário final. Nada de ruído pesado.
- Cantos: 8 px (chips, campos pequenos), 12 px (botões, campos, cartões pequenos), 16 px (cartões grandes, painéis), 999 px (etiquetas em pílula).
- Espaçamento: escala de 4 (4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 88, 120). Secções da landing com 88–120 px de altura de respiro no computador, 56 px no telemóvel.

### Tipografia

- Geist Sans para tudo; Geist Mono para números, notas, códigos, coordenadas e etiquetas de secção.
- Números sempre com `font-variant-numeric: tabular-nums` (os dígitos não saltam quando mudam).
- Escala: 84 (título do herói, computador) / 64 / 48 (herói no telemóvel) / 44 (títulos de secção) / 32 / 24 / 20 / 18 / 16 / 14 / 13 / 12 (só etiquetas mono em maiúsculas).
- Títulos: peso 700, `letter-spacing` entre -0.03em e -0.045em, `line-height` 0.98–1.1, `text-wrap: balance`.
- Texto corrente: 16–20 px, `line-height` 1.55–1.6, `text-wrap: pretty`, largura máxima ~65 caracteres.
- Etiquetas de secção: mono, 13 px, maiúsculas, `letter-spacing: .08em`, cor do acento (âmbar na secção "Honestidade").

## 3. Movimento

### Princípios

1. Cada animação explica algo: de onde veio, o que mudou, o que está a acontecer. Se não explica, sai.
2. Só se anima `transform` e `opacity` (e `filter: blur` em entradas curtas). Nunca `width`, `height`, `top` ou `left` em loop.
3. Interações são rápidas (≤ 200 ms). Entradas podem ir até 900 ms. Loops ambientais são lentos (≥ 3 s) e discretos.
4. Com `prefers-reduced-motion: reduce`: desligar loops, varrimentos, deslizes e contagens; manter só fades curtos. O conteúdo tem de estar todo visível sem animação.

### Tokens

| Nome | Valor |
| --- | --- |
| `instant` | 120 ms |
| `fast` | 200 ms |
| `base` | 320 ms |
| `slow` | 600 ms |
| `entrance` | 900 ms |
| `ease-out` | `cubic-bezier(.2,.7,.2,1)` |
| `ease-in-out` | `cubic-bezier(.65,0,.35,1)` |
| mola (Motion) | `{ type: "spring", stiffness: 380, damping: 32 }` |
| escalonamento | 60 ms entre itens, máximo 8 itens |

### Padrões (usar sempre estes, não inventar outros)

- **Entrada**: de `opacity 0, y 18px, blur 6px` para normal, `entrance` + `ease-out`. Escalonar filhos.
- **Revelação ao fazer scroll**: a mesma entrada, quando 20% do elemento entra no ecrã, uma vez só (`whileInView`, `viewport={{ once: true, amount: 0.2 }}`).
- **Hover em cartão clicável**: sobe 2–4 px, borda passa a `--accent`, fundo a `--surface-raised`, `fast`.
- **Clique em botão**: `scale .98` enquanto pressionado.
- **Botão principal no hover**: sobe 1 px + halo `0 0 0 4px rgba(45,226,166,.18)`.
- **Foco de teclado**: anel de 2 px em `--accent` com 2 px de distância, sempre visível (`:focus-visible`).
- **Números que mudam**: contagem com `@number-flow/react` (nota, contadores reais, buscas usadas).
- **Carregamento**: esqueleto com brilho a passar (1.6 s) no formato exato do conteúdo que vai aparecer. Nada de spinner a ocupar o ecrã.
- **Listas que mudam** (ordenar, filtrar, chegar resultados): animação de layout do Motion (`layout`, `AnimatePresence`), itens novos entram por cima com a entrada.
- **Troca de página**: fade + 8 px, `base`. Na app, o menu lateral não se mexe; só o conteúdo.
- **Diálogos e menus**: escala de .96 para 1 + fade, `fast`, a partir do ponto de origem.
- **Toasts** (`sonner`): entram por baixo à direita; sucesso com um visto que se desenha.
- **Ambiente** (loops, só estes): varrimento do radar, ponto "ao vivo" a pulsar, rotação lenta do globo, faixa de nichos.

### Desempenho (obrigatório)

- Lighthouse ≥ 90 em desempenho, acessibilidade e boas práticas, no telemóvel.
- LCP < 2.5 s, CLS < 0.1. O título do herói é texto real, aparece logo (a animação não pode atrasar o LCP).
- O globo (WebGL) e o mapa carregam depois (`next/dynamic` com `ssr: false`), com um fundo estático no mesmo sítio enquanto carregam, e pausam quando saem do ecrã ou o separador fica escondido.
- 60 fps num telemóvel médio. No telemóvel, menos partículas e menos linhas.

## 4. Bibliotecas

Confirmar versões compatíveis com Next 16 e React 19 antes de instalar. Nada além disto sem perguntar.

| Para quê | Biblioteca |
| --- | --- |
| Animação | `motion` (import de `motion/react`) |
| Globo 3D leve | `cobe` |
| Números a contar | `@number-flow/react` |
| Componentes acessíveis | `shadcn/ui` (sobre Radix), adaptado aos nossos tokens |
| Ícones | `lucide-react` (traço 1.5–1.75, 16/18/20 px) |
| Toasts | `sonner` |
| Paleta de comandos | `cmdk` |
| Arrastar no CRM | `@dnd-kit/core` |
| Juntar classes | `clsx` + `tailwind-merge` (`cn()`) |
| Mapa real (fase posterior) | `maplibre-gl` — só depois de escolher fornecedor de mapas e ver custos |

## 5. Componentes base

Ficam em `src/components/ui/`. Cada um com todos os estados desenhados: normal, hover, foco, pressionado, desativado, a carregar, erro.

- **Button**: `primary` (verde, texto `#0B0F14`, um por ecrã), `secondary` (borda forte, transparente), `ghost`, `danger`. Tamanhos 36 / 44 / 52 px. Estado `loading` com spinner pequeno e texto a mudar ("A procurar…"), largura não muda.
- **Field**: `Label` + `Input`/`Select`/`Textarea` + texto de ajuda + erro (vermelho, com ícone, anunciado por `aria-live`). Altura 44–48 px.
- **Card**, **Panel**, **Badge**, **Tabs**, **Dialog**, **DropdownMenu**, **Tooltip**, **Skeleton**, **Progress**, **Kbd**, **Avatar**.
- **ScoreChip**: nota em mono numa caixa (verde ≥ 70, âmbar 40–69, contorno cinzento < 40) + nível escrito ("Forte", "Média", "Fraca"); a cor nunca é o único sinal.
- **ScoreBreakdown**: lista de motivos com os pontos reais de `lib/radar/score.ts` e uma barra que enche até à nota.
- **EmptyState**: ícone de radar sem sinais, frase do `marca.md`, uma ação.
- **LiveDot**: ponto que pulsa, com texto "ao vivo" ou "a procurar".
- **Logo**: símbolo com o varrimento a rodar uma vez quando a página carrega (e no estado "a procurar").

## 6. Ecrã a ecrã

### Landing (`/`)

Ordem e textos: `docs/landing-pt-PT.md`. Desenho de referência no canvas "ScoutKnock — desenho da landing e do radar".

1. **Cabeçalho**: fixo no topo, transparente; ao fazer scroll ganha fundo `--background` a 80% com `backdrop-filter: blur(12px)` e borda inferior. No telemóvel, menu num painel que desliza da direita.
2. **Herói**: título com entrada escalonada (etiqueta → título → frase → botões → produto). À direita, o **radar vivo**: componente real com o feixe a rodar e as empresas a acender quando o feixe passa, a lista ao lado com a primeira linha a "respirar". Por trás, o **globo `cobe`** muito discreto (opacidade baixa), com marcadores a pulsar em cidades de Portugal e do Brasil e um arco entre os dois países. Tudo marcado "Exemplo ilustrativo".
3. **Faixa de nichos**: texto mono a deslizar devagar (pausa no hover; parado com movimento reduzido).
4. **Para quem é**: duas colunas, etiquetas que acendem no hover.
5. **Como funciona — scroll contado**: a coluna da esquerda fica fixa (`position: sticky`) e mostra os três passos; à direita, um único "ecrã do produto" que muda à medida que se faz scroll: 01 Encontra (filtros a serem escolhidos), 02 Percebe (nota a contar e motivos a entrar), 03 Propõe (mensagem a escrever-se e site demo a aparecer). O passo ativo fica a branco, os outros a `--muted`. No telemóvel vira três blocos normais.
6. **A nota — interativa**: cartão de exemplo onde o visitante liga e desliga motivos ("Tem site?", "Avaliações", "Horário no Google") e a nota recalcula ao vivo com a função real `scoreCompany`. É o pormenor que mostra que há produto por trás. Marcado "Exemplo ilustrativo".
7. **Site demo**: janela de browser com interruptor Computador/Telemóvel; a prévia muda de tamanho com animação de layout. Aviso "Proposta não oficial" sempre visível.
8. **Honestidade**: fundo `--surface`, etiqueta âmbar, três compromissos com ícones.
9. **Perguntas**: acordeão (Radix) com altura animada e ícone + que roda para ×.
10. **Lista de espera**: anéis de radar atrás. Formulário com estados: a enviar (botão a carregar), sucesso (o cartão troca para um visto desenhado + mensagem), erros por campo. Nada de recarregar a página.
11. **Rodapé**: simples, ligações legais.

### Autenticação (`/entrar`, `/registar`, `/recuperar`, `/nova-palavra-passe`, `/link-invalido`)

- Ecrã dividido no computador: formulário à esquerda (máx. 400 px), painel à direita com o radar ambiente e uma frase da marca. No telemóvel só o formulário.
- Validação ao sair do campo, não a cada tecla. Mostrar/esconder palavra-passe. Botão com estado a carregar. Erros do Supabase traduzidos para frases do `marca.md`.
- Transição suave entre "Entrar" e "Registar" (o cartão mantém-se, o conteúdo troca).

### Estrutura da app (`/painel/*`)

- Menu lateral de 232 px (recolhe para 64 px só com ícones; no telemóvel vira barra inferior com 4 ícones). Itens: Radar, Contactos, Sites demo, Mensagens; em baixo, contador de buscas do mês e conta.
- Barra de topo: título da página, pesquisa global e **paleta de comandos** (`Ctrl K` / `⌘K`) com "Nova busca", "Ir para contactos", "Criar site demo", "Mudar tema".
- Fundo da área de trabalho `--canvas` com a grelha de 48 px muito discreta.

### Início do painel (`/painel`)

- Saudação com o nome, "Nova busca" em destaque, últimas buscas (cartões clicáveis com nicho, local, nº de empresas e data), contactos a precisar de seguimento.
- Primeira vez: estado vazio com 3 passos para começar, não um ecrã em branco.

### Radar (`/painel/radar`)

Três estados no mesmo ecrã, com transições entre eles:

1. **Escolher**: Serviço, Nicho (com sugestões), Localidade (distrito/concelho em PT, cidade/bairro no BR, com autocompletar) e "Procurar empresas". O globo à direita roda devagar à espera.
2. **A procurar** (referência: artboard "Radar · a procurar"): o globo roda até às coordenadas da localidade e aproxima; pino âmbar com ondas; feixe a varrer a zona; empresas acendem à volta. Ao lado, o registo com os passos **reais** do pedido (localidade encontrada → a ler empresas → a verificar sites → a calcular notas), cada um com visto quando termina de facto. Contador e lista de resultados alimentados pelos dados reais à medida que chegam (streaming do servidor), esqueletos no lugar dos que faltam. Botão "Cancelar".
3. **Resultados** (referência: artboard "Radar · resultados"): lista ordenada pela nota com filtros Todas/Forte/Média/Fraca (animação de layout ao filtrar), detalhe da empresa selecionada à direita com `ScoreBreakdown`, dados públicos e ações: **Gerar mensagem** (principal), Criar site demo, Guardar nos contactos. No telemóvel, o detalhe abre num painel que sobe de baixo.

Estados obrigatórios: sem resultados, erro do fornecedor, limite de buscas atingido (textos do `marca.md`), sem ligação.

### Mensagem

- A mensagem escreve-se ao vivo (streaming real da API), com cursor; no fim fica editável.
- Botões: Copiar (toast "Copiada"), Abrir no WhatsApp (abre com o texto, o envio é do utilizador), Gerar outra versão (tom: mais curta / mais formal).
- Aviso fixo do `marca.md` sobre rever e enviar um a um.

### Sites demo

- Galeria de demos em cartões com miniatura real, estado (Rascunho / Enviada / Oficial) e data.
- Página da demo: prévia grande com interruptor Computador/Telemóvel, painel lateral para mudar nome, cores, fotos e textos com pré-visualização imediata; "Copiar link" e "Publicar como oficial" (com diálogo de confirmação e o preço por mês claro).

### Contactos (CRM)

- Quadro em colunas: Por contactar, Contactado, Respondeu, Proposta, Ganho, Perdido. Cartões arrastáveis (`dnd-kit`) com animação ao largar; também se muda o estado por menu (acessível sem rato).
- Vista em tabela alternativa, com ordenação e pesquisa.
- Cartão do contacto: nota, último contacto, próxima ação com data, notas livres.

### Planos e conta

- Planos em 3 cartões, o recomendado destacado com borda verde (sem "mais popular" se não for verdade). Limites claros em números. Preços só quando estiverem decididos: até lá `[PREÇO]`.
- Conta: dados, tema, idioma, faturação (Stripe), apagar conta (diálogo com confirmação escrita).

### Páginas de sistema

- 404: radar vazio a varrer, "Nada no radar por aqui." e botão para o início.
- Erro: frase do `marca.md`, botão "Tentar outra vez".
- Páginas legais: tipografia de leitura confortável (máx. 70 caracteres), índice lateral no computador.

## 7. Acessibilidade e qualidade

- Contraste: texto ≥ 4.5:1 (cinzento mínimo `#8B98A9` sobre os fundos escuros), elementos de interface ≥ 3:1.
- Tudo funciona só com teclado, por ordem lógica; foco sempre visível.
- Elementos reais: `<button>`, `<a href>`, `<label>` ligado ao campo. Botões só com ícone têm `aria-label`.
- Áreas de toque ≥ 44 px. Texto mínimo de 16 px no telemóvel em campos (evita zoom no iPhone).
- Pontos de quebra: 390 (telemóvel), 768 (tablet), 1024, 1280, 1440. Desenhar primeiro para o telemóvel.
- Animações decorativas com `aria-hidden`. O estado "a procurar" anuncia o progresso por `aria-live="polite"`.

## 8. Honestidade visual

- Na landing, tudo o que parece produto é **exemplo**, marcado como tal. Nenhum número da landing finge ser real (utilizadores, empresas encontradas, receitas).
- Na app, cada número mostrado vem dos dados reais. Os pontos dos motivos vêm sempre de `lib/radar/score.ts`; nunca escrever pontos à mão num componente.
- O exemplo da nota na landing é calculado pela mesma função `scoreCompany`, para nunca ficar diferente da app.

## 9. Fases

Cada fase: o Claude Code propõe um plano curto, o Daniel aprova, o Claude Code implementa, corre `npm run lint`, `npm test` e `npm run build`, o Daniel faz commit e o Claude (chat) revê no browser antes da fase seguinte.

1. **Base visual**: tokens, tema escuro por defeito, tipografia, utilitários de movimento, componentes base (`ui/`), página interna `/painel/ui` (só em desenvolvimento) com todos os componentes e estados para rever.
2. **Landing** completa com o herói vivo, o scroll contado, a nota interativa e o formulário com estados.
3. **Autenticação** com o novo visual.
4. **Estrutura da app + Radar** (três estados, com dados de exemplo enquanto não houver Google Places).
5. **Mensagem + Sites demo**.
6. **Contactos + Planos e conta**.
7. **Polimento**: 404/erros, tema claro, revisão de desempenho e acessibilidade no telemóvel.

## 10. Pronto quando…

Um ecrã só está pronto quando:
- [ ] segue os tokens e componentes daqui (nenhuma cor ou tamanho solto no código);
- [ ] tem todos os estados (vazio, a carregar, erro, sucesso);
- [ ] fica bem a 390 px e a 1440 px;
- [ ] funciona com teclado e com movimento reduzido;
- [ ] os textos estão no `src/i18n` em pt-PT;
- [ ] não tem números falsos;
- [ ] lint, testes e build passam.
