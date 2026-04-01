"use client";

import { Globe, Mail, Send, AtSign } from "lucide-react";
import { SectionReveal } from "./section-reveal";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SocialLink {
  icon: LucideIcon;
  href: string;
  label: string;
}

const socialLinks: SocialLink[] = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: Send, href: "#", label: "Social" },
  { icon: AtSign, href: "#", label: "Profile" },
];

export function ContactSection() {
  return (
    <section
      id="contact"
      className="py-24 md:py-32 px-6 md:px-16 lg:px-24 flex flex-col items-center text-center"
    >
      <SectionReveal>
        <div className="flex flex-col items-center">
          <span className="font-mono text-xs text-primary tracking-[0.3em]">
            05
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Contact
          </p>
        </div>
      </SectionReveal>

      {/* Decorative line */}
      <SectionReveal delay={0.1}>
        <div className="w-12 h-px bg-primary mt-10" />
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mt-8 tracking-tight">
          Get in Touch<span className="text-primary">.</span>
        </h2>
      </SectionReveal>

      <SectionReveal delay={0.2}>
        <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
          Interested in working together or just want to say hello? Feel free to
          reach out.
        </p>
      </SectionReveal>

      {/* Email */}
      <SectionReveal delay={0.25}>
        <a
          href="mailto:gordon@confero.jp"
          className="group inline-flex items-center gap-2 font-mono text-sm mt-8 text-muted-foreground hover:text-primary transition-colors duration-300"
        >
          <Mail className="size-4" />
          gordon@confero.jp
        </a>
      </SectionReveal>

      {/* Social links */}
      <SectionReveal delay={0.3}>
        <div className="flex items-center gap-4 mt-8">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={cn(
                "size-10 rounded-full border border-border/50 flex items-center justify-center",
                "text-muted-foreground transition-all duration-300",
                "hover:border-primary/50 hover:text-primary hover:bg-primary/5"
              )}
            >
              <link.icon className="size-4" />
            </a>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
