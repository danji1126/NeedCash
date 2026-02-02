"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      themes={["dark", "light"]}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
