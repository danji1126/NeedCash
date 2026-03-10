import { describe, it, expect } from "vitest";
import { compileMarkdown, calculateReadingTime } from "../compile-markdown";

describe("compileMarkdown", () => {
  it("기본 마크다운 변환", async () => {
    const html = await compileMarkdown("# Hello\n\nWorld");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("script 태그 제거 (XSS 방지)", async () => {
    const html = await compileMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain("<script");
  });

  it("코드 블록 하이라이팅 유지", async () => {
    const html = await compileMarkdown("```js\nconst x = 1;\n```");
    expect(html).toContain("hljs");
  });

  it("GFM 테이블 지원", async () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = await compileMarkdown(md);
    expect(html).toContain("<table");
  });

  it("XSS: onerror 속성 제거", async () => {
    const html = await compileMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });

  it("XSS: javascript: URL 제거", async () => {
    const html = await compileMarkdown("[link](javascript:void(0))");
    expect(html).not.toContain("javascript:");
  });

  it("XSS: iframe 태그 제거", async () => {
    const html = await compileMarkdown('<iframe src="http://evil.com"></iframe>');
    expect(html).not.toContain("<iframe");
  });

  it("rehype-slug: 헤딩에 id 부여", async () => {
    const html = await compileMarkdown("## Hello World");
    expect(html).toContain('id="hello-world"');
  });
});

describe("calculateReadingTime", () => {
  it("200단어 = 1분", () => expect(calculateReadingTime("word ".repeat(200))).toBe(1));
  it("400단어 = 2분", () => expect(calculateReadingTime("word ".repeat(400))).toBe(2));
  it("빈 문자열 = 1분 (최소값)", () => expect(calculateReadingTime("")).toBe(1));
  it("201단어 = 2분 (올림)", () => expect(calculateReadingTime("word ".repeat(201))).toBe(2));
});
