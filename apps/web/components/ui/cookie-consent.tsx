"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";

const STORAGE_KEY = "needcash-cookie-consent";

type ConsentValue = "granted" | "denied" | null;

function getSnapshot(): ConsentValue {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "granted" || stored === "denied") return stored;
  return null;
}

function getServerSnapshot(): ConsentValue {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function CookieConsent() {
  const storedConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localConsent, setLocalConsent] = useState<ConsentValue>(null);

  const consent = localConsent ?? storedConsent;

  const handleAccept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setLocalConsent("granted");
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setLocalConsent("denied");
  }, []);

  return (
    <>
      {consent === "granted" && (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7452986546914975"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {consent === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              이 사이트는 서비스 개선과 맞춤 광고를 위해 쿠키를 사용합니다.{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                개인정보처리방침
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleDecline}
                className="rounded-[var(--radius-button,0px)] border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
              >
                거부
              </button>
              <button
                onClick={handleAccept}
                className="rounded-[var(--radius-button,0px)] bg-accent px-4 py-2 text-sm text-bg transition-colors hover:bg-accent-hover"
              >
                수락
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
