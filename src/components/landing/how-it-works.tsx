"use client";

import NumberFlow from "@number-flow/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/reveal";
import { ptPT } from "@/i18n/pt-PT";
import { LANDING_EXAMPLE } from "@/lib/radar/landing-examples";
import { duration, ease } from "@/lib/motion";
import { scoreCompany } from "@/lib/radar/score";
import { cn } from "@/lib/utils";

const copy = ptPT.landing;
const { howItWorks, screens } = copy;
const { steps } = howItWorks;
const TYPING_INTERVAL_MS = 28;

function FiltersScreen() {
  return (
    <div className="type-mono flex flex-col gap-2 text-13">
      {screens.filters.map((filter, index) => (
        <Reveal key={filter.label} index={index}>
          <div className="flex justify-between gap-4 rounded-sm border border-border bg-background px-3 py-2.5">
            <span className="text-muted">{filter.label}</span>
            <span>{filter.value}</span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function ScoreScreen({ animated }: { animated: boolean }) {
  const opportunity = scoreCompany(LANDING_EXAMPLE, "website_creation");
  const [score, setScore] = useState(animated ? 0 : opportunity.score);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setScore(opportunity.score));
    return () => cancelAnimationFrame(frame);
  }, [opportunity.score]);

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3">
      <div className="type-mono flex justify-between text-13">
        <span className="text-muted">{copy.example.company}</span>
        <span className="font-semibold text-accent">
          <span className="sr-only">{score}</span>
          <span aria-hidden="true">
            <NumberFlow value={score} />
          </span>{" "}
          / 100
        </span>
      </div>
      <Progress value={score} label={copy.example.scoreLabel} />
      <ul className="flex flex-wrap gap-1.5">
        {opportunity.reasons.map((reason, index) => (
          <li key={reason.code}>
            <Reveal index={index + 2}>
              <span className="inline-block rounded-sm border border-border px-2 py-0.5 text-12 text-muted">
                {ptPT.radar.reasons[reason.code]} +{reason.points}
              </span>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProposeScreen({ animated }: { animated: boolean }) {
  const reduced = useReducedMotion();
  const typing = animated && !reduced;
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!typing) return;
    const timer = setInterval(() => {
      setTyped((count) => {
        if (count >= screens.draftText.length) clearInterval(timer);
        return Math.min(count + 1, screens.draftText.length);
      });
    }, TYPING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [typing]);

  const window = copy.show.window;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-sm border border-border bg-background p-3 text-13">
        <p className="type-mono mb-1.5 text-12 text-amber">
          {screens.draftBadge}
        </p>
        <p className="min-h-10 leading-normal text-muted">
          {typing ? screens.draftText.slice(0, typed) : screens.draftText}
        </p>
      </div>
      <Reveal index={4}>
        <div className="rounded-sm bg-foreground p-3 text-background">
          <p className="text-12 font-bold">{window.company}</p>
          <p className="type-heading mt-2 text-20">{window.headline}</p>
        </div>
      </Reveal>
    </div>
  );
}

function StepScreen({ step, animated }: { step: number; animated: boolean }) {
  if (step === 0) return <FiltersScreen />;
  if (step === 1) return <ScoreScreen animated={animated} />;
  return <ProposeScreen animated={animated} />;
}

// Computador: o scroll conduz os três passos num único ecrã do produto.
function ScrollStory() {
  const target = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setActive(Math.min(Math.floor(progress * steps.length), steps.length - 1));
  });

  return (
    <div ref={target} className="hidden h-[300vh] lg:block">
      <div className="sticky top-0 flex min-h-dvh items-center">
        <div className="grid w-full grid-cols-2 items-center gap-18">
          <ol className="flex flex-col gap-8">
            {steps.map((step, index) => (
              <li
                key={step.title}
                aria-current={index === active ? "step" : undefined}
                className="flex gap-5"
              >
                <span
                  className={cn(
                    "type-mono text-24 transition-colors duration-(--duration-fast)",
                    index === active ? "text-accent" : "text-muted",
                  )}
                >
                  0{index + 1}
                </span>
                <div className="flex flex-col gap-2">
                  <h3
                    className={cn(
                      "type-heading text-24 transition-colors duration-(--duration-fast)",
                      index === active ? "text-foreground" : "text-muted",
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className="type-body text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div
            aria-hidden="true"
            className="flex min-h-96 flex-col gap-4 rounded-lg border border-border bg-surface p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="type-mono text-13 text-muted">
                0{active + 1} · {steps[active].title}
              </span>
              <Badge variant="amber">{screens.badge}</Badge>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.base, ease: ease.out }}
                >
                  <StepScreen step={active} animated />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCards() {
  return (
    <ol className="grid gap-4 md:grid-cols-3 lg:hidden">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal onScroll className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-lg border border-border bg-surface p-6">
              <span className="type-mono text-24 text-muted">
                0{index + 1}
              </span>
              <h3 className="type-heading text-24">{step.title}</h3>
              <p className="type-body text-muted">{step.body}</p>
              <div className="mt-auto flex flex-col gap-3">
                <div className="self-start">
                  <Badge variant="amber">{screens.badge}</Badge>
                </div>
                <StepScreen step={index} animated={false} />
              </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks() {
  return (
    <>
      <StepCards />
      <ScrollStory />
    </>
  );
}
