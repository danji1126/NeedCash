import { SITE } from "@/lib/constants";

export function GlassFooter() {
  return (
    <footer className="py-8 text-center">
      <p className="text-[13px] font-light text-text-muted">
        &copy; {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
