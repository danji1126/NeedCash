"use client";

import Link from "next/link";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  type Lang,
} from "@/lib/i18n/languages";

interface LanguageSwitcherProps {
  currentLang: Lang;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-1.5">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const meta = LANGUAGE_META[lang];
        const isActive = currentLang === lang;
        const href = lang === "ko" ? "/resume" : `/resume/${lang}`;

        return (
          <Link
            key={lang}
            href={href}
            className={`rounded-sm px-2.5 py-1 text-[13px] transition-opacity hover:opacity-70 ${
              isActive
                ? "bg-text text-bg font-medium"
                : "text-text-muted"
            }`}
          >
            {meta.flag} {meta.nativeName}
          </Link>
        );
      })}
    </div>
  );
}
