import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS } from "@/lib/constants";
import { UIIcon } from "@/components/ui/icons";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const JsonFormatter = dynamic(() =>
  import("@/components/tools/json-formatter").then((m) => m.JsonFormatter),
);
const Base64Tool = dynamic(() =>
  import("@/components/tools/base64-tool").then((m) => m.Base64Tool),
);
const ColorPalette = dynamic(() =>
  import("@/components/tools/color-palette").then((m) => m.ColorPalette),
);
const SortVisualizer = dynamic(() =>
  import("@/components/tools/sort-visualizer").then((m) => m.SortVisualizer),
);

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "json-formatter": JsonFormatter,
  base64: Base64Tool,
  "color-palette": ColorPalette,
  "sort-visualizer": SortVisualizer,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    openGraph: {
      title: `${tool.title} | NeedCash`,
      description: tool.description,
      url: `/tools/${slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const ToolComponent = TOOL_COMPONENTS[slug];
  if (!ToolComponent) notFound();

  return (
    <div className="mx-auto max-w-4xl px-8 py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "홈", href: "/" },
          { name: "도구", href: "/tools" },
          { name: tool.title, href: `/tools/${slug}` },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "도구", href: "/tools" },
          { label: tool.title },
        ]}
      />

      <div className="mt-10 text-center">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Tool
        </p>
        <span className="mt-4 inline-block">
          <UIIcon icon={tool.icon} className="h-10 w-10" />
        </span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em]">
          {tool.title}
        </h1>
        <p className="mt-2 text-text-secondary">{tool.description}</p>
        <div className="mx-auto mt-6 h-px max-w-xs bg-border/60" />
      </div>

      <div className="mt-12">
        <ToolComponent />
      </div>
    </div>
  );
}
