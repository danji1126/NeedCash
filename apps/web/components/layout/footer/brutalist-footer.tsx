import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function BrutalistFooter() {
  return (
    <footer className="border-t-[3px] border-border">
      <div className="grid gap-6 px-6 py-8 sm:grid-cols-3">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-text">
              {section.title}
            </p>
            <ul className="mt-2 space-y-1">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs uppercase tracking-wider text-text-muted transition-[background-color,color] duration-[0.05s] hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t-[3px] border-border px-6 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
