import { editorialDesign } from "./designs/editorial";
import { bentoDesign } from "./designs/bento";
import { brutalistDesign } from "./designs/brutalist";
import { glassDesign } from "./designs/glass";

export type DesignId = "editorial" | "bento" | "brutalist" | "glass";

export interface ThemeConfig {
  id: string;
  name: string;
  preview: string;
}

export interface DesignConfig {
  id: DesignId;
  name: string;
  description: string;
  themes: ThemeConfig[];
  defaultTheme: string;
}

export const DESIGNS: DesignConfig[] = [
  editorialDesign,
  bentoDesign,
  brutalistDesign,
  glassDesign,
];

export const DESIGN_MAP: Record<DesignId, DesignConfig> = {
  editorial: editorialDesign,
  bento: bentoDesign,
  brutalist: brutalistDesign,
  glass: glassDesign,
};

export const DEFAULT_DESIGN: DesignId = "brutalist";
export const DEFAULT_THEME = "brutal-terminal";
