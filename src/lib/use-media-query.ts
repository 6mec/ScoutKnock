import { useSyncExternalStore } from "react";

// Ao imprimir, o browser mede a página à largura do papel e as media queries mudam.
// O ecrã não pode mudar de forma por baixo do que se está a imprimir (o diagnóstico,
// por exemplo, desaparecia): durante a impressão fica o último valor do ecrã.
let printing = false;
const lastValue = new Map<string, boolean>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeprint", () => {
    printing = true;
  });
  window.addEventListener("afterprint", () => {
    printing = false;
  });
}

// No servidor assume que não corresponde, para o telemóvel não descarregar o que não usa.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => {
      const known = lastValue.get(query);
      if (printing && known !== undefined) return known;
      const value = window.matchMedia(query).matches;
      lastValue.set(query, value);
      return value;
    },
    () => false,
  );
}
