// Nos testes não há o compilador do Next: cada letra devolve só o nome da variável CSS.
type Options = { variable?: string };

function font(options: Options = {}) {
  return { className: "", variable: options.variable ?? "", style: { fontFamily: "system-ui" } };
}

export const Oswald = font;
export const Playfair_Display = font;
export const Fraunces = font;
export const DM_Serif_Display = font;
export const Nunito = font;
export const Inter = font;
export const Geist = font;
export const Geist_Mono = font;
