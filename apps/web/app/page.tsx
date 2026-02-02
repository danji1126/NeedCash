import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";
import { getAllPosts } from "@/lib/mdx";

const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/ads", label: "Ads", desc: "Landing page experiments" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
];

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-8">
      {/* Hero */}
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

      {/* Section cards */}
      <section className="pb-24">
        <ScrollReveal>
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Explore
          </p>
          <div className="mt-3 h-px bg-border/60" />
        </ScrollReveal>

        <div className="mt-0 grid sm:grid-cols-2">
          {SECTIONS.map((section, i) => (
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

      {/* Latest Blog */}
      {recentPosts.length > 0 && (
        <section className="pb-24">
          <ScrollReveal>
            <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
              Latest Posts
            </p>
            <div className="mt-3 h-px bg-border/60" />
          </ScrollReveal>

          <div className="mt-0">
            {recentPosts.map((post, i) => (
              <ScrollReveal key={post.slug} delay={i * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex items-baseline justify-between border-b border-border/60 py-6 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary hover:px-4"
                >
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-semibold tracking-[-0.01em]">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                      {post.description}
                    </p>
                  </div>
                  <time className="ml-8 shrink-0 text-[13px] text-text-muted">
                    {post.date}
                  </time>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
