import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  DEFAULT_LANG,
  type Lang,
} from "@/lib/i18n/languages";
import { RESUME_LABELS } from "@/lib/i18n/resume-labels";
import { getResumeByLang } from "@/lib/constants";
import { ResumeContent } from "@/components/resume/resume-content";

interface Props {
  params: Promise<{ lang: string }>;
}

const NON_DEFAULT_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (l) => l !== DEFAULT_LANG,
);

export function generateStaticParams() {
  return NON_DEFAULT_LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: langParam } = await params;
  const meta = LANGUAGE_META[langParam as Lang];
  if (!meta) return {};

  return {
    title: `Resume (${meta.nativeName})`,
    description: `Interactive curriculum vitae - ${meta.name}`,
    alternates: {
      languages: Object.fromEntries(
        SUPPORTED_LANGUAGES.map((l) => [
          l,
          l === DEFAULT_LANG ? "/resume" : `/resume/${l}`,
        ]),
      ),
    },
  };
}

export default async function ResumeByLangPage({ params }: Props) {
  const { lang: langParam } = await params;

  if (!NON_DEFAULT_LANGUAGES.includes(langParam as Lang)) {
    notFound();
  }

  const lang = langParam as Lang;
  const resume = getResumeByLang(lang);
  const labels = RESUME_LABELS[lang];

  return <ResumeContent resume={resume} labels={labels} lang={lang} />;
}
