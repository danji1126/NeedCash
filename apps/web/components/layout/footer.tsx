import { SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="h-px bg-border/40" />
        <div className="flex items-center justify-between py-8">
          <p className="text-[13px] tracking-wide text-text-muted">
            &copy; {new Date().getFullYear()} {SITE.name}
          </p>
          <p className="text-[13px] tracking-wide text-text-muted">
            Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
