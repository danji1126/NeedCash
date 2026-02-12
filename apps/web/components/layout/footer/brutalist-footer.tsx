import Link from "next/link";
import { SITE } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function BrutalistFooter() {
  return (
    <footer className="border-t-[3px] border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
        <nav className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-wider text-text-muted transition-[background-color,color] duration-[0.05s] hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
