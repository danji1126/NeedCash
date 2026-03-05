import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/constants";
import { UIIcon } from "@/components/ui/icons";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Developer Tools",
  description: "개발자를 위한 무료 온라인 유틸리티 도구 모음",
  openGraph: {
    title: "Developer Tools | NeedCash",
    description: "개발자를 위한 무료 온라인 유틸리티 도구 모음",
    url: "/tools",
  },
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "홈", href: "/" },
          { name: "도구", href: "/tools" },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "도구" },
        ]}
      />

      <div className="mt-10 text-center">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Developer Tools
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em]">
          개발자 도구
        </h1>
        <p className="mt-2 text-text-secondary">
          무료 온라인 유틸리티 도구 모음
        </p>
        <div className="mx-auto mt-6 h-px max-w-xs bg-border/60" />
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group flex flex-col gap-3 border border-border/60 p-6 transition-colors hover:bg-surface-hover"
          >
            <UIIcon
              icon={tool.icon}
              className="h-8 w-8 text-text-muted transition-colors group-hover:text-text-primary"
            />
            <h2 className="font-heading text-lg font-bold tracking-[-0.02em]">
              {tool.title}
            </h2>
            <p className="text-sm text-text-secondary">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
