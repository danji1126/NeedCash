"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageViewTracker() {
  const pathname = usePathname();
  const enabledRef = useRef<boolean | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    fetch("/api/analytics/config")
      .then((res) => res.json() as Promise<{ enabled: boolean }>)
      .then((data) => {
        enabledRef.current = data.enabled;
      })
      .catch(() => {
        enabledRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (enabledRef.current === false) return;

    const data = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    });
    navigator.sendBeacon("/api/analytics/pageview", data);
  }, [pathname]);

  return null;
}
