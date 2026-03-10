// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostMeta } from "@/lib/db";

// Mock ScrollReveal to just render children (avoids IntersectionObserver dependency)
vi.mock("@/components/ui/scroll-reveal", () => ({
  ScrollReveal: ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const React = require("react");
    return React.createElement("div", { className }, children);
  },
}));

import { PostList } from "@/components/blog/post-list";

afterEach(() => cleanup());

function makePost(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    description: "A test post description",
    date: "2025-01-01",
    category: "Tech",
    tags: ["react", "nextjs"],
    published: true,
    readingTime: 5,
    ...overrides,
  };
}

const posts: PostMeta[] = [
  makePost({ slug: "alpha", title: "Alpha Post", category: "Tech", tags: ["react"], date: "2025-03-01", readingTime: 3 }),
  makePost({ slug: "beta", title: "Beta Post", category: "Design", tags: ["css", "ui"], date: "2025-02-01", readingTime: 7 }),
  makePost({ slug: "gamma", title: "Gamma Post", category: "Tech", tags: ["nextjs", "react"], date: "2025-01-01", readingTime: 5 }),
];

describe("PostList", () => {
  it("renders all post titles", () => {
    render(<PostList posts={posts} />);
    expect(screen.getByText("Alpha Post")).toBeInTheDocument();
    expect(screen.getByText("Beta Post")).toBeInTheDocument();
    expect(screen.getByText("Gamma Post")).toBeInTheDocument();
  });

  it("renders post dates and descriptions", () => {
    render(<PostList posts={posts} />);
    expect(screen.getByText("2025-03-01")).toBeInTheDocument();
    // All posts share the same description, so use getAllByText
    const descriptions = screen.getAllByText("A test post description");
    expect(descriptions.length).toBe(3);
  });

  it("renders category filter buttons including All", () => {
    render(<PostList posts={posts} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("#Design")).toBeInTheDocument();
    expect(screen.getByText("#Tech")).toBeInTheDocument();
  });

  it("filters posts by category", async () => {
    const user = userEvent.setup();
    render(<PostList posts={posts} />);

    await user.click(screen.getByText("#Design"));

    expect(screen.getByText("Beta Post")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Post")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Post")).not.toBeInTheDocument();
  });

  it("toggles category filter back to All when clicking All button", async () => {
    const user = userEvent.setup();
    render(<PostList posts={posts} />);

    await user.click(screen.getByText("#Design"));
    expect(screen.queryByText("Alpha Post")).not.toBeInTheDocument();

    await user.click(screen.getByText("All"));
    expect(screen.getByText("Alpha Post")).toBeInTheDocument();
    expect(screen.getByText("Beta Post")).toBeInTheDocument();
  });

  it("filters posts by tag button", async () => {
    const user = userEvent.setup();
    render(<PostList posts={posts} />);

    // Find the tag filter button (top-level, rendered as <button>)
    const tagButtons = screen.getAllByRole("button");
    const cssTagButton = tagButtons.find(
      (btn) => btn.textContent === "css",
    );
    expect(cssTagButton).toBeDefined();
    await user.click(cssTagButton!);

    expect(screen.getByText("Beta Post")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Post")).not.toBeInTheDocument();
  });

  it("shows empty message when no posts match filter", () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText("No posts found.")).toBeInTheDocument();
  });

  it("renders post links with correct href", () => {
    render(<PostList posts={posts} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/blog/alpha");
    expect(hrefs).toContain("/blog/beta");
    expect(hrefs).toContain("/blog/gamma");
  });

  it("inline tag click filters posts", async () => {
    const user = userEvent.setup();
    render(<PostList posts={posts} />);

    // Find inline tag spans (they have # prefix and are <span> elements)
    const inlineTags = screen.getAllByText("#react");
    await user.click(inlineTags[0]);

    // Should show only posts with react tag
    expect(screen.getByText("Alpha Post")).toBeInTheDocument();
    expect(screen.getByText("Gamma Post")).toBeInTheDocument();
    expect(screen.queryByText("Beta Post")).not.toBeInTheDocument();
  });

  it("clicking active tag deselects it", async () => {
    const user = userEvent.setup();
    render(<PostList posts={posts} />);

    // Click react tag button to filter
    const tagButtons = screen.getAllByRole("button");
    const reactTagBtn = tagButtons.find((btn) => btn.textContent === "react");
    await user.click(reactTagBtn!);
    expect(screen.queryByText("Beta Post")).not.toBeInTheDocument();

    // Click again to deselect
    const tagButtonsAfter = screen.getAllByRole("button");
    const reactTagBtnAfter = tagButtonsAfter.find((btn) => btn.textContent === "react");
    await user.click(reactTagBtnAfter!);
    expect(screen.getByText("Beta Post")).toBeInTheDocument();
  });

  it("displays reading time for each post", () => {
    render(<PostList posts={posts} />);
    expect(screen.getByText("3 min")).toBeInTheDocument();
    expect(screen.getByText("7 min")).toBeInTheDocument();
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });
});
