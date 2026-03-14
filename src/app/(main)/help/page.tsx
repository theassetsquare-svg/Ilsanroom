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
        question: "NEON은 어떤 서비스인가요?",
        answer:
          "NEON은 나이트라이프 업소(룸, 라운지, 클럽, 요정 등)를 위한 올인원 디지털 플랫폼입니다. 업소 검색, 리뷰, 예약, 커뮤니티 기능을 제공하며, 업주에게는 노출 관리, 데이터 분석, 예약 시스템 등 비즈니스 도구를 제공합니다.",
      },
      {
        question: "가입은 어떻게 하나요?",
        answer:
          "홈페이지 우측 상단의 '가입' 버튼을 클릭하세요. 이메일 또는 카카오 계정으로 간편하게 가입할 수 있습니다. 가입 후 바로 업소 검색, 리뷰 작성, 커뮤니티 참여가 가능합니다.",
      },
      {
        question: "무료로 이용할 수 있는 기능은 무엇인가요?",
        answer:
          "일반 사용자는 업소 검색, 리뷰 열람, 커뮤니티 글 읽기 등 모든 기본 기능을 무료로 이용할 수 있습니다. 업주의 경우 무료 플랜에서 업소 프로필 1개 등록, 기본 월간 통계 확인, 리뷰 알림 수신이 가능합니다.",
      },
      {
        question: "문의는 어떻게 할 수 있나요?",
        answer:
          "이메일(support@neon-nightlife.com) 또는 카카오톡 채널(@NEON고객센터)로 문의하실 수 있습니다. 운영시간은 평일 10:00~18:00이며, 긴급 문의는 24시간 접수 가능합니다.",
      },
    ],
  },
  {
    name: "업주",
    icon: Store,
    items: [
      {
        question: "업소는 어떻게 등록하나요?",
        answer:
          "업주 계정으로 로그인 후 대시보드에서 '업소 등록' 버튼을 클릭하세요. 업소명, 주소, 카테고리, 운영 시간, 사진 등을 입력하면 됩니다. 검토 후 24시간 이내에 등록이 완료됩니다.",
      },
      {
        question: "요금제별 차이점은 무엇인가요?",
        answer:
          "무료 플랜은 기본 프로필과 월간 통계를 제공합니다. 프로(₩49,000/월) 플랜은 프리미엄 검색 노출, 실시간 통계, 리뷰 관리 도구, 인증 배지를 포함합니다. 비즈니스(₩99,000/월) 플랜은 예약 시스템, 이벤트 프로모션, 우선 고객 지원이 추가됩니다. 엔터프라이즈는 맞춤 견적으로 멀티 업소 관리와 전담 매니저를 제공합니다.",
      },
      {
        question: "결제는 어떻게 하나요?",
        answer:
          "신용카드, 체크카드, 계좌이체를 지원합니다. 대시보드 → 설정 → 결제에서 결제 수단을 등록하고 원하는 플랜을 선택하세요. 엔터프라이즈 플랜은 세금계산서 발행 및 청구서 결제도 가능합니다.",
      },
      {
        question: "프리미엄 배지는 어떻게 받나요?",
        answer:
          "프로 또는 그 이상의 플랜에 가입하면 자동으로 NEON 인증 배지가 부여됩니다. 배지는 업소 프로필, 검색 결과, 카테고리 페이지에 표시되어 고객 신뢰도와 클릭률을 높여줍니다. 인증 업소는 평균 2.3배 높은 클릭률을 기록합니다.",
      },
    ],
  },
  {
    name: "결제",
    icon: CreditCard,
    items: [
      {
        question: "환불 정책은 어떻게 되나요?",
        answer:
          "결제 후 7일 이내에 환불 요청 시 전액 환불됩니다. 7일 이후에는 남은 기간에 대해 일할 계산하여 환불합니다. 환불 요청은 대시보드 → 설정 → 결제 → 환불 요청 또는 고객센터를 통해 가능합니다.",
      },
      {
        question: "결제 카드를 변경하려면 어떻게 하나요?",
        answer:
          "대시보드 → 설정 → 결제 → 결제 수단 관리에서 새 카드를 등록하고 기본 결제 수단으로 설정하세요. 기존 카드는 삭제하거나 보조 결제 수단으로 유지할 수 있습니다.",
      },
      {
        question: "연간 결제 시 할인이 있나요?",
        answer:
          "네, 연간 결제 시 20% 할인이 적용됩니다. 프로 플랜 기준 월 ₩49,000 → 연간 ₩470,400(월 ₩39,200)으로 이용 가능합니다. 연간 플랜 전환은 대시보드에서 언제든 가능합니다.",
      },
      {
        question: "무료 체험 기간이 끝나면 어떻게 되나요?",
        answer:
          "14일 무료 체험 종료 후 자동으로 무료 플랜으로 전환됩니다. 별도의 결제가 발생하지 않으며, 원할 때 유료 플랜으로 업그레이드할 수 있습니다. 체험 중 등록한 데이터는 모두 유지됩니다.",
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
          "로그인 후 커뮤니티 페이지에서 '글쓰기' 버튼을 클릭하세요. 카테고리를 선택하고 제목과 내용을 작성하면 됩니다. 이미지 첨부도 가능합니다. 첫 글 작성 시 커뮤니티 가이드라인을 확인해 주세요.",
      },
      {
        question: "부적절한 게시글이나 댓글을 신고하려면?",
        answer:
          "해당 게시글 또는 댓글의 우측 상단 '...' 메뉴에서 '신고하기'를 선택하세요. 신고 사유를 선택하면 운영팀이 검토 후 조치합니다. 일반적으로 1~3 영업일 이내에 처리됩니다.",
      },
      {
        question: "레벨 시스템은 어떻게 작동하나요?",
        answer:
          "활동에 따라 경험치가 쌓이고 레벨이 올라갑니다. 글 작성(+10), 댓글(+5), 좋아요 받기(+2) 등으로 경험치를 얻을 수 있습니다. 레벨이 높아지면 프로필 배지, 특별 이모지, 우선 노출 등 혜택이 주어집니다.",
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
          "Chrome, Safari, Firefox, Edge의 최신 2개 버전을 공식 지원합니다. 모바일에서는 iOS Safari와 Android Chrome을 지원합니다. Internet Explorer는 지원하지 않습니다.",
      },
      {
        question: "모바일 앱은 언제 출시되나요?",
        answer:
          "모바일 앱은 현재 개발 중이며 2026년 상반기 출시를 목표로 하고 있습니다. 출시 전까지는 모바일 웹 브라우저에서 최적화된 환경으로 이용하실 수 있습니다. 앱 출시 알림을 받으시려면 뉴스레터를 구독해 주세요.",
      },
      {
        question: "API를 사용할 수 있나요?",
        answer:
          "엔터프라이즈 플랜에서 REST API를 제공합니다. 업소 정보 조회, 예약 관리, 리뷰 데이터 연동 등이 가능합니다. API 문서는 엔터프라이즈 가입 후 대시보드에서 확인할 수 있으며, 전담 매니저가 연동을 지원합니다.",
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
    <div className="border-b border-neutral-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-violet-400"
      >
        <span className="pr-4 text-sm font-medium">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
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

function CategorySection({ category }: { category: FaqCategory }) {
  const Icon = category.icon;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-violet-600/20 p-2">
          <Icon className="h-4 w-4 text-violet-400" />
        </div>
        <h3 className="text-lg font-bold">{category.name}</h3>
      </div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6">
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
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-10 w-10 text-violet-400" />
          <h1 className="mb-4 text-4xl font-bold">
            고객 <span className="text-violet-400">센터</span>
          </h1>
          <p className="text-lg text-neutral-400">
            궁금한 점을 검색하거나 카테고리별 자주 묻는 질문을 확인하세요.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="질문을 검색하세요..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setActiveCategory(null);
            }}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === null
                  ? "bg-violet-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
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
                    ? "bg-violet-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
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
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-neutral-600" />
              <p className="text-sm text-neutral-500">
                &ldquo;{searchQuery}&rdquo;에 대한 검색 결과가 없습니다.
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                아래 연락처로 직접 문의해 주세요.
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mb-8">
          <h2 className="mb-6 text-xl font-bold">
            직접 <span className="text-violet-400">문의하기</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <Mail className="mt-0.5 h-6 w-6 shrink-0 text-violet-400" />
              <div>
                <h3 className="text-sm font-semibold">이메일</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  support@neon-nightlife.com
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  24시간 접수 가능
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <MessageCircle className="mt-0.5 h-6 w-6 shrink-0 text-violet-400" />
              <div>
                <h3 className="text-sm font-semibold">카카오톡 채널</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  @NEON고객센터
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  실시간 채팅 상담
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <Clock className="mt-0.5 h-6 w-6 shrink-0 text-violet-400" />
              <div>
                <h3 className="text-sm font-semibold">운영시간</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  평일 10:00 ~ 18:00
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  주말 및 공휴일 휴무
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
