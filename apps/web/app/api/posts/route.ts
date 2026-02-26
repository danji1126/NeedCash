import { getAllPosts, createPost } from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const posts = await getAllPosts();
  return Response.json(posts);
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const body = (await request.json()) as Record<string, unknown>;
  const { title, slug, description, date, category, tags, content, published } =
    body as {
      title?: string;
      slug?: string;
      description?: string;
      date?: string;
      category?: string;
      tags?: string[];
      content?: string;
      published?: boolean;
    };

  if (!title || !slug || !content) {
    return Response.json(
      { error: "title, slug, content are required" },
      { status: 400 }
    );
  }

  const html = await compileMarkdown(content);
  const readingTime = calculateReadingTime(content);

  const post = await createPost({
    slug,
    title,
    description: description ?? "",
    date: date ?? new Date().toISOString().split("T")[0],
    category: category ?? "etc",
    tags: tags ?? [],
    published: published ?? true,
    readingTime,
    content,
    html,
  });

  return Response.json(post, { status: 201 });
}
