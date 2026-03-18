export const SITE = {
  name: "NeedCash",
  description: "프로토타입 허브 - 게임, 블로그, 이력서를 하나의 공간에서.",
  url: "https://needcash-hub.danji1126.workers.dev",
} as const;

export const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/game", label: "Game" },
  { href: "/tools", label: "Tools" },
  { href: "/resume", label: "Resume" },
] as const;

export const FOOTER_SECTIONS = [
  {
    title: "콘텐츠",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/game", label: "Game" },
      { href: "/tools", label: "Tools" },
      { href: "/resume", label: "Resume" },
    ],
  },
  {
    title: "게임",
    links: [
      { href: "/game/dice", label: "Dice Roller" },
      { href: "/game/lotto", label: "Lotto Pick" },
      { href: "/game/animal-face", label: "동물상 찾기" },
      { href: "/game/reaction", label: "Reaction Test" },
      { href: "/game/color-sense", label: "Color Sense" },
      { href: "/game/color-memory", label: "Color Memory" },
      { href: "/game/typing", label: "Typing Speed" },
      { href: "/game/math", label: "Math Game" },
      { href: "/game/quiz", label: "Personality Quiz" },
      { href: "/game/crocodile", label: "Crocodile Roulette" },
    ],
  },
  {
    title: "도구",
    links: [
      { href: "/tools/json-formatter", label: "JSON Formatter" },
      { href: "/tools/base64", label: "Base64" },
      { href: "/tools/color-palette", label: "Color Palette" },
      { href: "/tools/sort-visualizer", label: "Sort Visualizer" },
    ],
  },
  {
    title: "정보",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/admin", label: "Admin" },
    ],
  },
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
  {
    slug: "typing",
    title: "Typing Speed",
    description: "60초 동안 얼마나 빠르게 타이핑할 수 있을까요?",
    icon: "keyboard",
  },
  {
    slug: "math",
    title: "Math Game",
    description: "60초 암산 챌린지! 당신의 계산 속도는?",
    icon: "calculator",
  },
  {
    slug: "quiz",
    title: "Personality Quiz",
    description: "15개 질문으로 알아보는 나의 성격 유형은?",
    icon: "sparkles",
  },
  {
    slug: "crocodile",
    title: "Crocodile Roulette",
    description: "친구들과 돌아가며 악어 이빨을 눌러보세요! 물리면 즉시 패배!",
    icon: "crocodile",
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

// ── 도구 데이터 ──

export interface Tool {
  slug: string;
  title: string;
  description: string;
  icon: UIIconType;
  relatedBlog?: string;
}

export const TOOLS: Tool[] = [
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "JSON 데이터를 포맷, 검증, 압축하는 도구",
    icon: "braces",
  },
  {
    slug: "base64",
    title: "Base64 Encoder/Decoder",
    description: "텍스트를 Base64로 인코딩/디코딩",
    icon: "code",
  },
  {
    slug: "color-palette",
    title: "Color Palette",
    description: "HSL 기반 색상 팔레트 생성기",
    icon: "palette",
  },
  {
    slug: "sort-visualizer",
    title: "Sort Visualizer",
    description: "정렬 알고리즘 시각화 (버블/퀵/병합)",
    icon: "chart-bar",
  },
];
