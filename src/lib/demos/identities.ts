import type { DemoTemplate } from "./rules";

// Identidade de cada nicho: paleta, letras, disposição, tom e textos iniciais.
// Inspirada na ideia de "identidade sugerida para o nicho" (estudada com o REA no
// crieai.app), com nichos, cores e textos nossos. Os textos iniciais são sugestões
// para o freelancer rever: não afirmam preços, anos, prémios nem números.

export type FontKey = "oswald" | "playfair" | "fraunces" | "dmSerif" | "nunito" | "inter";

export type Palette = {
  // Fundo e texto da página.
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  // Topo do site.
  heroBackground: string;
  heroText: string;
  heroMuted: string;
  // Cor de destaque por omissão (botões e ícones).
  accent: string;
};

export type IdentityCopy = {
  services: { title: string; description: string }[];
  highlights: { title: string; description: string }[];
  subheadline: string;
  cta: string;
  about: string;
};

export type Identity = {
  key: IdentityKey;
  label: string;
  // Palavras que, no nicho escrito, levam a esta identidade.
  match: string[];
  palette: Palette;
  fonts: { display: FontKey; body: FontKey };
  layout: DemoTemplate;
  // Para o Claude: o tom e o que não fazer.
  tone: string;
  avoid: string;
  headline: (locality: string) => string;
  copy: IdentityCopy;
};

export const IDENTITY_KEYS = [
  "barbearia",
  "cabeleireiro",
  "restaurante",
  "cafe",
  "clinica",
  "dentista",
  "ginasio",
  "animais",
  "oficina",
  "imobiliaria",
  "escritorio",
  "loja",
  "generico",
] as const;
export type IdentityKey = (typeof IDENTITY_KEYS)[number];

const LIGHT = { surface: "#FFFFFF", text: "#14171C", muted: "#4A5160", border: "#E3E6EB" };

// Localidades que se dizem com artigo ("no Porto", "na Maia"). As outras levam "em".
const WITH_ARTICLE: Record<string, "no" | "na"> = {
  porto: "no",
  funchal: "no",
  seixal: "no",
  barreiro: "no",
  montijo: "no",
  cartaxo: "no",
  entroncamento: "no",
  fundao: "no",
  sabugal: "no",
  bombarral: "no",
  crato: "no",
  corvo: "no",
  nordeste: "no",
  maia: "na",
  amadora: "na",
  trofa: "na",
  covilha: "na",
  guarda: "na",
  nazare: "na",
  batalha: "na",
  moita: "na",
  mealhada: "na",
  lourinha: "na",
  golega: "na",
  "marinha grande": "na",
  "figueira da foz": "na",
  "povoa de varzim": "na",
  "povoa de lanhoso": "na",
  "ribeira grande": "na",
  "praia da vitoria": "na",
};

export function inLocality(locality: string) {
  const key = locality.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  return `${WITH_ARTICLE[key] ?? "em"} ${locality.trim()}`;
}

export const IDENTITIES: Record<IdentityKey, Identity> = {
  barbearia: {
    key: "barbearia",
    label: "Barbearia",
    match: ["barbear", "barber"],
    palette: {
      background: "#15120F",
      surface: "#1F1A16",
      text: "#F3EDE4",
      muted: "#C2B8AA",
      border: "#3A322B",
      heroBackground: "#15120F",
      heroText: "#F3EDE4",
      heroMuted: "#C2B8AA",
      accent: "#C99A3D",
    },
    fonts: { display: "oswald", body: "inter" },
    layout: "bold",
    tone: "Direto e masculino, com palavras de barbearia (corte, barba, navalha, degradê). Frases curtas, sem floreados.",
    avoid: "Cores pastel, tom infantil, promoções ou cupões inventados.",
    headline: (locality) => `Corte e barba com tempo, ${inLocality(locality)}`,
    copy: {
      subheadline: "Marque o seu horário e chegue sem esperas.",
      cta: "Marcar horário",
      services: [
        { title: "Corte", description: "Clássico ou moderno, à tesoura ou à máquina." },
        { title: "Barba", description: "Desenho e acabamento à navalha." },
        { title: "Corte e barba", description: "O serviço completo, numa só marcação." },
      ],
      highlights: [
        { title: "Marcação simples", description: "Por telefone ou WhatsApp." },
        { title: "Sem pressas", description: "Cada cliente tem o seu tempo." },
        { title: "Perto de si", description: "Fácil de encontrar no mapa." },
      ],
      about: "Uma barbearia de bairro, onde o corte se faz com cuidado e a conversa é boa.",
    },
  },
  cabeleireiro: {
    key: "cabeleireiro",
    label: "Cabeleireiro e estética",
    match: ["cabeleir", "salão", "salao", "estétic", "estetic", "unhas", "manicure", "beleza", "spa", "massag"],
    palette: {
      background: "#FBF6F4",
      ...LIGHT,
      heroBackground: "#F6E9E6",
      heroText: "#2A1A1D",
      heroMuted: "#5E4A4E",
      accent: "#9E3F57",
    },
    fonts: { display: "dmSerif", body: "inter" },
    layout: "soft",
    tone: "Caloroso e cuidado, próximo, a falar de bem-estar e de tempo para si.",
    avoid: "Promessas de resultados, tratamentos médicos ou nomes de marcas.",
    headline: (locality) => `Tempo para cuidar de si, ${inLocality(locality)}`,
    copy: {
      subheadline: "Marque o seu momento e deixe o resto connosco.",
      cta: "Marcar agora",
      services: [
        { title: "Cabelo", description: "Corte, brushing e coloração." },
        { title: "Unhas", description: "Manicure e pedicure." },
        { title: "Estética", description: "Cuidados de rosto e corpo." },
      ],
      highlights: [
        { title: "Por marcação", description: "Sem esperas à porta." },
        { title: "Atendimento próximo", description: "Ouvimos o que procura." },
        { title: "Fácil de chegar", description: "Morada e contacto aqui em baixo." },
      ],
      about: "Um espaço tranquilo para tratar do cabelo, das unhas e de si.",
    },
  },
  restaurante: {
    key: "restaurante",
    label: "Restaurante",
    match: ["restaur", "tasca", "marisq", "churrasq", "pizz", "sushi", "hamburg", "comida", "taberna"],
    palette: {
      background: "#FBF7F1",
      ...LIGHT,
      heroBackground: "#2B1418",
      heroText: "#FBF3EA",
      heroMuted: "#E2CFC4",
      accent: "#8B1E2D",
    },
    fonts: { display: "playfair", body: "inter" },
    layout: "classic",
    tone: "Acolhedor e com apetite, a falar de mesa, de cozinha e de partilhar.",
    avoid: "Pratos, preços ou horários inventados.",
    headline: (locality) => `Boa mesa ${inLocality(locality)}`,
    copy: {
      subheadline: "Reserve a sua mesa ou ligue para saber o prato do dia.",
      cta: "Reservar mesa",
      services: [
        { title: "Almoço", description: "Para uma pausa a meio do dia." },
        { title: "Jantar", description: "Com tempo para estar à mesa." },
        { title: "Grupos", description: "Para jantares de amigos e de família." },
      ],
      highlights: [
        { title: "Reservas por telefone", description: "Garanta a sua mesa." },
        { title: "Cozinha caseira", description: "Pratos feitos com tempo." },
        { title: "Fácil de encontrar", description: "Veja a morada no mapa." },
      ],
      about: "Uma casa para comer bem, sem pressa, com quem gosta.",
    },
  },
  cafe: {
    key: "cafe",
    label: "Café, padaria e pastelaria",
    match: ["café", "cafe", "padar", "pastel", "confeit", "bolo", "gelad", "snack", "pão", "pao"],
    palette: {
      background: "#FAF6EF",
      ...LIGHT,
      heroBackground: "#F2E7D8",
      heroText: "#2B1D12",
      heroMuted: "#5C4A3A",
      accent: "#7A4A2A",
    },
    fonts: { display: "fraunces", body: "inter" },
    layout: "soft",
    tone: "Simples e quente, de bairro, a falar de pão fresco, café e lanche.",
    avoid: "Encomendas online, entregas ou preços inventados.",
    headline: (locality) => `O seu café de todos os dias, ${inLocality(locality)}`,
    copy: {
      subheadline: "Passe por cá ou ligue para fazer a sua encomenda.",
      cta: "Ligar agora",
      services: [
        { title: "Pequeno-almoço", description: "Para começar bem o dia." },
        { title: "Pão e bolos", description: "Feitos a pensar no dia a dia." },
        { title: "Encomendas", description: "Para aniversários e ocasiões." },
      ],
      highlights: [
        { title: "Encomendas por telefone", description: "É só ligar." },
        { title: "De bairro", description: "Para quem passa todos os dias." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Um café de bairro, para o pequeno-almoço, o lanche e uma conversa.",
    },
  },
  clinica: {
    key: "clinica",
    label: "Clínica e saúde",
    match: ["clínic", "clinic", "fisioter", "saúde", "saude", "psicol", "nutri", "osteo", "médic", "medic", "podolog"],
    palette: {
      background: "#F6FAFA",
      ...LIGHT,
      heroBackground: "#E6F2F1",
      heroText: "#0F2A2A",
      heroMuted: "#3E5958",
      accent: "#0F766E",
    },
    fonts: { display: "inter", body: "inter" },
    layout: "classic",
    tone: "Sereno, claro e de confiança. Linguagem simples, sem termos técnicos.",
    avoid: "Promessas de cura, diagnósticos, especialidades ou acordos inventados.",
    headline: (locality) => `Cuidar da sua saúde, perto de si ${inLocality(locality)}`,
    copy: {
      subheadline: "Marque a sua consulta por telefone.",
      cta: "Marcar consulta",
      services: [
        { title: "Consultas", description: "Com tempo para ouvir." },
        { title: "Acompanhamento", description: "Ao longo do tratamento." },
        { title: "Marcações", description: "Por telefone, ao horário que lhe dá jeito." },
      ],
      highlights: [
        { title: "Por marcação", description: "Sem longas esperas." },
        { title: "Atendimento claro", description: "Explicamos cada passo." },
        { title: "Fácil de chegar", description: "Morada e contacto aqui em baixo." },
      ],
      about: "Um espaço de saúde onde cada pessoa é ouvida com tempo.",
    },
  },
  dentista: {
    key: "dentista",
    label: "Dentista",
    match: ["dent", "ortodon", "implant", "sorriso"],
    palette: {
      background: "#F5F8FC",
      ...LIGHT,
      heroBackground: "#E7EEF9",
      heroText: "#0F1E3A",
      heroMuted: "#3D4E6B",
      accent: "#1D4ED8",
    },
    fonts: { display: "nunito", body: "inter" },
    layout: "classic",
    tone: "Tranquilizador e simples, para quem tem receio do dentista.",
    avoid: "Preços, tratamentos específicos ou acordos com seguros inventados.",
    headline: (locality) => `Sorria à vontade, ${inLocality(locality)}`,
    copy: {
      subheadline: "Marque a sua consulta por telefone.",
      cta: "Marcar consulta",
      services: [
        { title: "Consulta de rotina", description: "Para manter tudo em dia." },
        { title: "Higiene oral", description: "Limpeza e conselhos." },
        { title: "Urgências", description: "Ligue e veja a disponibilidade." },
      ],
      highlights: [
        { title: "Por marcação", description: "Ao horário que lhe dá jeito." },
        { title: "Sem pressas", description: "Explicamos tudo antes de começar." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Uma clínica dentária pensada para quem quer ser tratado com calma.",
    },
  },
  ginasio: {
    key: "ginasio",
    label: "Ginásio e desporto",
    match: ["ginás", "ginas", "fitness", "crossfit", "pilates", "yoga", "box", "personal", "academia", "dança", "danca"],
    palette: {
      background: "#0E1116",
      surface: "#171B22",
      text: "#F2F4F7",
      muted: "#AEB5C1",
      border: "#2A303A",
      heroBackground: "#0E1116",
      heroText: "#F2F4F7",
      heroMuted: "#AEB5C1",
      accent: "#E8590C",
    },
    fonts: { display: "oswald", body: "inter" },
    layout: "bold",
    tone: "Enérgico e motivador, mas sem exageros nem promessas de resultados.",
    avoid: "Promessas de perder peso, preços de mensalidades ou aulas inventadas.",
    headline: (locality) => `Treine ${inLocality(locality)}`,
    copy: {
      subheadline: "Venha conhecer o espaço e marque a sua primeira aula.",
      cta: "Marcar visita",
      services: [
        { title: "Treino livre", description: "Ao seu ritmo." },
        { title: "Aulas de grupo", description: "Para treinar com outros." },
        { title: "Acompanhamento", description: "Para começar com orientação." },
      ],
      highlights: [
        { title: "Visita sem compromisso", description: "Venha conhecer." },
        { title: "Para todos os níveis", description: "Do primeiro treino em diante." },
        { title: "Fácil de chegar", description: "Veja a morada no mapa." },
      ],
      about: "Um espaço para treinar, ganhar rotina e sentir-se bem.",
    },
  },
  animais: {
    key: "animais",
    label: "Animais",
    match: ["pet", "veterin", "animal", "cão", "cao", "gato", "tosquia", "canil", "hotel canino"],
    palette: {
      background: "#FFF8F1",
      ...LIGHT,
      heroBackground: "#FFEBD9",
      heroText: "#2E1A0B",
      heroMuted: "#5E4532",
      accent: "#B4410B",
    },
    fonts: { display: "nunito", body: "inter" },
    layout: "soft",
    tone: "Carinhoso e divertido, a falar dos animais como família.",
    avoid: "Tratamentos veterinários, preços ou marcas inventados.",
    headline: (locality) => `Para quem é da família, ${inLocality(locality)}`,
    copy: {
      subheadline: "Ligue para marcar ou tirar dúvidas.",
      cta: "Ligar agora",
      services: [
        { title: "Banho e tosquia", description: "Para ficarem limpos e confortáveis." },
        { title: "Loja", description: "Comida e acessórios." },
        { title: "Aconselhamento", description: "Para cuidar melhor do seu animal." },
      ],
      highlights: [
        { title: "Por marcação", description: "Sem esperas." },
        { title: "Com carinho", description: "Cada animal é tratado com calma." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Um espaço para cuidar de cães e gatos como se fossem nossos.",
    },
  },
  oficina: {
    key: "oficina",
    label: "Oficina e automóvel",
    match: ["oficin", "mecân", "mecan", "auto", "pneu", "carro", "bate-chapa", "lavagem", "reboque", "mota"],
    palette: {
      background: "#111418",
      surface: "#1A1E24",
      text: "#F1F3F5",
      muted: "#ADB4BD",
      border: "#2C323A",
      heroBackground: "#111418",
      heroText: "#F1F3F5",
      heroMuted: "#ADB4BD",
      accent: "#E0A100",
    },
    fonts: { display: "oswald", body: "inter" },
    layout: "bold",
    tone: "Prático e honesto, de quem explica o problema antes de arranjar.",
    avoid: "Preços, marcas, garantias ou prazos inventados.",
    headline: (locality) => `O seu carro em boas mãos, ${inLocality(locality)}`,
    copy: {
      subheadline: "Ligue para marcar ou pedir um orçamento.",
      cta: "Pedir orçamento",
      services: [
        { title: "Manutenção", description: "Revisões e mudanças de óleo." },
        { title: "Reparações", description: "Diagnóstico e arranjo." },
        { title: "Pneus", description: "Troca e alinhamento." },
      ],
      highlights: [
        { title: "Orçamento antes", description: "Sabe o que vai fazer." },
        { title: "Explicamos tudo", description: "Sem surpresas na fatura." },
        { title: "Fácil de chegar", description: "Veja a morada no mapa." },
      ],
      about: "Uma oficina de confiança, onde se explica o que o carro precisa.",
    },
  },
  imobiliaria: {
    key: "imobiliaria",
    label: "Imobiliária",
    match: ["imobil", "casas", "apartament", "arrend", "alojamento", "hostel", "hotel", "turism"],
    palette: {
      background: "#F7F8FA",
      ...LIGHT,
      heroBackground: "#13233A",
      heroText: "#F4F6FA",
      heroMuted: "#C4CDDB",
      accent: "#1E4E8C",
    },
    fonts: { display: "playfair", body: "inter" },
    layout: "classic",
    tone: "Profissional e de confiança, a falar de casa, de bairro e de escolher com calma.",
    avoid: "Imóveis, preços, áreas ou números de negócios inventados.",
    headline: (locality) => `Encontre casa ${inLocality(locality)}`,
    copy: {
      subheadline: "Fale connosco para comprar, vender ou arrendar.",
      cta: "Falar connosco",
      services: [
        { title: "Comprar", description: "Ajudamos a encontrar a casa certa." },
        { title: "Vender", description: "Do primeiro contacto à escritura." },
        { title: "Arrendar", description: "Para quem procura e para quem tem casa." },
      ],
      highlights: [
        { title: "Conhecemos a zona", description: "Trabalhamos perto de si." },
        { title: "Acompanhamento", description: "Em cada passo." },
        { title: "Fale connosco", description: "Por telefone ou WhatsApp." },
      ],
      about: "Uma imobiliária de proximidade, para escolher casa com calma.",
    },
  },
  escritorio: {
    key: "escritorio",
    label: "Escritório e serviços",
    match: ["advog", "contabil", "solicit", "consult", "seguro", "notári", "notari", "arquitet", "engenh", "contabilidade", "explicaç", "explicac", "escola"],
    palette: {
      background: "#F7F8FA",
      ...LIGHT,
      heroBackground: "#EEF1F5",
      heroText: "#141B26",
      heroMuted: "#475365",
      accent: "#2F4A6D",
    },
    fonts: { display: "playfair", body: "inter" },
    layout: "classic",
    tone: "Sério, claro e próximo, sem jargão.",
    avoid: "Áreas de prática, casos, resultados ou credenciais inventados.",
    headline: (locality) => `Apoio próximo e claro, ${inLocality(locality)}`,
    copy: {
      subheadline: "Marque uma conversa para explicar o que precisa.",
      cta: "Marcar conversa",
      services: [
        { title: "Primeira conversa", description: "Para perceber o que precisa." },
        { title: "Acompanhamento", description: "Do início ao fim do processo." },
        { title: "Esclarecimentos", description: "Respostas claras às suas dúvidas." },
      ],
      highlights: [
        { title: "Linguagem simples", description: "Sem termos complicados." },
        { title: "Por marcação", description: "Ao horário que lhe dá jeito." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Um escritório de proximidade, que explica cada passo com clareza.",
    },
  },
  loja: {
    key: "loja",
    label: "Loja e comércio",
    match: ["loja", "boutique", "roupa", "sapat", "florist", "flores", "livrar", "papelar", "óptica", "optica", "joalh", "mercear", "talho", "peixar", "frutar", "decora", "móveis", "moveis"],
    palette: {
      background: "#FAF9FC",
      ...LIGHT,
      heroBackground: "#EFEAF7",
      heroText: "#1E1530",
      heroMuted: "#4E4363",
      accent: "#6D28D9",
    },
    fonts: { display: "fraunces", body: "inter" },
    layout: "soft",
    tone: "Simpático e de bairro, a convidar a visitar a loja.",
    avoid: "Produtos, marcas, preços ou promoções inventados.",
    headline: (locality) => `A sua loja de bairro, ${inLocality(locality)}`,
    copy: {
      subheadline: "Passe por cá ou ligue para saber se temos o que procura.",
      cta: "Ligar agora",
      services: [
        { title: "Na loja", description: "Venha ver com calma." },
        { title: "Por encomenda", description: "Pergunte-nos o que procura." },
        { title: "Aconselhamento", description: "Ajudamos a escolher." },
      ],
      highlights: [
        { title: "Atendimento próximo", description: "Conhecemos quem nos visita." },
        { title: "Pergunte por telefone", description: "Antes de vir." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Uma loja de bairro, onde vale a pena entrar e perguntar.",
    },
  },
  generico: {
    key: "generico",
    label: "Outro negócio",
    match: [],
    palette: {
      background: "#F7F9FA",
      ...LIGHT,
      heroBackground: "#E8F2F0",
      heroText: "#10201D",
      heroMuted: "#40524E",
      accent: "#0F766E",
    },
    fonts: { display: "inter", body: "inter" },
    layout: "classic",
    tone: "Simples, próximo e claro.",
    avoid: "Serviços, preços, números ou credenciais inventados.",
    headline: (locality) => `Perto de si, ${inLocality(locality)}`,
    copy: {
      subheadline: "Ligue para saber mais ou para marcar.",
      cta: "Ligar agora",
      services: [
        { title: "Atendimento", description: "Ouvimos o que precisa." },
        { title: "Marcações", description: "Por telefone." },
        { title: "Esclarecimentos", description: "Respondemos às suas dúvidas." },
      ],
      highlights: [
        { title: "Fale connosco", description: "Por telefone ou WhatsApp." },
        { title: "Atendimento próximo", description: "Do primeiro contacto em diante." },
        { title: "Perto de si", description: "Veja a morada no mapa." },
      ],
      about: "Um negócio de proximidade, ao serviço de quem vive e trabalha por perto.",
    },
  },
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// Pelo nicho escrito, a identidade mais provável; sem correspondência, a genérica.
export function matchIdentity(niche: string): IdentityKey {
  const wanted = normalize(niche);
  for (const key of IDENTITY_KEYS) {
    if (IDENTITIES[key].match.some((word) => wanted.includes(normalize(word)))) return key;
  }
  return "generico";
}

export function isIdentityKey(value: unknown): value is IdentityKey {
  return IDENTITY_KEYS.some((key) => key === value);
}

export function identityOf(key: string | null | undefined, niche: string) {
  return IDENTITIES[isIdentityKey(key) ? key : matchIdentity(niche)];
}

// Contraste WCAG: o texto dos botões é branco ou quase preto, o que der mais contraste.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

export function textOn(background: string) {
  return contrast(background, "#FFFFFF") >= contrast(background, "#111111") ? "#FFFFFF" : "#111111";
}

// O botão do topo usa a cor de destaque; se ela não se distinguir do fundo do topo,
// passa a usar a cor do texto do topo.
export function heroButton(palette: Palette, accent: string) {
  return contrast(accent, palette.heroBackground) >= 3 ? accent : palette.heroText;
}

// Cores de destaque aceites: as das identidades, além das de sempre.
export const IDENTITY_ACCENTS = [...new Set(IDENTITY_KEYS.map((key) => IDENTITIES[key].palette.accent))];
