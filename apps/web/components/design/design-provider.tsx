"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  DESIGN_MAP,
  DEFAULT_DESIGN,
  DEFAULT_THEME,
  type DesignId,
  type DesignConfig,
  type ThemeConfig,
} from "@/lib/design";

const STORAGE_KEY_DESIGN = "needcash-design";
const STORAGE_KEY_THEME = "needcash-theme";

function getInitialDesign(): DesignId {
  if (typeof window === "undefined") return DEFAULT_DESIGN;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DESIGN) as DesignId | null;
    return saved && DESIGN_MAP[saved] ? saved : DEFAULT_DESIGN;
  } catch {
    return DEFAULT_DESIGN;
  }
}

function getInitialTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const savedDesign = localStorage.getItem(STORAGE_KEY_DESIGN) as DesignId | null;
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedDesign && DESIGN_MAP[savedDesign]) {
      const config = DESIGN_MAP[savedDesign];
      if (savedTheme && config.themes.some((t) => t.id === savedTheme))
        return savedTheme;
      return config.defaultTheme;
    }
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export interface DesignContextValue {
  design: DesignId;
  theme: string;
  setDesign: (id: DesignId) => void;
  setTheme: (id: string) => void;
  designConfig: DesignConfig;
  availableThemes: ThemeConfig[];
}

export const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<DesignId>(getInitialDesign);
  const [theme, setThemeState] = useState<string>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-design", design);
    document.documentElement.setAttribute("data-theme", theme);
  }, [design, theme]);

  const setDesign = useCallback((id: DesignId) => {
    setDesignState(id);
    const config = DESIGN_MAP[id];
    const newTheme = config.defaultTheme;
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_DESIGN, id);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  }, []);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY_THEME, id);
  }, []);

  const designConfig = DESIGN_MAP[design];
  const availableThemes = designConfig.themes;

  return (
    <DesignContext.Provider
      value={{ design, theme, setDesign, setTheme, designConfig, availableThemes }}
    >
      {children}
    </DesignContext.Provider>
  );
}
