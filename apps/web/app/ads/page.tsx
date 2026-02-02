import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Ads",
  description: "Landing page experiments",
};

const FEATURES = [
  {
    title: "Speed",
    desc: "Ultra-fast page loading with Next.js SSG",
  },
  {
    title: "Responsive",
    desc: "Perfect experience on every device",
  },
  {
    title: "Minimal",
    desc: "Clean design focused on what matters",
  },
];

export default function AdsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <ScrollReveal>
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Landing Page Template
          </p>
          <h1 className="mt-6 font-heading text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.1] tracking-[-0.03em]">
            Turn your ideas
            <br />
            into reality
          </h1>
          <p className="mx-auto mt-6 max-w-md text-text-secondary leading-relaxed">
            Reach your customers with a fast and beautiful website. Start now.
          </p>
          <div className="mt-10">
            <button className="border-b border-text pb-1 text-sm font-medium tracking-wide text-text transition-opacity hover:opacity-50">
              Get Started
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <ScrollReveal>
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Features
          </p>
          <div className="mt-3 h-px bg-border/60" />
        </ScrollReveal>

        <div className="mt-0 grid sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.1}>
              <div className="border-b border-border/60 p-8 sm:even:border-x sm:[&:nth-child(3)]:border-l-0">
                <h3 className="font-heading text-lg font-semibold tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {feature.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <ScrollReveal>
          <h2 className="font-heading text-3xl font-bold tracking-[-0.03em]">
            Ready?
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Start your prototype now.
          </p>
          <div className="mt-8">
            <button className="border-b border-text pb-1 text-sm font-medium tracking-wide text-text transition-opacity hover:opacity-50">
              Begin
            </button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
