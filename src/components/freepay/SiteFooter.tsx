import { Github, Zap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-muted mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <span className="text-muted-foreground text-sm">FreePay • Zero-Fee UPI Gateway</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-subtle-foreground hover:text-foreground text-sm transition-colors"
          >
            <Github size={14} />
            <span>GitHub</span>
          </a>
          <span className="text-faint-foreground text-xs">
            Built with ❤️ • No gateway fees ever
          </span>
        </div>
      </div>
    </footer>
  );
}
