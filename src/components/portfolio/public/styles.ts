// Paleta da montra pública: a mesma do painel, mas fixa (não muda com o tema escuro do painel).
// Fundo #F7F7F4, superfícies brancas, texto #20211F, secundário #6C6E67, verde sálvia,
// dourado só em detalhes e bordas #EAEAE5. O verde do texto é um tom abaixo, para AA.
export const pf = {
  page: "bg-[#F7F7F4] text-[#20211F]",
  surface: "bg-white",
  muted: "text-[#6C6E67]",
  border: "border-[#EAEAE5]",
  accentText: "text-[#4E6350]",
  accentBg: "bg-[#647B63]",
  accentSoft: "bg-[#647B63]/10",
  gold: "#C5A46D",
  card: "rounded-2xl border border-[#EAEAE5] bg-white shadow-[0_1px_2px_rgba(32,33,31,0.04),0_12px_32px_-24px_rgba(32,33,31,0.22)]",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#647B63]",
  container: "mx-auto w-full max-w-6xl px-5 sm:px-8",
  eyebrow: "text-12 font-semibold tracking-[0.14em] text-[#4E6350] uppercase",
  h2: "text-32 leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-44",
  primary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5A7059] px-6 text-15 font-semibold text-white shadow-[0_8px_24px_-12px_rgba(100,123,99,0.8)] transition-[background-color,transform] duration-300 hover:bg-[#4E6350] motion-safe:hover:-translate-y-0.5",
  secondary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D9D9D2] bg-white px-6 text-15 font-semibold text-[#20211F] transition-colors duration-300 hover:border-[#647B63] hover:text-[#4E6350]",
  input:
    "min-h-11 w-full rounded-xl border border-[#8B8D85] bg-white px-3.5 text-15 text-[#20211F] placeholder:text-[#8B8D85] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#647B63]",
  chip: "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-14 font-medium transition-colors duration-200",
  chipOff: "border-[#EAEAE5] bg-white text-[#20211F] hover:border-[#647B63]",
  chipOn: "border-[#5A7059] bg-[#5A7059] text-white",
  section: "scroll-mt-20 py-20 sm:py-24",
} as const;
