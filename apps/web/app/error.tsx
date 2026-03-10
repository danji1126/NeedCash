"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">문제가 발생했습니다</h2>
      <p className="text-text-muted">
        {error.digest
          ? `오류 코드: ${error.digest}`
          : "페이지를 불러오는 중 오류가 발생했습니다."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-bg transition-opacity hover:opacity-80"
      >
        다시 시도
      </button>
    </div>
  );
}
