import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Section {
  href: string;
  label: string;
  desc: string;
}

export function GlassGrid({ sections }: { sections: Section[] }) {
  return (
    <section className="pb-16">
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section, i) => (
          <ScrollReveal key={section.href} delay={i * 0.08}>
            <Link
              href={section.href}
              className="group flex flex-col rounded-[20px] border border-card-border bg-card-bg p-6 backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(var(--accent),0.1)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                &rarr;
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {section.label}
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
