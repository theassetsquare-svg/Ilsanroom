import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const steps = [
  {
    step: 1,
    title: "안내 링크 공유",
    description:
      "내 프로필에서 고유 추천 URL을 복사해 친구에게 카카오톡·문자·SNS로 공유하세요.",
    icon: "🔗",
  },
  {
    step: 2,
    title: "친구 가입 완료",
    description:
      "공유한 주소를 통해 친구가 회원가입하면 추천 실적으로 누적됩니다.",
    icon: "👤",
  },
  {
    step: 3,
    title: "함께 사용",
    description:
      "친구도 같은 페이지에서 후기·랭킹·커뮤니티를 함께 보며 놀쿨을 사용합니다.",
    icon: "🎁",
  },
];

const faqs = [
  {
    q: "추천 실적은 어떻게 확인하나요?",
    a: "내 프로필 > 추천 링크 탭에서 누적 추천 인원과 추천 코드를 확인할 수 있습니다.",
  },
  {
    q: "이미 가입한 친구도 추천이 되나요?",
    a: "아닙니다. 추천 링크를 통해 신규 가입한 회원만 추천 실적으로 인정됩니다.",
  },
  {
    q: "보상 정책은 어떻게 되나요?",
    a: "현재 추천 적립·보상 정책은 운영진 검토 후 별도 공지됩니다. 검증되지 않은 약속은 표기하지 않습니다.",
  },
];

export default function ReferralPage() {
  useDocumentMeta('같이 갈 친구한테 링크 한 번 보내봐', '카톡으로 놀쿨 링크 한 번 보내면 친구도 같은 페이지에서 후기·랭킹·커뮤니티 그대로 본다. 누가 뭘 추천했는지, 어디 가는지 함께 정리.');
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex rounded-full bg-neon-primary/20 px-4 py-1.5 text-sm font-medium text-neon-primary-light">
            친구 추천
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            친구에게
            <br />
            <span className="text-neon-primary-light">놀쿨 공유하기</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-neon-text-muted">
            추천 링크를 공유하면 친구도 같은 페이지에서 후기·랭킹·커뮤니티를 함께 봅니다.
            보상 정책은 운영진 검토 후 안내됩니다.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            이렇게 <span className="text-neon-primary-light">진행됩니다</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-neon-border bg-neon-surface p-6 text-center"
              >
                <div className="mb-4 text-4xl">{step.icon}</div>
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neon-primary text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-neon-text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            자주 묻는 <span className="text-neon-primary-light">질문</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neon-border bg-neon-surface p-6"
              >
                <h3 className="mb-2 font-bold text-neon-text">
                  Q. {faq.q}
                </h3>
                <p className="text-sm leading-relaxed text-neon-text-muted">
                  A. {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-violet-100 p-8 text-center md:p-12">
          <h2 className="mb-3 text-2xl font-bold">
            지금 바로 시작하세요
          </h2>
          <p className="mb-6 text-neon-text-muted">
            로그인 후 내 프로필에서 전달 주소를 바로 가져가
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-neon-primary px-8 py-3 font-medium text-white transition hover:bg-neon-primary-light"
            >
              시작하기
            </a>
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-neon-border bg-neon-surface px-8 py-3 font-medium text-neon-text transition hover:bg-neon-surface-2"
            >
              로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
