import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Ensina o tailwind-merge a reconhecer a nossa escala de tokens.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "12",
        "13",
        "14",
        "16",
        "18",
        "20",
        "24",
        "32",
        "44",
        "48",
        "64",
        "84",
      ],
      radius: ["sm", "md", "lg", "pill"],
      shadow: ["float", "halo"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
