import Link from "next/link";
import { SITE } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="h-px bg-border/40" />
        <div className="flex items-center justify-between py-8">
          <p className="text-[13px] tracking-wide text-text-muted">
            &copy; {new Date().getFullYear()} {SITE.name}
          </p>
          <nav className="flex gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] tracking-wide text-text-muted transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
