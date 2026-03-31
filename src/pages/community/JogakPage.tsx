import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { useEngagementStore } from '@/lib/engagement-store';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';

/**
 * 조각 페이지 — 같이 놀러갈 사람 구하기
 *
 * 포인트가 있는 사람만 글 작성 가능 (최소 100P)
 * → 포인트 모으려고 체류 → 체류하면 포인트 → 조각 글 작성
 */

const MIN_POINTS_TO_POST = 100;

interface JogakItem {
  id: string;
  title: string;
  author: string;
  authorLevel: string;
  authorPoints: number;
  date: string;
  region: string;
  venue: string;
  when: string;
  currentMembers: number;
  maxMembers: number;
  gender: string;
  ageRange: string;
  description: string;
  status: '모집중' | '마감임박' | '마감';
  comments: number;
}

const sampleJogaks: JogakItem[] = [
  {
    id: 'j-1',
    title: '토요일 강남 클럽 같이 갈 사람! 🔥',
    author: '파티킹',
    authorLevel: '⭐ 탐험가',
    authorPoints: 450,
    date: '2026-04-05',
    region: '강남',
    venue: '강남청담클럽 레이스',
    when: '토요일 밤 11시',
    currentMembers: 2,
    maxMembers: 6,
    gender: '남녀무관',
    ageRange: '25~35',
    description: '강남 레이스 가는데 같이 갈 사람 구해요! 테이블 잡아놨고 인원 나눠서 갈 예정. 처음이어도 괜찮아요 분위기 좋게 놀아요.',
    status: '모집중',
    comments: 8,
  },
  {
    id: 'j-2',
    title: '일산룸 회식 2차 동행 구합니다',
    author: '일산토박이',
    authorLevel: '🔥 매니아',
    authorPoints: 820,
    date: '2026-04-03',
    region: '일산',
    venue: '일산룸',
    when: '금요일 저녁 8시',
    currentMembers: 4,
    maxMembers: 8,
    description: '회사 회식 2차로 일산룸 가는데 다른 팀 분들도 합류 환영! 신실장님한테 얘기해놨어요. 비용은 N빵.',
    gender: '남녀무관',
    ageRange: '28~40',
    status: '모집중',
    comments: 5,
  },
  {
    id: 'j-3',
    title: '부산 해운대 나이트 같이 가요 🌊',
    author: '해운대러버',
    authorLevel: '🎵 탐험가',
    authorPoints: 310,
    date: '2026-04-06',
    region: '부산',
    venue: '부산연산동물나이트',
    when: '토요일 밤 9시',
    currentMembers: 3,
    maxMembers: 6,
    gender: '남녀무관',
    ageRange: '25~35',
    description: '부산 여행 왔는데 밤에 같이 놀 현지인 or 여행자 구해요! 따봉 실장님한테 미리 연락했고 자리 잡아놨습니다.',
    status: '모집중',
    comments: 12,
  },
  {
    id: 'j-4',
    title: '홍대 클럽 투어 멤버 모집 🎵',
    author: '홍대프로',
    authorLevel: '👑 VIP',
    authorPoints: 1520,
    date: '2026-04-05',
    region: '홍대',
    venue: '홍대클럽 버뮤다 → 퍼시픽 → 도깨비',
    when: '토요일 밤 10시',
    currentMembers: 5,
    maxMembers: 10,
    gender: '남녀무관',
    ageRange: '22~30',
    description: '홍대 클럽 3곳 투어 갑니다! 버뮤다에서 시작 → 퍼시픽 → 도깨비 순서. 각 업소 1시간씩 돌면서 분위기 비교. 클럽 처음이어도 다 같이 가니까 부담 없어요.',
    status: '마감임박',
    comments: 23,
  },
  {
    id: 'j-5',
    title: '수원 나이트 초보 동행 🙋‍♀️',
    author: '수원새내기',
    authorLevel: '🌱 뉴비',
    authorPoints: 150,
    date: '2026-04-04',
    region: '수원',
    venue: '수원찬스돔나이트',
    when: '금요일 밤 9시',
    currentMembers: 1,
    maxMembers: 4,
    gender: '여자만',
    ageRange: '25~32',
    description: '나이트 처음인데 혼자 가기 무서워서 같이 갈 여자분 구해요ㅠ 강호동 실장님이 초보도 편하게 안내해준다고 했어요!',
    status: '모집중',
    comments: 15,
  },
];

const statusStyles: Record<string, string> = {
  '모집중': 'bg-[#DCFCE7] text-[#15803D]',
  '마감임박': 'bg-[#FEF9C3] text-[#A16207]',
  '마감': 'bg-[#F3F4F6] text-[#6B7280]',
};

const regions = ['전체', '강남', '홍대', '이태원', '일산', '부산', '수원', '대전', '대구', '인천'];

export default function JogakPage() {
  useDocumentMeta('같이 놀러갈 사람 구하기', '혼자 가기 심심할 때, 조각 모집으로 같이 갈 사람을 구해보세요.');
  const { user } = useAuth();
  const store = useEngagementStore();
  const currentPoints = store.points;

  const [jogaks] = useState<JogakItem[]>(sampleJogaks);
  const [filter, setFilter] = useState('전체');
  const [showWrite, setShowWrite] = useState(false);
  const [pointError, setPointError] = useState(false);
  const pointTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (pointTimerRef.current) clearTimeout(pointTimerRef.current); };
  }, []);

  const filtered = filter === '전체' ? jogaks : jogaks.filter(j => j.region === filter);

  const handleWriteClick = () => {
    if (!user) {
      setPointError(false);
      alert('로그인이 필요합니다');
      return;
    }
    if (currentPoints < MIN_POINTS_TO_POST) {
      setPointError(true);
      if (pointTimerRef.current) clearTimeout(pointTimerRef.current);
      pointTimerRef.current = setTimeout(() => setPointError(false), 5000);
      return;
    }
    setShowWrite(true);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🧩</span>
          <h1 className="text-2xl font-extrabold" style={{ color: '#111' }}>조각 모집</h1>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
          혼자 가기 심심할 때, 같이 놀러갈 사람을 구해보세요.
          <br />
          포인트 <strong style={{ color: '#8B5CF6' }}>{MIN_POINTS_TO_POST}P 이상</strong>이면 조각 글을 올릴 수 있습니다.
        </p>

        {/* 내 포인트 + 글쓰기 */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: '#F3F0FF' }}>
            <span className="text-sm" style={{ color: '#6B21A8' }}>내 포인트</span>
            <span className="text-base font-extrabold" style={{ color: '#8B5CF6' }}>{currentPoints}P</span>
          </div>
          <button
            onClick={handleWriteClick}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition active:scale-95"
            style={{ backgroundColor: currentPoints >= MIN_POINTS_TO_POST ? '#8B5CF6' : '#D1D5DB' }}
          >
            🧩 조각 모집하기
          </button>
          {currentPoints < MIN_POINTS_TO_POST && (
            <span className="text-xs" style={{ color: '#EF4444' }}>
              {MIN_POINTS_TO_POST - currentPoints}P 더 모으면 글 작성 가능!
            </span>
          )}
        </div>

        {/* 포인트 부족 경고 */}
        {pointError && (
          <div className="mt-3 rounded-xl border px-4 py-3" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
            <p className="text-sm font-bold" style={{ color: '#DC2626' }}>
              포인트가 부족합니다! ({currentPoints}P / {MIN_POINTS_TO_POST}P 필요)
            </p>
            <p className="mt-1 text-xs" style={{ color: '#991B1B' }}>
              페이지를 둘러보고, 미션을 수행하면 포인트를 모을 수 있어요.
              스크롤만 해도 포인트가 쌓입니다!
            </p>
          </div>
        )}
      </div>

      {/* 지역 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition min-h-[44px]"
            style={{
              backgroundColor: filter === r ? '#8B5CF6' : '#F3F4F6',
              color: filter === r ? '#FFFFFF' : '#374151',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 조각 목록 */}
      <div className="space-y-4">
        {filtered.map(j => (
          <div key={j.id} className="rounded-2xl border bg-white p-5 transition hover:shadow-md" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* 상단: 상태 + 지역 + 성별 */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyles[j.status]}`}>
                    {j.status}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>
                    {j.region}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FCE7F3', color: '#BE185D' }}>
                    {j.gender}
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{j.ageRange}세</span>
                </div>

                {/* 제목 */}
                <h3 className="text-base font-bold leading-snug mb-1" style={{ color: '#111' }}>{j.title}</h3>

                {/* 업소 + 시간 */}
                <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                  📍 {j.venue} · 🕐 {j.when}
                </p>

                {/* 설명 */}
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#555' }}>{j.description}</p>

                {/* 작성자 정보 */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: '#374151' }}>
                    {j.authorLevel} {j.author}
                  </span>
                  <span className="text-xs" style={{ color: '#8B5CF6' }}>{j.authorPoints}P</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>💬 {j.comments}</span>
                </div>
              </div>

              {/* 인원 */}
              <div className="shrink-0 text-center">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-black" style={{ color: j.currentMembers >= j.maxMembers ? '#6B7280' : '#8B5CF6' }}>
                    {j.currentMembers}
                  </span>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>/ {j.maxMembers}</span>
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>명</p>
                <div className="mt-2 h-1.5 w-16 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(j.currentMembers / j.maxMembers) * 100}%`,
                      backgroundColor: j.currentMembers >= j.maxMembers ? '#6B7280' : '#8B5CF6',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 참여 버튼 */}
            {j.status !== '마감' && (
              <button
                className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98] min-h-[44px]"
                style={{ backgroundColor: '#8B5CF6' }}
                onClick={() => alert('로그인 후 참여할 수 있습니다')}
              >
                🙋 참여 신청하기 (남은 자리 {j.maxMembers - j.currentMembers}명)
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="mt-10 rounded-2xl p-6 text-center" style={{ backgroundColor: '#F8F7FF' }}>
        <p className="text-lg font-bold" style={{ color: '#111' }}>혼자 가기 심심하면?</p>
        <p className="mt-1 text-sm" style={{ color: '#555' }}>
          조각 모집으로 같이 갈 사람을 구하세요. 포인트를 모아서 직접 조각을 열 수도 있어요.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2" style={{ backgroundColor: '#8B5CF6', color: '#fff' }}>
          <span className="text-sm">조각 글 작성 필요 포인트</span>
          <span className="text-lg font-extrabold">{MIN_POINTS_TO_POST}P</span>
        </div>
      </div>
    </div>
  );
}
