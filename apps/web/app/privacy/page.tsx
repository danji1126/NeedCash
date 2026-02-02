import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "NeedCash 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
        Legal
      </p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
        개인정보처리방침
      </h1>
      <p className="mt-3 text-text-secondary">최종 수정일: 2026년 2월 2일</p>
      <div className="mt-6 h-px bg-border/60" />

      <article className="prose-custom mt-12 space-y-8 text-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            1. 수집하는 개인정보
          </h2>
          <p className="mt-3">
            NeedCash(이하 &quot;본 사이트&quot;)는 별도의 회원가입 절차 없이
            이용할 수 있으며, 직접적으로 개인정보를 수집하지 않습니다. 다만
            서비스 이용 과정에서 아래 정보가 자동으로 생성되어 수집될 수
            있습니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>방문 기록, 접속 IP 주소, 브라우저 유형</li>
            <li>서비스 이용 기록 및 기기 정보</li>
            <li>쿠키(Cookie) 정보</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            2. 개인정보의 이용 목적
          </h2>
          <p className="mt-3">수집된 정보는 다음 목적으로 이용됩니다.</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>서비스 제공 및 운영</li>
            <li>웹사이트 이용 통계 분석 및 서비스 개선</li>
            <li>광고 게재 및 맞춤형 광고 제공</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            3. 제3자 광고 서비스
          </h2>
          <p className="mt-3">
            본 사이트는 Google AdSense를 사용하여 광고를 게재합니다. Google
            AdSense는 사용자의 관심사에 기반한 광고를 표시하기 위해 쿠키를
            사용할 수 있습니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              Google은 사용자가 본 사이트 또는 다른 웹사이트를 방문한 기록을
              기반으로 광고를 게재합니다.
            </li>
            <li>
              사용자는{" "}
              <a
                href="https://www.google.com/settings/ads"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 광고 설정
              </a>
              에서 맞춤 광고를 비활성화할 수 있습니다.
            </li>
            <li>
              자세한 내용은{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 개인정보처리방침
              </a>
              을 참조하시기 바랍니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            4. 쿠키(Cookie) 사용
          </h2>
          <p className="mt-3">
            본 사이트는 사용자 경험 향상과 광고 서비스 제공을 위해 쿠키를
            사용합니다. 쿠키는 웹사이트가 사용자의 브라우저에 저장하는 작은 텍스트
            파일입니다.
          </p>
          <p className="mt-3">
            사용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우
            서비스 이용에 일부 제한이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            5. 개인정보의 보유 및 파기
          </h2>
          <p className="mt-3">
            자동 수집된 정보는 수집 목적이 달성된 후 지체 없이 파기합니다.
            다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안
            보관 후 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            6. 이용자의 권리
          </h2>
          <p className="mt-3">
            이용자는 언제든지 자신의 개인정보 처리에 대해 열람, 정정, 삭제,
            처리정지를 요청할 수 있습니다. 관련 문의는 아래 연락처로
            보내주시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            7. 연락처
          </h2>
          <p className="mt-3">
            개인정보 관련 문의사항은 아래로 연락해 주시기 바랍니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>이메일: danji1126@gmail.com</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
