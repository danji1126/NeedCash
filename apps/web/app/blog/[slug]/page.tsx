import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { getAllPosts, getPostBySlug, extractHeadings } from "@/lib/mdx";
import { mdxComponents } from "@/components/blog/mdx-components";
import { TableOfContents } from "@/components/blog/toc";
import { MobileToc } from "@/components/blog/mobile-toc";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RelatedPosts } from "@/components/blog/related-posts";
import { AuthorProfile } from "@/components/blog/author-profile";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
      url: `/blog/${slug}`,
      tags: post.meta.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-4xl px-8 py-20">
      <ArticleJsonLd
        title={post.meta.title}
        description={post.meta.description}
        url={`/blog/${slug}`}
        datePublished={post.meta.date}
        tags={post.meta.tags}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", href: "/" },
          { name: "블로그", href: "/blog" },
          { name: post.meta.title, href: `/blog/${slug}` },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "블로그", href: "/blog" },
          { label: post.meta.title },
        ]}
      />

      <header className="mt-10">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Article
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          {post.meta.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-text-muted">
          <time>{post.meta.date}</time>
          {post.meta.updatedAt && (
            <>
              <span>&middot;</span>
              <time>(수정: {post.meta.updatedAt})</time>
            </>
          )}
          <span>&middot;</span>
          <span>{post.meta.readingTime} min read</span>
        </div>
        <div className="mt-3 flex gap-2">
          {post.meta.tags.map((tag: string) => (
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
        <div className="prose-custom">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                rehypePlugins: [
                  [rehypePrettyCode, { theme: "github-dark", keepBackground: true }],
                ],
              },
            }}
          />
        </div>
        <aside className="hidden lg:block">
          <TableOfContents headings={extractHeadings(post.content)} />
        </aside>
      </div>

      <AuthorProfile />
      <RelatedPosts currentSlug={slug} category={post.meta.category} />
    </article>
  );
}
