import type { DesignConfig } from "../index";

export const editorialDesign: DesignConfig = {
  id: "editorial",
  name: "에디토리얼",
  description: "타이포그래피 중심의 매거진 스타일",
  defaultTheme: "editorial-light",
  themes: [
    { id: "editorial-light", name: "라이트", preview: "#ffffff" },
    { id: "editorial-dark", name: "다크", preview: "#0a0a0a" },
    { id: "editorial-cream", name: "크림", preview: "#FAF7F2" },
    { id: "editorial-ink", name: "잉크", preview: "#0B1929" },
  ],
};
