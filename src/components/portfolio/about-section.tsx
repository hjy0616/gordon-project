"use client";

import Image from "next/image";
import { SectionReveal } from "./section-reveal";

export function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 px-6 md:px-16 lg:px-24">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <SectionReveal>
          <div className="text-center">
            <span className="font-mono text-xs text-primary tracking-[0.3em]">
              02
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              About
            </p>
          </div>
        </SectionReveal>

        {/* Content */}
        <div className="mt-12 max-w-3xl mx-auto space-y-10">
          <SectionReveal delay={0.1}>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
              Blockchain developer exploring the Ethereum, Solana, Ripple, and
              Cosmos ecosystems. Especially drawn to Cosmos SDK&apos;s modular
              app-chain architecture and IBC interoperability — a foundation I
              want to leverage to build a Korea-native Layer 1 blockchain.
              Passionate about both hands-on development and crypto investment.
            </p>
          </SectionReveal>

          <SectionReveal delay={0.2}>
            <p className="text-base leading-relaxed text-muted-foreground">
              I work with an owner&apos;s mindset — even when it&apos;s not my
              company. I build on Ethereum, Solana, Ripple, and Cosmos today,
              but the endgame is creating Korea&apos;s own L1 mainnet.
            </p>
          </SectionReveal>

          {/* Profile photo */}
          <SectionReveal delay={0.3}>
            <div className="w-full max-w-xs mx-auto">
              <Image
                src="/profile/80043644-90CF-423E-A1B2-C157DC90CCBA_1_105_c.png"
                alt="Profile"
                width={320}
                height={320}
                className="rounded-lg border border-border/50"
              />
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
