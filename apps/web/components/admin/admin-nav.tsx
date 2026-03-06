"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/blog", label: "블로그" },
  { href: "/admin/analytics", label: "통계" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "text-sm transition-colors",
            pathname === href || (href !== "/admin" && pathname.startsWith(href))
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
