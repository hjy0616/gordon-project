"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionReveal } from "./section-reveal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Project {
  title: string;
  description: string;
  tags: string[];
  href: string;
  featured?: boolean;
}

const projects: Project[] = [
  {
    title: "Bbanggu",
    description:
      "An online stationery store offering curated stationery products. Currently operating and managing the service.",
    tags: ["React", "TypeScript", "Full Stack"],
    href: "https://bbanggu.co.kr/",
  },
  {
    title: "Zena AI",
    description:
      "Blockchain AI SaaS platform — development and operation of AI-powered blockchain services.",
    tags: ["Blockchain", "AI", "SaaS"],
    href: "https://www.zenaai.io/",
  },
  {
    title: "Hyperledger Enterprise System",
    description:
      "Enterprise blockchain system built on Hyperledger for secure, permissioned distributed ledger operations.",
    tags: ["Hyperledger", "Blockchain", "Enterprise"],
    href: "#",
  },
  {
    title: "Zena Blockchain Core",
    description:
      "Core blockchain development and operation — custom chain architecture, consensus, and network infrastructure.",
    tags: ["Go", "Blockchain", "Core Development"],
    href: "https://scan.zenanet.io/",
  },
];

function CardWrapper({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  if (href === "#") {
    return <div className={className}>{children}</div>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <SectionReveal delay={index * 0.1}>
      <CardWrapper
        href={project.href}
        className={cn(
          "group block rounded-xl border border-border/50 overflow-hidden",
          "transition-all duration-500",
          "hover:border-primary/20 hover:shadow-[0_0_40px_-12px] hover:shadow-primary/10",
          project.featured && "md:col-span-2",
          project.href !== "#" && "cursor-pointer"
        )}
      >
        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-xl md:text-2xl">{project.title}</h3>
            {project.href !== "#" && (
              <ArrowUpRight className="size-5 text-muted-foreground shrink-0 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 bg-muted/50 rounded-md text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardWrapper>
    </SectionReveal>
  );
}

export function ProjectsSection() {
  return (
    <section id="projects" className="py-24 md:py-32 px-6 md:px-16 lg:px-24">
      <SectionReveal>
        <div className="text-center">
          <span className="font-mono text-xs text-primary tracking-[0.3em]">
            04
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Projects
          </p>
        </div>
      </SectionReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-6xl mx-auto">
        {projects.map((project, i) => (
          <ProjectCard key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
