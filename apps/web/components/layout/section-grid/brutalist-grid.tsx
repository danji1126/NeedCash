import Link from "next/link";

interface Section {
  href: string;
  label: string;
  desc: string;
}

export function BrutalistGrid({ sections }: { sections: Section[] }) {
  return (
    <section>
      <div className="border-b border-border px-6 py-3">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          === Explore ===
        </p>
      </div>
      <div className="grid sm:grid-cols-2">
        {sections.map((section, i) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex flex-col border-b-2 border-border p-6 transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:text-bg sm:even:border-l-2"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted group-hover:text-bg/70">
              {String(i + 1).padStart(3, "0")} {"//"}
            </p>
            <h3 className="mt-2 font-mono text-lg font-bold uppercase">
              {section.label}
            </h3>
            <p className="mt-1 font-mono text-xs text-text-secondary group-hover:text-bg/80">
              {section.desc}
            </p>
            <span className="mt-4 font-mono text-lg text-accent group-hover:text-bg">
              [-&gt;]
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
