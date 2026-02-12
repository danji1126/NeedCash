import type { DesignConfig } from "../index";

export const bentoDesign: DesignConfig = {
  id: "bento",
  name: "벤토",
  description: "Apple 스타일 모듈형 그리드",
  defaultTheme: "bento-clean",
  themes: [
    { id: "bento-clean", name: "클린", preview: "#F0F2F5" },
    { id: "bento-night", name: "나이트", preview: "#111113" },
    { id: "bento-pastel", name: "파스텔", preview: "#F0EEFA" },
    { id: "bento-sunset", name: "선셋", preview: "#FFF8F0" },
  ],
};
