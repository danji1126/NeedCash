import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export function EditorialHero() {
  return (
    <section className="flex min-h-[85vh] flex-col justify-center">
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Prototype Hub
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h1 className="mt-6 font-heading text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.1] tracking-[-0.03em]">
          Everything is possible
          <br />
          <span className="text-text-muted">with Prototyping</span>
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={0.2}>
        <p className="mt-8 max-w-lg text-text-secondary leading-relaxed">
          {SITE.description}
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.3}>
        <div className="mt-10 flex gap-4">
          <Link
            href="/blog"
            className="border-b border-text pb-1 text-sm font-medium tracking-wide text-text transition-opacity hover:opacity-50"
          >
            Read Blog
          </Link>
          <Link
            href="/game"
            className="border-b border-text-muted pb-1 text-sm tracking-wide text-text-secondary transition-opacity hover:opacity-50"
          >
            Play Games
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
