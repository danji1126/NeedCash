export const SUPPORTED_LANGUAGES = ["ko", "en", "th", "vi", "ja"] as const;
export type Lang = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANG: Lang = "ko";

export const LANGUAGE_META: Record<
  Lang,
  { name: string; nativeName: string }
> = {
  ko: { name: "Korean", nativeName: "한국어" },
  en: { name: "English", nativeName: "English" },
  th: { name: "Thai", nativeName: "ไทย" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt" },
  ja: { name: "Japanese", nativeName: "日本語" },
};
