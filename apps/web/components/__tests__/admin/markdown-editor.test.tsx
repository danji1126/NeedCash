// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MarkdownEditor } from "@/components/admin/markdown-editor";

vi.mock("marked", () => ({
  marked: {
    parse: (md: string) => `<p>${md}</p>`,
  },
}));

vi.mock("dompurify", () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

describe("MarkdownEditor", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    showPreview: false,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders textarea with placeholder", () => {
    render(<MarkdownEditor {...defaultProps} />);
    expect(screen.getByPlaceholderText("Write your post in Markdown...")).toBeInTheDocument();
  });

  it("textarea displays current value", () => {
    render(<MarkdownEditor {...defaultProps} value="Hello world" />);
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
  });

  it("calls onChange when typing in textarea", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Write your post in Markdown..."), {
      target: { value: "new text" },
    });
    expect(onChange).toHaveBeenCalledWith("new text");
  });

  it("renders all toolbar buttons (Bold, Italic, Heading, Code, Link)", () => {
    render(<MarkdownEditor {...defaultProps} />);
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Italic")).toBeInTheDocument();
    expect(screen.getByTitle("Heading")).toBeInTheDocument();
    expect(screen.getByTitle("Code")).toBeInTheDocument();
    expect(screen.getByTitle("Link")).toBeInTheDocument();
  });

  it("Bold button inserts **bold text** placeholder when no selection", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your post in Markdown...") as HTMLTextAreaElement;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    fireEvent.click(screen.getByTitle("Bold"));
    expect(onChange).toHaveBeenCalledWith("**bold text**");
  });

  it("Italic button wraps selected text with underscores", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor {...defaultProps} value="hello world" onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your post in Markdown...") as HTMLTextAreaElement;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 5;

    fireEvent.click(screen.getByTitle("Italic"));
    expect(onChange).toHaveBeenCalledWith("_hello_ world");
  });

  it("Code button inserts backtick-wrapped placeholder", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your post in Markdown...") as HTMLTextAreaElement;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    fireEvent.click(screen.getByTitle("Code"));
    expect(onChange).toHaveBeenCalledWith("`code`");
  });

  it("Link button inserts markdown link syntax", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your post in Markdown...") as HTMLTextAreaElement;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    fireEvent.click(screen.getByTitle("Link"));
    expect(onChange).toHaveBeenCalledWith("[link text](url)");
  });

  it("shows preview panel when showPreview is true", () => {
    render(<MarkdownEditor {...defaultProps} value="Hello" showPreview={true} />);
    // marked.parse returns <p>Hello</p>, DOMPurify passes through
    // Both textarea and preview contain "Hello", so use getAllByText
    const elements = screen.getAllByText("Hello");
    expect(elements.length).toBeGreaterThanOrEqual(2); // textarea + preview
  });
});
