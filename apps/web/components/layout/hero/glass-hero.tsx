import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export function GlassHero() {
  return (
    <ScrollReveal>
      <section className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-card-border bg-card-bg p-10 text-center backdrop-blur-xl md:p-14">
          <p className="text-sm font-medium text-accent">Prototype Hub</p>
          <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,4rem)] font-light leading-[1.2] tracking-[-0.02em]">
            Everything is possible
            <br />
            <span className="text-text-muted">with Prototyping</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-text-secondary leading-relaxed">
            {SITE.description}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/blog"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-bg shadow-[0_0_20px_var(--accent)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_var(--accent)]"
            >
              Read Blog
            </Link>
            <Link
              href="/game"
              className="rounded-full border border-card-border bg-card-bg px-6 py-2.5 text-sm text-text-secondary backdrop-blur-sm transition-colors hover:text-text"
            >
              Play Games
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
