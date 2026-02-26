"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { MarkdownEditor } from "./markdown-editor";

interface PostData {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  published: boolean;
  content: string;
}

interface PostFormProps {
  initial?: PostData;
  mode: "create" | "edit";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PostForm({ initial, mode }: PostFormProps) {
  const { apiKey } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PostData>(
    initial ?? {
      title: "",
      slug: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      category: "dev",
      tags: [],
      published: true,
      content: "",
    }
  );
  const [tagInput, setTagInput] = useState(initial?.tags.join(", ") ?? "");
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const update = useCallback(
    (field: keyof PostData, value: string | boolean | string[]) => {
      setData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "title" && autoSlug) {
          next.slug = slugify(value as string);
        }
        return next;
      });
    },
    [autoSlug]
  );

  function handleTagChange(value: string) {
    setTagInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setData((prev) => ({ ...prev, tags }));
  }

  async function handleSave(published: boolean) {
    setError("");
    setSaving(true);

    const payload = { ...data, published };
    const url =
      mode === "create" ? "/api/posts" : `/api/posts/${initial?.slug}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error ?? "Save failed");
        setSaving(false);
        return;
      }

      router.push("/admin/blog");
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Title *
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Slug *
            {mode === "create" && (
              <button
                type="button"
                onClick={() => setAutoSlug(!autoSlug)}
                className="ml-2 text-xs text-text-muted"
              >
                {autoSlug ? "(auto)" : "(manual)"}
              </button>
            )}
          </label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => {
              setAutoSlug(false);
              update("slug", e.target.value);
            }}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Date</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Category
          </label>
          <input
            type="text"
            value={data.category}
            onChange={(e) => update("category", e.target.value)}
            list="categories"
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
          />
          <datalist id="categories">
            <option value="dev" />
            <option value="science" />
            <option value="life" />
            <option value="etc" />
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => handleTagChange(e.target.value)}
            placeholder="tag1, tag2"
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm text-text-secondary">Content *</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-text-muted hover:text-text"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
        <MarkdownEditor
          value={data.content}
          onChange={(v) => update("content", v)}
          showPreview={showPreview}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="rounded-lg bg-text px-6 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Publish"}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="rounded-lg border border-border px-6 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={() => router.push("/admin/blog")}
          className="rounded-lg px-6 py-2 text-sm text-text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
