export const SITE = {
  name: "NeedCash",
  description: "프로토타입 허브 - 게임, 블로그, 광고, 이력서를 하나의 공간에서.",
  url: "https://needcash.dev",
} as const;

export const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/game", label: "Game" },
  { href: "/ads", label: "Ads" },
  { href: "/resume", label: "Resume" },
] as const;

// ── 게임 데이터 ──

import type { UIIconType } from "@/components/ui/icons";

export interface Game {
  slug: string;
  title: string;
  description: string;
  icon: UIIconType;
}

export const GAMES: Game[] = [
  {
    slug: "dice",
    title: "Dice Roller",
    description: "주사위 2개를 굴려 운을 시험하세요",
    icon: "dice",
  },
  {
    slug: "lotto",
    title: "Lotto Pick",
    description: "행운의 로또번호를 뽑아보세요",
    icon: "clover",
  },
  {
    slug: "animal-face",
    title: "동물상 찾기",
    description: "카메라로 셀카를 찍으면 당신의 동물상을 알려드려요",
    icon: "paw",
  },
  {
    slug: "reaction",
    title: "Reaction Test",
    description: "당신의 반응속도는 몇 ms? 지금 테스트하세요",
    icon: "bolt",
  },
  {
    slug: "color-sense",
    title: "Color Sense Test",
    description: "남들과 다른 색을 찾아보세요! 당신의 색감 능력은?",
    icon: "eye",
  },
  {
    slug: "color-memory",
    title: "Color Memory",
    description: "색상 순서를 기억하고 따라해보세요! 당신의 기억력은?",
    icon: "brain",
  },
];

// ── 이력서 데이터 ──

import type { Lang } from "./i18n/languages";
import resumeData from "@/content/resume/resume.json";
import resumeEn from "@/content/resume/resume.en.json";
import resumeTh from "@/content/resume/resume.th.json";
import resumeVi from "@/content/resume/resume.vi.json";
import resumeJa from "@/content/resume/resume.ja.json";

export interface Project {
  name: string;
  client: string;
  period: string;
  description: string;
  role: string;
  teamSize: number | null;
  techStack: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  projects?: Project[];
}

export interface Skill {
  name: string;
  level: number; // 1-5
  category: "Frontend" | "Backend" | "Database" | "Mobile" | "Tool";
}

export interface Education {
  school: string;
  degree: string;
  period: string;
}

export interface ResumeData {
  name: string;
  title: string;
  bio: string;
  experience: Experience[];
  skills: Skill[];
  education?: Education[];
  contact: {
    email?: string;
    github?: string;
    linkedin?: string;
    blog?: string;
  };
}

export const RESUME: ResumeData = resumeData as ResumeData;

const RESUME_BY_LANG: Record<Lang, ResumeData> = {
  ko: resumeData as ResumeData,
  en: resumeEn as ResumeData,
  th: resumeTh as ResumeData,
  vi: resumeVi as ResumeData,
  ja: resumeJa as ResumeData,
};

export function getResumeByLang(lang: Lang): ResumeData {
  return RESUME_BY_LANG[lang] ?? RESUME_BY_LANG.ko;
}
