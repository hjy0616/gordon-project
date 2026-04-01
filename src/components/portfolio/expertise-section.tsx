"use client";

import {
  FileCode,
  Blocks,
  Code,
  ShieldCheck,
  Server,
  Activity,
} from "lucide-react";
import { SectionReveal } from "./section-reveal";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SkillCard {
  icon: LucideIcon;
  title: string;
  description: string;
  span?: string;
}

const skills: SkillCard[] = [
  {
    icon: FileCode,
    title: "Smart Contract Development",
    description:
      "Designing and deploying secure smart contracts in Solidity and Rust across Ethereum, Solana, and Cosmos ecosystems.",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    icon: Blocks,
    title: "Blockchain Core Development",
    description:
      "Building chain infrastructure with Go and Cosmos SDK — consensus, state machines, and IBC modules.",
  },
  {
    icon: Code,
    title: "Full Stack Development",
    description:
      "TypeScript, React, Next.js, Tailwind CSS, and Zustand for modern web applications.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    description:
      "Smart contract auditing, vulnerability analysis, and secure development practices.",
    span: "md:col-span-2",
  },
  {
    icon: Server,
    title: "Backend & Infra",
    description:
      "PostgreSQL, Redis, TRPC, and AWS for scalable backend systems.",
  },
  {
    icon: Activity,
    title: "Monitoring & Observability",
    description:
      "Grafana and Prometheus for real-time system monitoring and alerting.",
  },
];

export function ExpertiseSection() {
  return (
    <section id="expertise" className="py-24 md:py-32 px-6 md:px-16 lg:px-24">
      <SectionReveal>
        <div className="text-center">
          <span className="font-mono text-xs text-primary tracking-[0.3em]">
            03
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Expertise
          </p>
        </div>
      </SectionReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-6xl mx-auto">
        {skills.map((skill, i) => (
          <SectionReveal key={skill.title} delay={i * 0.08}>
            <div
              className={cn(
                "group relative rounded-xl border border-border/50 bg-card/50 p-6 md:p-8",
                "transition-all duration-500",
                "hover:border-primary/20 hover:bg-card/80 hover:shadow-[0_0_30px_-12px] hover:shadow-primary/10",
                skill.span
              )}
            >
              <skill.icon className="size-5 text-primary mb-4 transition-transform duration-500 group-hover:scale-110" />
              <h3 className="font-serif text-lg md:text-xl">{skill.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {skill.description}
              </p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
}
