import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 호범 포털",
  description: "호범 포털의 개인정보 수집, 이용, 보관 및 보호 정책 안내",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <section className="max-w-3xl mx-auto bg-white rounded-xl border p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">개인정보 처리방침</h1>
        <p className="mt-3 text-sm text-gray-500">시행일: 2026년 4월 3일</p>

        <div className="mt-8 space-y-6 text-gray-700 leading-7">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. 수집하는 정보</h2>
            <p className="mt-2">
              호범 포털은 서비스 제공을 위해 회원 식별 정보(예: 아이디, 이름), 인증 정보, 서비스 이용 기록을 수집할 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. 정보 이용 목적</h2>
            <p className="mt-2">
              수집한 정보는 로그인 인증, 서비스 제공, 사용자 맞춤 기능 제공, 보안 및 오류 대응 목적으로 이용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. 보관 및 파기</h2>
            <p className="mt-2">
              관련 법령 또는 내부 정책에 따라 필요한 기간 동안 보관 후 지체 없이 파기합니다. 파기 시 복구가 불가능한
              방법으로 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. 쿠키 및 로컬 저장소 사용</h2>
            <p className="mt-2">
              서비스는 로그인 상태 유지와 사용자 편의 기능 제공을 위해 쿠키와 브라우저 저장소를 사용할 수 있습니다.
              사용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. 이용자 권리</h2>
            <p className="mt-2">
              이용자는 본인의 개인정보에 대해 열람, 정정, 삭제를 요청할 수 있으며, 관련 문의는 아래 연락처로 접수할 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. 문의</h2>
            <p className="mt-2">개인정보 관련 문의: 관리자에게 문의해 주세요.</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
