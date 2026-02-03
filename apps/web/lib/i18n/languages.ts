export const SUPPORTED_LANGUAGES = ["ko", "en", "th", "vi", "ja"] as const;
export type Lang = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANG: Lang = "ko";

export const LANGUAGE_META: Record<
  Lang,
  { name: string; nativeName: string; flag: string }
> = {
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  th: { name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
};
