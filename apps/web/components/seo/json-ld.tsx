import { SITE } from "@/lib/constants";

/** JSON-LD 안전 직렬화 — </script> 시퀀스 이스케이프 */
function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ── WebSite JSON-LD (사이트 전체, SearchAction 포함) ──

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

// ── Article JSON-LD (블로그 개별) ──

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  tags?: string[];
  image?: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  tags,
  image,
}: ArticleJsonLdProps) {
  const imageUrl = image ?? `${SITE.url}/opengraph-image`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE.url}${url}`,
    datePublished,
    dateModified: dateModified || datePublished,
    image: imageUrl,
    author: {
      "@type": "Person",
      name: "NeedCash",
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    ...(tags?.length && { keywords: tags.join(", ") }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

// ── SoftwareApplication JSON-LD (게임 개별) ──

interface GameJsonLdProps {
  name: string;
  description: string;
  url: string;
}

export function GameJsonLd({ name, description, url }: GameJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE.url}${url}`,
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

// ── Person JSON-LD (이력서 페이지용) ──

interface PersonJsonLdProps {
  name: string;
  url?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
}

export function PersonJsonLd({
  name,
  url,
  jobTitle,
  description,
  sameAs,
}: PersonJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: url ?? SITE.url,
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(sameAs?.length && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

// ── BreadcrumbList JSON-LD ──

interface BreadcrumbJsonLdItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbJsonLdItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}
