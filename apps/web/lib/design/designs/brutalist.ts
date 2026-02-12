import type { DesignConfig } from "../index";

export const brutalistDesign: DesignConfig = {
  id: "brutalist",
  name: "브루탈리스트",
  description: "모노스페이스와 날것의 에너지",
  defaultTheme: "brutal-terminal",
  themes: [
    { id: "brutal-terminal", name: "터미널", preview: "#0A0E0A" },
    { id: "brutal-paper", name: "페이퍼", preview: "#FFFFFF" },
    { id: "brutal-warning", name: "워닝", preview: "#0A0A0A" },
    { id: "brutal-blueprint", name: "블루프린트", preview: "#0A1628" },
  ],
};
