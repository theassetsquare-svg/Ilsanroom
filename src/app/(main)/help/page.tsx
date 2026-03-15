"use client";

import { useState } from "react";
import {
  ChevronDown,
  Search,
  Mail,
  MessageCircle,
  HelpCircle,
  Clock,
  Users,
  CreditCard,
  Code,
  Store,
} from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  icon: React.ElementType;
  items: FaqItem[];
}

const faqCategories: FaqCategory[] = [
  {
    name: "일반",
    icon: HelpCircle,
    items: [
      {
        question: "당사은 어떤 서비스인가요?",
        answer:
          "당사는 나이트라이프 상점(룸, 라운지, 클럽, 요정 등)를 위한 올인원 디지털 플랫폼입니다. 매장 검색, 방문후기, 예약, 커뮤니티 도구를 제공하며, 업주에게는 게재 관리, 데이터 인사이트, 예약 체계 등 전문 수단를 제공합니다.",
      },
      {
        question: "가입은 어떻게 하나요?",
        answer:
          "홈페이지 우측 상단의 '로그인' 버튼을 클릭하세요. 카카오, 네이버, 구글 소셜 계정으로 간편하게 시작할 수 존재합니다. 가입 후 바로 매장 검색, 방문후기 작성, 커뮤니티 참여가 허용합니다.",
      },
      {
        question: "무료로 이용할 수 있는 기능은 무엇인가요?",
        answer:
          "일반 사용자는 장소 검색, 방문후기 열람, 커뮤니티 글 읽기 등 모든 기초 도구를 무료로 이용할 수 존재합니다. 업주의 경우 무료 요금안에서 상점 소개란 1개 생성, 기초 월간 지표 조회, 방문후기 알림 수신이 허용합니다.",
      },
      {
        question: "문의는 어떻게 할 수 있나요?",
        answer:
          "이메일(support@ilsanroom.pages.dev) 또는 카카오톡 채널(@당사문의자센터)로 문의하실 수 존재합니다. 구동시간은 평일 10:00~18:00이며, 긴급 문의는 24시간 접수 허용합니다.",
      },
    ],
  },
  {
    name: "업주",
    icon: Store,
    items: [
      {
        question: "상점는 어떻게 생성하나요?",
        answer:
          "업주 계정으로 로그인 후 관리화면에서 '상점 등록' 버튼을 클릭하세요. 상점명, 주소, 카테고리, 구동 시간, 사진 등을 입력하면 됩니다. 검토 후 24시간 이내에 등록이 완료됩니다.",
      },
      {
        question: "요금제별 차이점은 무엇인가요?",
        answer:
          "무료 요금안은 기초 소개란과 월간 지표를 제공합니다. 프로(₩49,000/월) 요금안은 골드 검색 게재, 실시간 지표, 방문후기 관리 수단, 검증 마크를 포함합니다. 전문(₩99,000/월) 요금안은 예약 체계, 프로모션 프로모션, 우선 문의자 지원이 추가됩니다. 커스텀형는 커스텀 견적으로 멀티 매장 관리와 전담 어드바이저를 제공합니다.",
      },
      {
        question: "납부는 어떤 방법으로 하나요?",
        answer:
          "카드, 체크카드, 계좌이체를 받습니다. 관리화면 → 설정 → 과금에서 지불 수단을 등록하고 원하는 요금안을 고르기하세요. 커스텀형 요금안은 세금계산서 발행 및 청구서 납부도 됩니다.",
      },
      {
        question: "골드 마크는 어떻게 받나요?",
        answer:
          "프로 또는 그 이상의 요금안에 가입하면 자동으로 당사 검증 마크가 부여됩니다. 마크는 상점 소개란, 검색 결과, 카테고리 페이지에 표시되어 문의자 신뢰도와 클릭률을 높여줍니다. 검증 가게는 평균 2.3배 높은 클릭률을 기록합니다.",
      },
    ],
  },
  {
    name: "과금",
    icon: CreditCard,
    items: [
      {
        question: "반환금 정책은 어떻게 되나요?",
        answer:
          "과금 후 7일 이내에 반환금 요청 시 전액 반환금됩니다. 7일 이후에는 남은 기간에 대해 일할 계산하여 반환금합니다. 반환금 요청은 관리화면 → 설정 → 과금 → 반환금 요청 또는 문의자센터를 통해 허용합니다.",
      },
      {
        question: "과금 카드를 변경하는 절차가 궁금합니다",
        answer:
          "관리화면 → 설정 → 과금 → 지불 수단 관리에서 새 카드를 등록하고 기초 과금 수단으로 설정하세요. 기존 카드는 삭제하거나 보조 수단으로 유지할 수 존재합니다.",
      },
      {
        question: "1년 납부 시 할인이 있나요?",
        answer:
          "네, 1년 과금 시 20% 할인이 적용됩니다. 프로 요금안 기준 월 ₩49,000 → 1년 ₩470,400(월 ₩39,200)으로 이용할 수 존재합니다. 1년 요금안 전환은 관리화면에서 언제든 지원됩니다.",
      },
      {
        question: "무료 체험 기간이 끝나면 어떤 과정을 거치나요?",
        answer:
          "14일 무료 체험 종료 후 자동으로 무료 요금안으로 전환됩니다. 별도의 과금이 발생하지 않으며, 원할 때 유료 요금안으로 업그레이드할 수 존재합니다. 체험 중 등록한 데이터는 모두 유지됩니다.",
      },
    ],
  },
  {
    name: "커뮤니티",
    icon: Users,
    items: [
      {
        question: "커뮤니티에 글을 쓰려면 어떻게 하나요?",
        answer:
          "로그인 후 커뮤니티 페이지에서 '글쓰기' 버튼을 클릭하세요. 카테고리를 고르기하고 제목과 내용을 작성하면 됩니다. 이미지 첨부도 허용합니다. 첫 글 작성 시 커뮤니티 가이드라인을 조회해 주세요.",
      },
      {
        question: "부적절한 게시글이나 댓글을 신고하려면?",
        answer:
          "해당 게시글 또는 댓글의 우측 상단 '...' 메뉴에서 '신고하기'를 고르기하세요. 신고 사유를 고르기하면 구동팀이 검토 후 조치합니다. 일반적으로 1~3 영업일 이내에 진행됩니다.",
      },
      {
        question: "레벨 체계은 어떻게 작동하나요?",
        answer:
          "활동에 따라 경험치가 쌓이고 레벨이 올라갑니다. 글 작성(+10), 댓글(+5), 좋아요 받기(+2) 등으로 경험치를 얻게 됩니다. 레벨이 높아지면 소개란 마크, 특별 이모지, 우선 게재 등 혜택이 주어집니다.",
      },
    ],
  },
  {
    name: "기술",
    icon: Code,
    items: [
      {
        question: "어떤 브라우저를 지원하나요?",
        answer:
          "Chrome, Safari, Firefox, Edge의 최신 2개 버전을 공식 받습니다. 모바일에서는 iOS Safari와 Android Chrome을 받습니다. Internet Explorer는 지원하지 않습니다.",
      },
      {
        question: "모바일 앱은 언제 출시되나요?",
        answer:
          "모바일 앱은 현재 개발 중이며 2026년 상반기 출시를 목표로 합니다. 출시 전까지는 모바일 웹 브라우저에서 최적화된 환경으로 이용하실 수 존재합니다. 앱 출시 알림을 받으시려면 뉴스레터를 구독해 주세요.",
      },
      {
        question: "API를 사용할 수 있나요?",
        answer:
          "커스텀형 요금안에서 REST API를 제공합니다. 상점 정보 조회, 예약 관리, 방문후기 데이터 연동 등이 허용합니다. API 문서는 커스텀형 가입 후 관리화면에서 확인할 수 있으며, 전담 어드바이저가 연동을 받습니다.",
      },
    ],
  },
];

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neon-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-neon-primary-light"
      >
        <span className="pr-4 text-sm font-medium">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neon-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed text-neon-text-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: FaqCategory }) {
  const Icon = category.icon;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-neon-primary/20 p-2">
          <Icon className="h-4 w-4 text-neon-primary-light" />
        </div>
        <h3 className="text-lg font-bold">{category.name}</h3>
      </div>
      <div className="rounded-2xl border border-neon-border bg-neon-surface px-6">
        {category.items.map((item) => (
          <AccordionItem
            key={item.question}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </div>
    </div>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allItems = faqCategories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, category: cat.name }))
  );

  const filteredCategories = searchQuery
    ? faqCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.question.includes(searchQuery) ||
              item.answer.includes(searchQuery)
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : activeCategory
    ? faqCategories.filter((cat) => cat.name === activeCategory)
    : faqCategories;

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-10 w-10 text-neon-primary-light" />
          <h1 className="mb-4 text-4xl font-bold">
            문의자 <span className="text-neon-primary-light">센터</span>
          </h1>
          <p className="text-lg text-neon-text-muted">
            궁금한 점을 검색하거나 카테고리별 자주 묻는 질문을 확인하세요.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neon-text-muted" />
          <input
            type="text"
            placeholder="질문을 검색하세요..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setActiveCategory(null);
            }}
            className="w-full rounded-xl border border-neon-border bg-neon-surface py-3.5 pl-12 pr-4 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === null
                  ? "bg-neon-primary text-neon-text"
                  : "bg-neon-surface-2 text-neon-text-muted hover:bg-neon-surface-2"
              }`}
            >
              전체
            </button>
            {faqCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat.name
                    ? "bg-neon-primary text-neon-text"
                    : "bg-neon-surface-2 text-neon-text-muted hover:bg-neon-surface-2"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Categories */}
        <div className="mb-16">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <CategorySection key={cat.name} category={cat} />
            ))
          ) : (
            <div className="rounded-2xl border border-neon-border bg-neon-surface py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-neon-text-muted/60" />
              <p className="text-sm text-neon-text-muted">
                &ldquo;{searchQuery}&rdquo;에 대한 검색 결과가 없습니다.
              </p>
              <p className="mt-1 text-xs text-neon-text-muted/60">
                아래 연락처로 직접 문의해 주세요.
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mb-8">
          <h2 className="mb-6 text-xl font-bold">
            직접 <span className="text-neon-primary-light">문의하기</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="flex items-start gap-4 rounded-2xl border border-neon-border bg-neon-surface p-6">
              <Mail className="mt-0.5 h-6 w-6 shrink-0 text-neon-primary-light" />
              <div>
                <h3 className="text-sm font-semibold">이메일</h3>
                <p className="mt-1 text-xs text-neon-text-muted">
                  qotjsdnr123@naver.com
                </p>
                <p className="mt-0.5 text-xs text-neon-text-muted/60">
                  24시간 접수 허용
                </p>
              </div>
            </div>
            <a href="https://pf.kakao.com/_xgxkxaT" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/40">
              <MessageCircle className="mt-0.5 h-6 w-6 shrink-0 text-neon-primary-light" />
              <div>
                <h3 className="text-sm font-semibold">카카오톡 채널</h3>
                <p className="mt-1 text-xs text-neon-text-muted">
                  @당사문의자센터
                </p>
                <p className="mt-0.5 text-xs text-neon-text-muted/60">
                  실시간 채팅 상담
                </p>
              </div>
            </a>
            <div className="flex items-start gap-4 rounded-2xl border border-neon-border bg-neon-surface p-6">
              <Clock className="mt-0.5 h-6 w-6 shrink-0 text-neon-primary-light" />
              <div>
                <h3 className="text-sm font-semibold">구동시간</h3>
                <p className="mt-1 text-xs text-neon-text-muted">
                  평일 10:00 ~ 18:00
                </p>
                <p className="mt-0.5 text-xs text-neon-text-muted/60">
                  주말 및 공휴일 휴무
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
            <h3 className="mb-4 text-sm font-bold">문의 양식</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('문의가 접수되었습니다. qotjsdnr123@naver.com으로 답변 드리겠습니다.'); }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neon-text-muted">이름</label>
                <input type="text" required placeholder="이름을 입력하세요"
                  className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neon-text-muted">이메일</label>
                <input type="email" required placeholder="답변 받으실 이메일"
                  className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neon-text-muted">문의 내용</label>
                <textarea required rows={4} placeholder="문의 내용을 작성해 주세요"
                  className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-violet-500 resize-none" />
              </div>
              <button type="submit"
                className="w-full rounded-xl bg-neon-primary py-3 text-sm font-semibold text-neon-text transition hover:bg-neon-primary-light"
                style={{ minHeight: 48 }}>
                문의 보내기
              </button>
              <p className="text-[10px] text-neon-text-muted/60 text-center">
                문의 내용은 qotjsdnr123@naver.com으로 전달됩니다
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
