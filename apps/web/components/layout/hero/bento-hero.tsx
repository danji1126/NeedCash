import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export function BentoHero() {
  return (
    <ScrollReveal>
      <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[20px] border border-card-border bg-card-bg p-8 md:p-10">
        <div>
          <p className="text-sm font-medium text-accent">Prototype Hub</p>
          <h1 className="mt-4 font-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.15] tracking-[-0.02em]">
            Everything is possible
            <br />
            <span className="text-text-muted">with Prototyping</span>
          </h1>
          <p className="mt-4 max-w-md text-text-secondary leading-relaxed">
            {SITE.description}
          </p>
        </div>
        <div className="mt-8 flex gap-3">
          <Link
            href="/blog"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            Read Blog
          </Link>
          <Link
            href="/game"
            className="rounded-full bg-bg-secondary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Play Games
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}
