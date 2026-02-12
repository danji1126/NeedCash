import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Section {
  href: string;
  label: string;
  desc: string;
}

export function BentoGrid({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => (
        <ScrollReveal key={section.href} delay={i * 0.08}>
          <Link
            href={section.href}
            className="group flex flex-col justify-between rounded-[20px] border border-card-border bg-card-bg p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div>
              <div className="mb-3 h-2 w-2 rounded-full bg-accent" />
              <h3 className="font-heading text-lg font-semibold tracking-[-0.01em]">
                {section.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {section.desc}
              </p>
            </div>
            <div className="mt-6 flex h-9 w-9 items-center justify-center rounded-full bg-bg-secondary text-text-muted transition-colors group-hover:bg-accent group-hover:text-bg">
              &rarr;
            </div>
          </Link>
        </ScrollReveal>
      ))}
    </>
  );
}
