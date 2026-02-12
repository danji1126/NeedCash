import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

export function BentoPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <ScrollReveal>
      <div className="col-span-full rounded-[20px] border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">Latest Posts</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[14px] bg-bg p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold">{post.title}</h3>
              {post.description && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                  {post.description}
                </p>
              )}
              <time className="mt-2 block text-[11px] text-text-muted">
                {post.date}
              </time>
            </Link>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
