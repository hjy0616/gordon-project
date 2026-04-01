"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#expertise", label: "Expertise" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export function PortfolioNav() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 600], [0, 1]);
  const pointerEvents = useTransform(scrollY, (v) =>
    v > 300 ? "auto" : "none"
  );

  return (
    <motion.header
      style={{ opacity, pointerEvents }}
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 backdrop-blur-xl bg-background/80"
    >
      <div className="flex h-full items-center justify-between px-6 md:px-16">
        <Link href="/" className="shrink-0">
          <Image
            src="/logogram.svg"
            alt="GORDON"
            width={28}
            height={17}
            className="dark:invert-0"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="font-mono text-[11px] uppercase tracking-wider bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-300"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
