"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

const OFFSETS = {
  up: { y: 30, x: 0 },
  left: { y: 0, x: -30 },
  right: { y: 0, x: 30 },
} as const;

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: ScrollRevealProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldReduce) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );

    // 약간의 지연으로 네비게이션 후 스크롤 복원을 기다림
    const timer = setTimeout(() => {
      observer.observe(el);
    }, 50);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [shouldReduce]);

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...OFFSETS[direction] }}
      animate={isVisible ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
