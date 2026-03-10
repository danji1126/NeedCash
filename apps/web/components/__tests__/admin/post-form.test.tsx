// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "@/components/admin/post-form";

// Mock MarkdownEditor
vi.mock("@/components/admin/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
    showPreview: boolean;
  }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock auth-provider
const mockApiKey = "test-api-key";
vi.mock("@/components/admin/auth-provider", () => ({
  useAuth: () => ({ apiKey: mockApiKey, isAuthenticated: true }),
}));

// Capture router.push calls
const mockPush = vi.fn();
vi.mock("next/navigation", async () => {
  return {
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/admin/blog/new",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

function mockFetch(response: object, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
}

// Helper: labels lack htmlFor, so find inputs by nearby label text
function getInputByLabel(labelText: string): HTMLInputElement {
  const label = screen.getByText((_content, el) => {
    return el?.tagName === "LABEL" && !!el.textContent?.includes(labelText);
  });
  const container = label.parentElement!;
  return container.querySelector("input, textarea") as HTMLInputElement;
}

const editInitial = {
  title: "Existing Post",
  slug: "existing-post",
  description: "A test post",
  date: "2025-01-01",
  category: "dev",
  tags: ["test", "vitest"],
  published: true,
  content: "# Hello World",
};

describe("PostForm", () => {
  beforeEach(() => {
    global.fetch = mockFetch({ success: true });
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("create 모드에서 빈 폼을 렌더링한다", () => {
    render(<PostForm mode="create" />);
    expect(getInputByLabel("Title")).toHaveValue("");
    expect(getInputByLabel("Slug")).toHaveValue("");
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Save as Draft")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("edit 모드에서 initial 데이터를 채워서 렌더링한다", () => {
    render(<PostForm mode="edit" initial={editInitial} />);
    expect(getInputByLabel("Title")).toHaveValue("Existing Post");
    expect(getInputByLabel("Slug")).toHaveValue("existing-post");
    expect(getInputByLabel("Description")).toHaveValue("A test post");
  });

  it("create 모드에서 title 입력 시 slug가 자동 생성된다", async () => {
    const user = userEvent.setup();
    render(<PostForm mode="create" />);

    await user.type(getInputByLabel("Title"), "Hello World");

    expect(getInputByLabel("Slug")).toHaveValue("hello-world");
  });

  it("create 모드에서 (auto) 버튼이 표시된다", () => {
    render(<PostForm mode="create" />);
    expect(screen.getByText("(auto)")).toBeInTheDocument();
  });

  it("edit 모드에서 (auto) 버튼이 표시되지 않는다", () => {
    render(<PostForm mode="edit" initial={editInitial} />);
    expect(screen.queryByText("(auto)")).not.toBeInTheDocument();
    expect(screen.queryByText("(manual)")).not.toBeInTheDocument();
  });

  it("slug를 직접 수정하면 autoSlug가 비활성화된다", async () => {
    const user = userEvent.setup();
    render(<PostForm mode="create" />);

    const slugInput = getInputByLabel("Slug");
    await user.type(slugInput, "custom-slug");

    expect(screen.getByText("(manual)")).toBeInTheDocument();

    // title 입력해도 slug가 변경되지 않아야 함
    await user.type(getInputByLabel("Title"), "New Title");
    expect(slugInput).toHaveValue("custom-slug");
  });

  it("Publish 버튼 클릭 시 published=true로 API를 호출한다", async () => {
    global.fetch = mockFetch({ success: true });
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/posts",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    const callBody = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(callBody.published).toBe(true);
  });

  it("Save as Draft 클릭 시 published=false로 API를 호출한다", async () => {
    global.fetch = mockFetch({ success: true });
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Save as Draft"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const callBody = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(callBody.published).toBe(false);
  });

  it("edit 모드에서 PUT 메서드로 API를 호출한다", async () => {
    global.fetch = mockFetch({ success: true });
    render(<PostForm mode="edit" initial={editInitial} />);

    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/posts/${editInitial.slug}`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("저장 성공 시 /admin/blog로 이동한다", async () => {
    global.fetch = mockFetch({ success: true });
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/blog");
    });
  });

  it("API 에러 시 에러 메시지를 표시한다", async () => {
    global.fetch = mockFetch({ error: "Slug already exists" }, 400);
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(screen.getByText("Slug already exists")).toBeInTheDocument();
    });
  });

  it("네트워크 에러 시 'Network error'를 표시한다", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("Cancel 버튼 클릭 시 /admin/blog로 이동한다", () => {
    render(<PostForm mode="create" />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockPush).toHaveBeenCalledWith("/admin/blog");
  });
});
