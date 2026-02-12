import Link from "next/link";

export function BrutalistHero() {
  return (
    <section className="border-b-[3px] border-border px-6 py-16 md:py-20">
      <h1 className="font-mono text-[clamp(2.5rem,7vw,6rem)] font-extrabold uppercase leading-[1.1] tracking-[0.05em]">
        EVERYTHING
        <br />
        IS POSSIBLE_
        <span className="inline-block w-3 animate-[blink_1s_step-end_infinite] bg-accent">
          &nbsp;
        </span>
      </h1>
      <div className="mt-8 inline-block border-2 border-border px-5 py-3">
        <Link
          href="/blog"
          className="font-mono text-sm uppercase tracking-wider text-text transition-[background-color,color] duration-[0.05s] before:content-['>_'] hover:text-accent"
        >
          Read Blog
        </Link>
        <span className="mx-4 text-text-muted">|</span>
        <Link
          href="/game"
          className="font-mono text-sm uppercase tracking-wider text-text-secondary transition-[background-color,color] duration-[0.05s] before:content-['>_'] hover:text-accent"
        >
          Play Games
        </Link>
      </div>
    </section>
  );
}
