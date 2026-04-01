import { PortfolioNav } from "@/components/portfolio/portfolio-nav";
import { HeroSection } from "@/components/portfolio/hero-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { ExpertiseSection } from "@/components/portfolio/expertise-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { PortfolioFooter } from "@/components/portfolio/portfolio-footer";

export default function HomePage() {
  return (
    <main className="min-h-svh">
      <PortfolioNav />
      <HeroSection />
      <AboutSection />
      <ExpertiseSection />
      <ProjectsSection />
      <ContactSection />
      <PortfolioFooter />
    </main>
  );
}
