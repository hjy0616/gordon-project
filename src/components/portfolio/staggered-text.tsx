"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface StaggeredTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  staggerDelay?: number;
  highlight?: string;
}

const containerVariants = (stagger: number) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: stagger,
    },
  },
});

const wordVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export function StaggeredText({
  text,
  className,
  as: Tag = "h1",
  staggerDelay = 0.08,
  highlight,
}: StaggeredTextProps) {
  const prefersReduced = useReducedMotion();
  const words = text.split(" ");
  const variants = prefersReduced ? reducedVariants : wordVariants;

  return (
    <Tag className={cn("flex flex-wrap", className)}>
      <motion.span
        className="flex flex-wrap"
        variants={containerVariants(staggerDelay)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={variants}
            className={cn(
              "inline-block mr-[0.3em]",
              highlight && word.includes(highlight) && "text-primary"
            )}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
