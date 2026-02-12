import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Section {
  href: string;
  label: string;
  desc: string;
}

export function EditorialGrid({ sections }: { sections: Section[] }) {
  return (
    <section className="pb-24">
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Explore
        </p>
        <div className="mt-3 h-px bg-border/60" />
      </ScrollReveal>

      <div className="mt-0 grid sm:grid-cols-2">
        {sections.map((section, i) => (
          <ScrollReveal key={section.href} delay={i * 0.08}>
            <Link
              href={section.href}
              className="group flex flex-col border-b border-border/60 p-8 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary sm:even:border-l"
            >
              <h3 className="font-heading text-lg font-semibold tracking-[-0.01em]">
                {section.label}
                <span className="ml-2 inline-block text-text-muted transition-transform duration-500 group-hover:translate-x-1">
                  &rarr;
                </span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {section.desc}
              </p>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
