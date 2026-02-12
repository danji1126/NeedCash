import type { DesignConfig } from "../index";

export const glassDesign: DesignConfig = {
  id: "glass",
  name: "글래스",
  description: "프로스트 글래스와 몽환적 그라디언트",
  defaultTheme: "glass-aurora",
  themes: [
    { id: "glass-aurora", name: "오로라", preview: "linear-gradient(135deg,#4C1D95,#065F46)" },
    { id: "glass-frost", name: "프로스트", preview: "linear-gradient(135deg,#BFDBFE,#E0E7FF)" },
    { id: "glass-rose", name: "로즈", preview: "linear-gradient(135deg,#831843,#78350F)" },
    { id: "glass-ocean", name: "오션", preview: "linear-gradient(135deg,#164E63,#064E3B)" },
  ],
};
