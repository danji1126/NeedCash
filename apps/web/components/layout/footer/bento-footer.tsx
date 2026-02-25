import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function BentoFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-8 py-12">
      <div className="grid gap-8 sm:grid-cols-3">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[13px] font-semibold text-text">
              {section.title}
            </p>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-text-muted transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[13px] text-text-muted">
        &copy; {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
