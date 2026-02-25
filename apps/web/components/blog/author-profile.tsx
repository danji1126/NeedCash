export function AuthorProfile() {
  return (
    <div className="mt-16 border-t border-border/60 pt-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-lg font-bold text-text-muted">
          JB
        </div>
        <div>
          <p className="font-heading text-sm font-semibold">Jiinbae</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            7년차 풀스택 개발자. 웹 기술과 인터랙티브 경험에 관심이 많습니다.
            NeedCash에서 개발 과정과 다양한 실험을 기록합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
