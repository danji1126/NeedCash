import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, extractHeadings } from "@/lib/mdx";
import { TableOfContents } from "@/components/blog/toc";
import { MobileToc } from "@/components/blog/mobile-toc";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RelatedPosts } from "@/components/blog/related-posts";
import { AuthorProfile } from "@/components/blog/author-profile";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${slug}`,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-4xl px-8 py-20">
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        url={`/blog/${slug}`}
        datePublished={post.date}
        tags={post.tags}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", href: "/" },
          { name: "블로그", href: "/blog" },
          { name: post.title, href: `/blog/${slug}` },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "블로그", href: "/blog" },
          { label: post.title },
        ]}
      />

      <header className="mt-10">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Article
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-text-muted">
          <time>{post.date}</time>
          {post.updatedAt && (
            <>
              <span>&middot;</span>
              <time>(수정: {post.updatedAt})</time>
            </>
          )}
          <span>&middot;</span>
          <span>{post.readingTime} min read</span>
        </div>
        <div className="mt-3 flex gap-2">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-[13px] text-text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-6 h-px bg-border/60" />
      </header>

      {/* Mobile TOC */}
      <MobileToc headings={extractHeadings(post.content)} />

      <div className="mt-10 lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <aside className="hidden lg:block">
          <TableOfContents headings={extractHeadings(post.content)} />
        </aside>
      </div>

      <AuthorProfile />
      <RelatedPosts currentSlug={slug} category={post.category} />
    </article>
  );
}
