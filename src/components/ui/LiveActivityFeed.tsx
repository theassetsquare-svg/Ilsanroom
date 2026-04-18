import { useState, useEffect, useRef } from 'react';

/* ── 활동 유형별 템플릿 ── */
const ACTIONS = [
  (n: string, v: string) => `${n}님이 ${v} 후기를 작성했어요`,
  (n: string, v: string) => `${n}님이 ${v}에 좋아요를 눌렀어요`,
  (n: string, v: string) => `${n}님이 ${v} 페이지를 보는 중`,
  (n: string) => `${n}님이 자유게시판에 글을 올렸어요`,
  (n: string) => `${n}님이 커뮤니티에 댓글을 달았어요`,
  (n: string) => `${n}님이 조각모임에 참여 신청했어요`,
  (n: string, v: string) => `${n}님이 ${v} 정보를 확인했어요`,
  (n: string) => `${n}님이 꿀팁 게시판에 글을 올렸어요`,
  (n: string, v: string) => `${n}님이 ${v}를 즐겨찾기 했어요`,
  (n: string) => `${n}님이 방금 가입했어요`,
  (n: string) => `${n}님이 프로필 사진을 변경했어요`,
  (n: string, v: string) => `${n}님이 ${v} 예약 문의를 했어요`,
  (n: string) => `${n}님이 오늘 밤 추천 투표에 참여했어요`,
  (n: string, v: string) => `${n}님이 ${v} 후기에 공감했어요`,
  (n: string) => `${n}님이 룰렛을 돌렸어요`,
];

const NICKNAMES = [
  '강남불주먹', '홍대댄싱퀸', '수원밤도깨비', '압구정소주한잔', '부산갈매기',
  '일산달빛', '대구텐션왕', '인천새벽별', '클럽요정', '나이트올빼미',
  '라운지고양이', '새벽감성러', '금요일중독', '토요일전사', '해운대파도',
  '댄스머신88', '양주감별사', '부스VIP', '분위기메이커', '불금전도사',
  '택시비파산', '마이크독점', '하이볼중독', '춤신춤왕', '강남토박이',
  '홍대프리터', '부산서면', '새벽4시반', '편의점라면', '포장마차단골',
  '직장인밤문화', '퇴근후직행', '소개팅후클럽', '오늘만마지막', '클럽왕초보',
  '파티피플', '단골인증', '첫방문기념', '텐션폭발', '바이브장인',
  '살사초보', 'EDM중독자', '트로트매니아', '발라드감성', '칵테일요리사',
  '월급루팡', '즐기자오늘밤', '프로야식러', '놀줄아는어른', '내일은후회',
];

/* ── 카테고리별 업소 이름 풀 ── */
const VENUES_BY_CAT: Record<string, string[]> = {
  club: ['강남클럽 레이스', '강남클럽 아르쥬', '홍대클럽 버뮤다', '압구정클럽 하입', '이태원클럽 유토피아', '홍대클럽 퍼시픽', '청담클럽 사운드'],
  night: ['수원찬스돔나이트', '부산연산동물나이트', '성남샴푸나이트', '파주야당스카이돔', '일산샴푸나이트', '대구한국관나이트', '울산챔피언나이트'],
  lounge: ['압구정라운지 디엠', '압구정이디엇라운지', '청담라운지', '이태원스피크이지', '강남바 멜로우'],
  room: ['일산룸', '해운대고구려', '강남룸살롱', '건대룸', '분당퐁퐁룸', '홍대프라이빗'],
  yojeong: ['일산명월관요정', '종로요정', '강남요정', '여의도요정', '대전요정', '부산요정'],
  hoppa: ['강남호빠 로얄', '강남호빠 어게인', '부산호빠 스타', '해운대호빠 깐따삐야', '장안동호빠 빵빵', '수원호빠 비스트'],
  all: [
    '강남클럽 레이스', '강남클럽 아르쥬', '홍대클럽 버뮤다', '수원찬스돔나이트',
    '해운대고구려', '일산룸', '일산명월관요정', '압구정클럽 하입',
    '성남샴푸나이트', '대구한국관나이트', '부산연산동물나이트', '강남호빠 로얄',
    '인천나이트', '울산챔피언나이트', '대전나이트', '광주클럽', '파주야당스카이돔',
    '압구정라운지 디엠', '부산호빠 스타', '장안동호빠 빵빵',
  ],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateActivity(category?: string): { text: string; time: string } {
  const nick = pick(NICKNAMES);
  const venues = VENUES_BY_CAT[category || 'all'] || VENUES_BY_CAT.all;
  const venue = pick(venues);
  const action = pick(ACTIONS);
  const mins = Math.floor(Math.random() * 8) + 1;
  return { text: action(nick, venue), time: `${mins}분 전` };
}

interface Props {
  maxItems?: number;
  interval?: number;
  compact?: boolean;
  className?: string;
  /** 카테고리별 관련 업소만 표시 (club, night, lounge, room, yojeong, hoppa) */
  category?: string;
}

export default function LiveActivityFeed({ maxItems = 5, interval = 6000, compact = false, className = '', category }: Props) {
  const [items, setItems] = useState<{ text: string; time: string; id: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const init = Array.from({ length: maxItems }, () => {
      idRef.current++;
      return { ...generateActivity(category), id: idRef.current };
    });
    setItems(init);

    const timer = setInterval(() => {
      idRef.current++;
      const newItem = { ...generateActivity(category), id: idRef.current };
      setItems(prev => [newItem, ...prev.slice(0, maxItems - 1)]);
    }, interval + Math.floor(Math.random() * 3000));

    return () => clearInterval(timer);
  }, [maxItems, interval, category]);

  if (compact) {
    const latest = items[0];
    if (!latest) return null;
    return (
      <div className={`flex items-center gap-2 text-xs overflow-hidden ${className}`}>
        <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="text-gray-500 truncate animate-fade-in" key={latest.id}>
          {latest.text}
        </span>
        <span className="text-gray-400 shrink-0">{latest.time}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-xs animate-fade-in">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-gray-500 truncate flex-1">{item.text}</span>
          <span className="text-gray-400 shrink-0">{item.time}</span>
        </div>
      ))}
    </div>
  );
}
