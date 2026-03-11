import type { Metadata } from "next";
import { RESUME } from "@/lib/constants";
import { RESUME_LABELS } from "@/lib/i18n/resume-labels";
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from "@/lib/i18n/languages";
import { ResumeContent } from "@/components/resume/resume-content";
import { PersonJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Resume",
  description: "Interactive curriculum vitae",
  openGraph: {
    title: "Resume | NeedCash",
    description: "Interactive curriculum vitae",
    url: "/resume",
  },
  alternates: {
    languages: {
      ...Object.fromEntries(
        SUPPORTED_LANGUAGES.map((l) => [
          l,
          l === DEFAULT_LANG ? "/resume" : `/resume/${l}`,
        ]),
      ),
      "x-default": "/resume",
    },
  },
};

export default function ResumePage() {
  return (
    <>
      <PersonJsonLd
        name={RESUME.name}
        jobTitle={RESUME.title}
        description={RESUME.bio}
        url="https://needcash-hub.danji1126.workers.dev/resume"
      />
      <ResumeContent
        resume={RESUME}
        labels={RESUME_LABELS.ko}
        lang="ko"
      />
    </>
  );
}
