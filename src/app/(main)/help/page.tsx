"use client";

import { useState } from "react";
import {
  ChevronDown,
  Search,
  Mail,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

const faqs = [
  {
    question: "NEON은 어떤 서비스인가요?",
    answer:
      "NEON은 나이트라이프 업소(룸, 라운지, 클럽, 요정 등)를 위한 올인원 디지털 플랫폼입니다. 업소 노출, 리뷰 관리, 데이터 분석 등을 하나의 대시보드에서 관리할 수 있습니다.",
  },
  {
    question: "무료 플랜으로 어떤 기능을 사용할 수 있나요?",
    answer:
      "무료 플랜에서는 업소 프로필 1개 등록, 기본 월간 통계 확인, 리뷰 알림 수신이 가능합니다. 프리미엄 노출이나 실시간 분석 등 고급 기능은 Pro 플랜부터 제공됩니다.",
  },
  {
    question: "Pro 플랜은 언제든 해지할 수 있나요?",
    answer:
      "네, 구독은 언제든지 해지할 수 있습니다. 해지 후에도 결제 기간이 끝날 때까지 Pro 기능을 계속 사용할 수 있으며, 이후 자동으로 무료 플랜으로 전환됩니다.",
  },
  {
    question: "결제 수단은 무엇이 있나요?",
    answer:
      "신용카드, 체크카드, 계좌이체를 지원합니다. Enterprise 플랜은 세금계산서 발행 및 청구서 결제도 가능합니다.",
  },
  {
    question: "업소 정보는 어떻게 수정하나요?",
    answer:
      "대시보드 → 설정 → 업소 정보에서 운영 시간, 주소, 사진, 소개글 등을 직접 수정할 수 있습니다. 변경 사항은 검토 후 24시간 이내에 반영됩니다.",
  },
  {
    question: "부적절한 리뷰를 신고하려면 어떻게 하나요?",
    answer:
      "대시보드의 리뷰 관리 메뉴에서 해당 리뷰 옆 '신고' 버튼을 클릭하세요. NEON 운영팀이 검토 후 정책 위반 리뷰는 삭제 조치합니다. 일반적으로 1~3 영업일 이내에 처리됩니다.",
  },
  {
    question: "NEON 인증 배지는 어떻게 받나요?",
    answer:
      "Pro 또는 Enterprise 플랜 가입 시 자동으로 인증 배지가 부여됩니다. 인증 배지는 업소 프로필, 검색 결과, 카테고리 페이지 등에 표시되어 신뢰도를 높여줍니다.",
  },
];

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-sm font-medium">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed text-neutral-400">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.includes(searchQuery) || faq.answer.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-10 w-10 text-violet-400" />
          <h1 className="mb-4 text-4xl font-bold">
            고객 <span className="text-violet-400">센터</span>
          </h1>
          <p className="text-lg text-neutral-400">
            궁금한 점을 검색하거나 자주 묻는 질문을 확인하세요.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="질문을 검색하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="mb-6 text-xl font-bold">자주 묻는 질문</h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <FaqItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))
            ) : (
              <div className="py-8 text-center text-sm text-neutral-500">
                검색 결과가 없습니다. 아래 연락처로 문의해 주세요.
              </div>
            )}
          </div>
        </div>

        {/* Contact Form Placeholder */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-6 text-xl font-bold">문의하기</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                이메일
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                제목
              </label>
              <input
                type="text"
                placeholder="문의 제목을 입력하세요"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                내용
              </label>
              <textarea
                rows={5}
                placeholder="문의 내용을 자세히 작성해 주세요"
                className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-violet-500"
              />
            </div>
            <button className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500">
              보내기
            </button>
          </div>
        </div>

        {/* Contact Channels */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <Mail className="h-6 w-6 text-violet-400" />
            <div>
              <h3 className="text-sm font-semibold">이메일 문의</h3>
              <p className="text-xs text-neutral-400">
                support@neon-nightlife.com
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <MessageCircle className="h-6 w-6 text-violet-400" />
            <div>
              <h3 className="text-sm font-semibold">카카오톡 상담</h3>
              <p className="text-xs text-neutral-400">
                평일 10:00 ~ 18:00 운영
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
