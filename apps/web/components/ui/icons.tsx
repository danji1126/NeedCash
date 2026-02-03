import type { Lang } from "@/lib/i18n/languages";

interface IconProps {
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 국기 아이콘
// ═══════════════════════════════════════════════════════════════════════════

interface FlagIconProps extends IconProps {
  lang: Lang;
}

export function FlagIcon({ lang, className = "w-5 h-4" }: FlagIconProps) {
  const flags: Record<Lang, React.ReactNode> = {
    ko: (
      <svg viewBox="0 0 640 480" className={className} aria-label="한국어">
        <path fill="#fff" d="M0 0h640v480H0z" />
        <g transform="translate(320 240)">
          <circle r="80" fill="#c60c30" />
          <path fill="#003478" d="M0-80a80 80 0 0 0 0 160 40 40 0 0 0 0-80 40 40 0 0 1 0-80" />
          <g fill="#000" transform="rotate(-56.3)">
            <rect x="-95" y="-125" width="10" height="50" />
            <rect x="-75" y="-125" width="10" height="50" />
            <rect x="-95" y="75" width="10" height="50" />
            <rect x="-75" y="75" width="10" height="50" />
          </g>
          <g fill="#000" transform="rotate(56.3)">
            <rect x="65" y="-125" width="10" height="20" />
            <rect x="85" y="-125" width="10" height="20" />
            <rect x="65" y="-95" width="30" height="10" />
            <rect x="65" y="-75" width="10" height="20" />
            <rect x="85" y="-75" width="10" height="20" />
            <rect x="65" y="55" width="30" height="10" />
            <rect x="65" y="75" width="10" height="20" />
            <rect x="85" y="75" width="10" height="20" />
            <rect x="65" y="105" width="10" height="20" />
            <rect x="85" y="105" width="10" height="20" />
          </g>
          <g fill="#000" transform="rotate(-56.3)">
            <rect x="65" y="-125" width="10" height="50" />
            <rect x="85" y="-125" width="10" height="50" />
            <rect x="65" y="75" width="30" height="10" />
            <rect x="65" y="95" width="10" height="30" />
            <rect x="85" y="95" width="10" height="30" />
          </g>
          <g fill="#000" transform="rotate(56.3)">
            <rect x="-95" y="-125" width="10" height="20" />
            <rect x="-75" y="-125" width="10" height="20" />
            <rect x="-95" y="-95" width="10" height="20" />
            <rect x="-75" y="-95" width="10" height="20" />
            <rect x="-95" y="-65" width="30" height="10" />
            <rect x="-95" y="55" width="30" height="10" />
            <rect x="-95" y="75" width="30" height="10" />
            <rect x="-95" y="95" width="30" height="10" />
          </g>
        </g>
      </svg>
    ),
    en: (
      <svg viewBox="0 0 640 480" className={className} aria-label="English">
        <path fill="#bd3d44" d="M0 0h640v480H0" />
        <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
        <path fill="#192f5d" d="M0 0h364.8v258.5H0" />
        <g fill="#fff">
          {[...Array(9)].map((_, row) =>
            [...Array(row % 2 === 0 ? 6 : 5)].map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={30 + col * 60 + (row % 2 === 0 ? 0 : 30)}
                cy={25 + row * 28}
                r="8"
              />
            ))
          )}
        </g>
      </svg>
    ),
    th: (
      <svg viewBox="0 0 640 480" className={className} aria-label="ไทย">
        <path fill="#a51931" d="M0 0h640v480H0z" />
        <path fill="#f4f5f8" d="M0 80h640v320H0z" />
        <path fill="#2d2a4a" d="M0 160h640v160H0z" />
      </svg>
    ),
    vi: (
      <svg viewBox="0 0 640 480" className={className} aria-label="Tiếng Việt">
        <path fill="#da251d" d="M0 0h640v480H0z" />
        <path fill="#ff0" d="m320 109.6 52.2 160.7-136.7-99.4h169l-136.7 99.4z" />
      </svg>
    ),
    ja: (
      <svg viewBox="0 0 640 480" className={className} aria-label="日本語">
        <path fill="#fff" d="M0 0h640v480H0z" />
        <circle cx="320" cy="240" r="120" fill="#bc002d" />
      </svg>
    ),
  };

  return <span className="inline-flex shrink-0 items-center">{flags[lang]}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 동물 아이콘
// ═══════════════════════════════════════════════════════════════════════════

export type AnimalType = "dog" | "cat" | "fox";

interface AnimalIconProps extends IconProps {
  animal: AnimalType;
}

export function AnimalIcon({ animal, className = "w-6 h-6" }: AnimalIconProps) {
  const animals: Record<AnimalType, React.ReactNode> = {
    dog: (
      <svg viewBox="0 0 36 36" className={className} aria-label="강아지">
        <path fill="#D79E84" d="M36 18c0 9.941-8.059 18-18 18S0 27.941 0 18 8.059 0 18 0s18 8.059 18 18" />
        <path fill="#BF7E62" d="M18 3C8.611 3 1 10.611 1 20c0 2.983.789 5.783 2.161 8.209C5.616 33.135 11.369 36 18 36s12.384-2.865 14.839-7.791C34.211 25.783 35 22.983 35 20c0-9.389-7.611-17-17-17" />
        <ellipse cx="11.5" cy="17" fill="#292F33" rx="2.5" ry="3" />
        <ellipse cx="24.5" cy="17" fill="#292F33" rx="2.5" ry="3" />
        <path fill="#292F33" d="M20 27c0 1.105-1.119 2-2.5 2S15 28.105 15 27c0-.072.012-.14.022-.21.202.129.424.21.728.21.828 0 1.5-.895 1.5-2 0-.178-.02-.348-.057-.509C17.456 24.18 17.726 24 18 24c1.105 0 2 1.343 2 3" />
        <path fill="#66757F" d="M21 22h-6c-.552 0-1 .447-1 1 0 1.657 1.567 3 3.5 3h1c1.933 0 3.5-1.343 3.5-3 0-.553-.448-1-1-1" />
        <path fill="#292F33" d="M18 27c-.276 0-.5-.224-.5-.5V24c0-.276.224-.5.5-.5s.5.224.5.5v2.5c0 .276-.224.5-.5.5" />
        <path fill="#D79E84" d="M29 8c1.656 0 4-1.567 4-3.5S30.656 0 29 0c-3.037 0-5.5 3.582-5.5 8 0 1.933 1.567 4 3.5 4 1.657 0 2.5-2.567 2-4M7 8c-1.656 0-4-1.567-4-3.5S5.344 0 7 0c3.037 0 5.5 3.582 5.5 8 0 1.933-1.567 4-3.5 4-1.657 0-2.5-2.567-2-4" />
        <path fill="#F4ABBA" d="M8 7c-.381 0-.737-.215-.91-.57-.076-.154-1.856-3.837.518-5.838.327-.275.815-.234 1.09.093.275.327.234.815-.092 1.09-1.442 1.216-.36 3.638-.312 3.744.232.497.016 1.088-.481 1.32-.133.063-.274.092-.413.092l-.4.069m20 0c.381 0 .737-.215.91-.57.076-.154 1.856-3.837-.518-5.838-.327-.275-.815-.234-1.09.093-.275.327-.234.815.092 1.09 1.442 1.216.36 3.638.312 3.744-.232.497-.016 1.088.481 1.32.133.063.274.092.413.092l.4.069" />
      </svg>
    ),
    cat: (
      <svg viewBox="0 0 36 36" className={className} aria-label="고양이">
        <path fill="#FFCC4D" d="M36 18c0 9.941-8.059 18-18 18S0 27.941 0 18 8.059 0 18 0s18 8.059 18 18" />
        <path fill="#F4900C" d="M18 3C8.611 3 1 10.611 1 20c0 2.983.789 5.783 2.161 8.209C5.616 33.135 11.369 36 18 36s12.384-2.865 14.839-7.791C34.211 25.783 35 22.983 35 20c0-9.389-7.611-17-17-17" />
        <path fill="#292F33" d="M13 16c0 1.105-.672 2-1.5 2S10 17.105 10 16s.672-2 1.5-2 1.5.895 1.5 2m13 0c0 1.105-.672 2-1.5 2S23 17.105 23 16s.672-2 1.5-2 1.5.895 1.5 2" />
        <path fill="#292F33" d="M20 25c0 .828-.895 1.5-2 1.5s-2-.672-2-1.5.895-1.5 2-1.5 2 .672 2 1.5" />
        <path fill="#F4ABBA" d="M20.5 25.5c0 .276-.672.5-1.5.5s-1.5-.224-1.5-.5.672-.5 1.5-.5 1.5.224 1.5.5" />
        <path fill="#292F33" d="M18 28c-.276 0-.5-.224-.5-.5v-2c0-.276.224-.5.5-.5s.5.224.5.5v2c0 .276-.224.5-.5.5" />
        <path fill="#FFCC4D" d="M30.5 3.5l-5.478 5.478c1.582 1.19 3.185 2.756 4.382 4.706L35.5.5l-5 3m-25 0l5.478 5.478c-1.582 1.19-3.185 2.756-4.382 4.706L.5.5l5 3" />
        <path fill="#F4ABBA" d="M29.354 4.354l-5.089 5.089c.554.35 1.095.735 1.61 1.169l4.832-4.832c-.395-.562-.836-1.005-1.353-1.426m-22.708 0l5.089 5.089c-.554.35-1.095.735-1.61 1.169l-4.832-4.832c.395-.562.836-1.005 1.353-1.426" />
        <path fill="#CCD6DD" d="M14 21c0 .552-.672 1-1.5 1s-1.5-.448-1.5-1 .672-1 1.5-1 1.5.448 1.5 1m11 0c0 .552-.672 1-1.5 1S22 21.552 22 21s.672-1 1.5-1 1.5.448 1.5 1" />
      </svg>
    ),
    fox: (
      <svg viewBox="0 0 36 36" className={className} aria-label="여우">
        <path fill="#E1711F" d="M36 18c0 9.941-8.059 18-18 18S0 27.941 0 18 8.059 0 18 0s18 8.059 18 18" />
        <path fill="#D35A15" d="M18 3C8.611 3 1 10.611 1 20c0 2.983.789 5.783 2.161 8.209C5.616 33.135 11.369 36 18 36s12.384-2.865 14.839-7.791C34.211 25.783 35 22.983 35 20c0-9.389-7.611-17-17-17" />
        <path fill="#292F33" d="M13 17c0 1.105-.672 2-1.5 2S10 18.105 10 17s.672-2 1.5-2 1.5.895 1.5 2m13 0c0 1.105-.672 2-1.5 2S23 18.105 23 17s.672-2 1.5-2 1.5.895 1.5 2" />
        <path fill="#292F33" d="M20 26c0 .828-.895 1.5-2 1.5s-2-.672-2-1.5.895-1.5 2-1.5 2 .672 2 1.5" />
        <path fill="#FFCC4D" d="M26 25c-.188 0-1.673-.18-3-.893-.786-.422-1.504-.949-2.129-1.564C20.163 21.846 19.093 21 18 21c-1.094 0-2.163.846-2.871 1.543-.625.615-1.343 1.142-2.129 1.564-1.327.713-2.812.893-3 .893-.553 0-1 .447-1 1s.447 1 1 1c.069 0 1.733-.068 3.5-1 .947-.499 1.81-1.112 2.559-1.818.269-.254.581-.486.941-.682.36.196.672.428.941.682.749.706 1.612 1.319 2.559 1.818 1.767.932 3.431 1 3.5 1 .553 0 1-.447 1-1s-.447-1-1-1" />
        <path fill="#FEFEFE" d="M18 23c-1.657 0-3-1.567-3-3.5V17l3 1 3-1v2.5c0 1.933-1.343 3.5-3 3.5" />
        <path fill="#E1711F" d="M29.5.5l-4.89 5.379c.959.674 1.867 1.434 2.701 2.293L35.5.5l-6 0m-23 0l4.89 5.379c-.959.674-1.867 1.434-2.701 2.293L.5.5l6 0" />
        <path fill="#FEFEFE" d="M30 1l-5.216 5.738c-.342-.202-.693-.39-1.054-.561L29 1h1M6 1l5.216 5.738c.342-.202.693-.39 1.054-.561L7 1H6" />
      </svg>
    ),
  };

  return <span className="inline-flex shrink-0 items-center">{animals[animal]}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI 아이콘
// ═══════════════════════════════════════════════════════════════════════════

export type UIIconType = "camera" | "video" | "capture" | "search" | "robot" | "warning" | "dice" | "clover" | "paw";

interface UIIconProps extends IconProps {
  icon: UIIconType;
}

export function UIIcon({ icon, className = "w-6 h-6" }: UIIconProps) {
  const icons: Record<UIIconType, React.ReactNode> = {
    camera: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="카메라">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="비디오">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    capture: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="촬영">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="검색">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    robot: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="로봇">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="경고">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    dice: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="주사위">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" />
        <circle cx="7" cy="7" r="1.5" fill="white" />
        <circle cx="17" cy="7" r="1.5" fill="white" />
        <circle cx="7" cy="17" r="1.5" fill="white" />
        <circle cx="17" cy="17" r="1.5" fill="white" />
        <circle cx="12" cy="12" r="1.5" fill="white" />
      </svg>
    ),
    clover: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="클로버">
        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5C5.5 8.5 4 10.2 4 12.5 4 15 6 17 8.5 17c.8 0 1.6-.2 2.2-.6.4 2.2 2.3 3.9 4.3 4.6.3.1.7.1 1 0 2-.7 3.9-2.4 4.3-4.6.6.4 1.4.6 2.2.6 2.5 0 4.5-2 4.5-4.5 0-2.3-1.5-4-3.7-4.5.1-.5.2-1 .2-1.5C23.5 4 21.5 2 19 2c-1.8 0-3.3 1-4 2.5-.7-1.5-2.2-2.5-4-2.5z" />
      </svg>
    ),
    paw: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="발자국">
        <ellipse cx="12" cy="17" rx="5" ry="4" />
        <circle cx="6" cy="10" r="2.5" />
        <circle cx="18" cy="10" r="2.5" />
        <circle cx="8.5" cy="5.5" r="2" />
        <circle cx="15.5" cy="5.5" r="2" />
      </svg>
    ),
  };

  return <span className="inline-flex shrink-0 items-center">{icons[icon]}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 게임 아이콘 매핑
// ═══════════════════════════════════════════════════════════════════════════

export type GameIconType = "dice" | "clover" | "paw";

export function GameIcon({ icon, className }: { icon: GameIconType; className?: string }) {
  return <UIIcon icon={icon} className={className} />;
}
