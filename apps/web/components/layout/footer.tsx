"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialFooter } from "./footer/editorial-footer";
import { BentoFooter } from "./footer/bento-footer";
import { BrutalistFooter } from "./footer/brutalist-footer";
import { GlassFooter } from "./footer/glass-footer";

export function Footer() {
  const { design } = useDesign();

  switch (design) {
    case "bento":
      return <BentoFooter />;
    case "brutalist":
      return <BrutalistFooter />;
    case "glass":
      return <GlassFooter />;
    default:
      return <EditorialFooter />;
  }
}
