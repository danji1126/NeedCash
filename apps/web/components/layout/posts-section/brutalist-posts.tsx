import Link from "next/link";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

export function BrutalistPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <div className="border-b border-border px-6 py-3">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          === Latest Posts ===
        </p>
      </div>
      <div>
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-center justify-between border-b border-border px-6 py-4 transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:text-bg"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted group-hover:text-bg/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-mono text-sm font-medium uppercase">
                {post.title}
              </h3>
            </div>
            <time className="font-mono text-[11px] text-text-muted group-hover:text-bg/70">
              {post.date}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}
