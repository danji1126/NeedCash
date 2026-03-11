import { getAllPosts, createPost } from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const posts = await getAllPosts(offset, Math.min(limit, 100));
    return Response.json(posts, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

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

    if (!SLUG_REGEX.test(slug) || slug.length > 100) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
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
  } catch (error) {
    console.error("[POST /api/posts]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
