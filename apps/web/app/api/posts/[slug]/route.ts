import {
  getPostBySlug,
  getPostBySlugAdmin,
  updatePost,
  deletePost,
} from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
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
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    const { slug } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const updates = { ...body };
    if (typeof body.content === "string") {
      updates.html = await compileMarkdown(body.content);
      updates.readingTime = calculateReadingTime(body.content);
    }

    const post = await updatePost(slug, updates as Parameters<typeof updatePost>[1]);
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(post);
  } catch (error) {
    console.error("[PUT /api/posts/[slug]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
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
