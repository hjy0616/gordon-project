export function PortfolioFooter() {
  return (
    <footer className="border-t border-border/50 py-8 px-6 md:px-16 lg:px-24 flex flex-col sm:flex-row justify-between items-center gap-4">
      <span className="font-mono text-[11px] text-muted-foreground tracking-wider">
        &copy; {new Date().getFullYear()}
      </span>
      <a
        href="#"
        className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wider uppercase"
      >
        Back to top
      </a>
    </footer>
  );
}
