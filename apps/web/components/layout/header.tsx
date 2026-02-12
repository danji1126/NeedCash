"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialHeader } from "./header/editorial-header";
import { BentoHeader } from "./header/bento-header";
import { BrutalistHeader } from "./header/brutalist-header";
import { GlassHeader } from "./header/glass-header";

export function Header() {
  const { design } = useDesign();

  switch (design) {
    case "bento":
      return <BentoHeader />;
    case "brutalist":
      return <BrutalistHeader />;
    case "glass":
      return <GlassHeader />;
    default:
      return <EditorialHeader />;
  }
}
