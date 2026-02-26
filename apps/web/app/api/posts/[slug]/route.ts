import { getPostBySlug, updatePost, deletePost } from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(post);
}

export async function PUT(request: Request, { params }: Params) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { slug } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const updates = { ...body };
  if (typeof body.content === "string") {
    updates.html = await compileMarkdown(body.content);
    updates.readingTime = calculateReadingTime(body.content);
  }

  const post = await updatePost(slug, updates as Parameters<typeof updatePost>[1]);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(post);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { slug } = await params;
  const deleted = await deletePost(slug);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
