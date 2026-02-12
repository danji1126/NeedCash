"use client";

import { useContext } from "react";
import { DesignContext, type DesignContextValue } from "@/components/design/design-provider";

export function useDesign(): DesignContextValue {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}
