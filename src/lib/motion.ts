// Tokens de movimento para o Motion. Os mesmos valores estão em CSS no globals.css.
export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.6,
  entrance: 0.9,
} as const;

export const ease = {
  out: [0.2, 0.7, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

const STAGGER_SECONDS = 0.06;
const MAX_STAGGERED_ITEMS = 8;

export function staggerDelay(index: number) {
  return Math.min(index, MAX_STAGGERED_ITEMS - 1) * STAGGER_SECONDS;
}

export const entrance = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// Repõe o deslize e o desfoque: o primeiro render pode ter usado a entrada normal.
export const entranceReduced = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const revealViewport = { once: true, amount: 0.2 } as const;
