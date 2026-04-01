"use client";

import { motion, useReducedMotion } from "motion/react";
import { StaggeredText } from "./staggered-text";
import { HeroGlobe } from "./hero-globe";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative min-h-svh flex flex-col justify-end pb-20 md:pb-28 px-6 md:px-16 lg:px-24 overflow-hidden">
      {/* 3D Globe background */}
      <HeroGlobe />

      {/* Bottom fade for text readability */}
      <div className="absolute inset-0 -z-[5] bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Section indicator */}
      <motion.span
        initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="font-mono text-xs text-primary tracking-[0.3em] mb-6"
      >
        01
      </motion.span>

      {/* Main title */}
      <StaggeredText
        text="gordon."
        className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-serif leading-[0.9] tracking-tight [&_.text-primary]:text-primary"
        staggerDelay={0.1}
      />

      {/* Subtitle */}
      <motion.p
        initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
      >
        Building chains with code. Connecting economies through chains.
      </motion.p>

      {/* Decorative orange line */}
      <motion.div
        initial={prefersReduced ? {} : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-8 h-px w-24 bg-primary origin-left"
      />

      {/* Scroll indicator */}
      <motion.div
        initial={prefersReduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Scroll
        </span>
        <motion.div
          animate={prefersReduced ? {} : { y: [0, 6, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}
