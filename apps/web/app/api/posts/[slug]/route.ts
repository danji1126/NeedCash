import {
  getPostBySlug,
  getPostBySlugAdmin,
  updatePost,
  deletePost,
} from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    const { slug } = await params;
    const isAdmin = await verifyAdminAuth(request);
    const post = isAdmin
      ? await getPostBySlugAdmin(slug)
      : await getPostBySlug(slug);
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(post);
  } catch (error) {
    console.error("[GET /api/posts/[slug]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    const { slug } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, description, slug: newSlug, date, category, tags, content, published } =
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

    if (newSlug !== undefined) {
      if (typeof newSlug !== "string" || !SLUG_REGEX.test(newSlug) || newSlug.length > 100) {
        return Response.json({ error: "Invalid slug format" }, { status: 400 });
      }
    }

    const updates: Partial<Parameters<typeof updatePost>[1]> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (newSlug !== undefined) updates.slug = newSlug;
    if (date !== undefined) updates.date = date;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (published !== undefined) updates.published = published;
    if (typeof content === "string") {
      updates.content = content;
      updates.html = await compileMarkdown(content);
      updates.readingTime = calculateReadingTime(content);
    }

    const post = await updatePost(slug, updates);
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(post);
  } catch (error) {
    console.error("[PUT /api/posts/[slug]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    const { slug } = await params;
    const deleted = await deletePost(slug);
    if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/posts/[slug]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
