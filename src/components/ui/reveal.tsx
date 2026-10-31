"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import {
  duration,
  ease,
  entrance,
  entranceReduced,
  revealViewport,
  staggerDelay,
} from "@/lib/motion";

// Entrada padrão. Com onScroll, acontece quando 20% entra no ecrã, uma vez só.
export function Reveal({
  index = 0,
  onScroll = false,
  className,
  children,
}: {
  index?: number;
  onScroll?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduced ? entranceReduced : entrance}
      initial="hidden"
      animate={onScroll ? undefined : "visible"}
      whileInView={onScroll ? "visible" : undefined}
      viewport={revealViewport}
      transition={
        reduced
          ? { duration: duration.instant }
          : {
              duration: duration.entrance,
              ease: ease.out,
              delay: staggerDelay(index),
            }
      }
    >
      {children}
    </motion.div>
  );
}
