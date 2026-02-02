import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-text-muted">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
