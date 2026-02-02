import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "NeedCash 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
        Legal
      </p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
        이용약관
      </h1>
      <p className="mt-3 text-text-secondary">최종 수정일: 2026년 2월 2일</p>
      <div className="mt-6 h-px bg-border/60" />

      <article className="prose-custom mt-12 space-y-8 text-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제1조 (목적)
          </h2>
          <p className="mt-3">
            이 약관은 NeedCash(이하 &quot;본 사이트&quot;)가 제공하는 웹서비스의
            이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제2조 (서비스의 내용)
          </h2>
          <p className="mt-3">본 사이트는 다음과 같은 서비스를 제공합니다.</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>블로그 콘텐츠 (개발, 리뷰, 라이프스타일)</li>
            <li>웹 게임 (주사위, 로또 번호 생성기 등)</li>
            <li>포트폴리오 및 이력서</li>
            <li>기타 프로토타입 서비스</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제3조 (서비스 이용)
          </h2>
          <p className="mt-3">
            본 사이트는 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.
            다만, 일부 서비스는 이용에 제한이 있을 수 있으며 이 경우 사전에
            공지합니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제4조 (광고)
          </h2>
          <p className="mt-3">
            본 사이트는 Google AdSense 등 제3자 광고 서비스를 통해 광고를 게재할
            수 있습니다. 광고 내용에 대한 책임은 해당 광고주에게 있으며, 본
            사이트는 광고로 인한 손해에 대해 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제5조 (지적재산권)
          </h2>
          <p className="mt-3">
            본 사이트에 게시된 콘텐츠(글, 이미지, 코드 등)에 대한 저작권은
            원저작자에게 있습니다. 사전 동의 없이 상업적 목적으로 복제, 배포,
            전송하는 것을 금지합니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제6조 (면책사항)
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              본 사이트의 게임은 오락 목적으로만 제공되며, 실제 도박이나
              금전적 거래와 무관합니다.
            </li>
            <li>
              블로그에 게시된 정보는 참고용이며, 이를 기반으로 한 행위에 대해
              본 사이트는 책임지지 않습니다.
            </li>
            <li>
              천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해
              책임지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제7조 (약관의 변경)
          </h2>
          <p className="mt-3">
            본 약관은 필요에 따라 변경될 수 있으며, 변경된 약관은 본 사이트에
            게시함으로써 효력을 발생합니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제8조 (연락처)
          </h2>
          <p className="mt-3">
            서비스 이용 관련 문의사항은 아래로 연락해 주시기 바랍니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>이메일: danji1126@gmail.com</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
