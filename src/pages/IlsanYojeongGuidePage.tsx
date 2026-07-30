import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link } from '@/components/ui/SafeLink';
import IlsanMyeongwolgwanCallBar from '@/components/venue/IlsanMyeongwolgwanCallBar';

/* 일산요정 정보 가이드 — 검색자가 실제로 알고 싶은 사실만.
   모든 매장 정보는 src/data/venues.ts 의 일산명월관요정(v-003) 실데이터에서만 가져온다.
   추정·과장·창작 0. 선정적 표현·호객·가격·평점·순위 주장 없음. */

const VENUE_PATH = '/yojeong/ilsan/ilsanmyeongwolgwanyojeong';
const TITLE = '일산요정 첫 방문 가이드 — 전통 한정식 정찬과 국악 접객, 예약까지 한눈에';

const FAQS = [
  {
    q: '일산요정은 어떤 곳인가요?',
    a: '전통 한정식 정찬을 격식 있게 즐기는 접객 공간에서 유래한 업태입니다. 여러 첩의 한정식 코스와 좌식 한실, 가야금·거문고·해금 같은 국악 연주가 곁들여지는 정찬 문화가 일반 음식점과 구분되는 지점입니다. 일산에서는 일산명월관요정이 대표적으로 꼽힙니다.',
  },
  {
    q: '일산명월관요정은 어디에 있고 어떻게 가나요?',
    a: '경기도 고양시 일산동구 장항동 895-1 B1층에 있습니다. 지하철 3호선 마두역이 가장 가깝고, 정발산 근린공원과 일산호수공원 사이에 자리합니다. 발렛 주차가 가능합니다.',
  },
  {
    q: '예약과 문의는 어떻게 하나요?',
    a: '예약·문의는 신실장에게 전화(010-3695-4929)로 하면 됩니다. 영업시간은 월요일부터 토요일까지 오후 5시부터 익일 오전 2시까지이며, 일요일은 휴무입니다. 프라이빗 룸은 6인·10인·20인 이상으로 구성됩니다.',
  },
];

export default function IlsanYojeongGuidePage() {
  useDocumentMeta(
    TITLE,
    '일산요정 첫 방문이라 막막하다면? 전통 한정식 15첩 정찬과 거문고·해금 국악, 한복 접객의 격식부터 마두역 인근 위치와 예약·주차까지, 일산명월관요정 실정보 기준으로 담백하게 짚었다.',
  );

  return (
    <div className="bg-neon-bg">
      {/* HERO — H1은 title과 완전히 동일한 문장 */}
      <header className="mx-auto max-w-3xl px-4 pt-8 pb-4 sm:px-6">
        <p className="mb-3 text-xs font-medium text-neon-text-muted">일산요정 · 정보 가이드</p>
        <h1 className="text-2xl font-bold leading-snug text-neon-text sm:text-3xl">{TITLE}</h1>
        <p className="mt-4 text-[15px] leading-[1.8] text-neon-text-muted">
          일산에서 요정 정찬 자리를 알아보는 분들이 실제로 궁금해하는 것만 모았다. 요정이라는 업태의 유래와
          접객 문화, 위치와 교통, 예약 방법, 방문 전 확인하면 좋은 사실을 순서대로 정리했다.
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-10 sm:px-6">
        {/* 1. 요정이란 — 전통 유래 + 한복 접객 문화 맥락 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">요정이란 — 전통 한정식 정찬과 접객 문화</h2>
          <p className="text-[15px] leading-[1.8] text-neon-text-muted">
            요정은 전통 한정식 정찬을 격식 있게 대접하는 접객 공간에서 이어져 온 업태다. 근대 요릿집 전통의
            연장선에서, 한복을 갖춘 접객원이 상을 차리고 국악 연주가 곁들여지는 정찬 문화가 자리 잡았다.
            여러 첩으로 구성된 한정식 코스, 좌식 한실, 가야금·거문고·해금 같은 국악 라이브가 요정을 일반
            음식점과 구분 짓는 요소다. 거래처를 모시거나 격식이 필요한 자리에서 주로 찾는다.
          </p>
        </section>

        {/* 2. 위치·교통 — 실데이터만 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">일산에서 요정을 찾는다면 — 위치와 교통</h2>
          <p className="text-[15px] leading-[1.8] text-neon-text-muted">
            일산에서 요정 정찬 자리로 대표적으로 꼽히는 곳이 일산명월관요정이다. 주소는 경기도 고양시
            일산동구 장항동 895-1 B1층이며, 지하철 3호선 마두역이 가장 가까운 역이다. 정발산 근린공원과
            일산호수공원 사이 장항동에 자리해, 식사 전후로 호수공원 산책 코스를 엮기 좋다. 자가용으로 오면
            발렛 주차가 가능하다.
          </p>
        </section>

        {/* 3. 상차림·국악 — venue description 실데이터 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">상차림과 국악 — 계절 코스와 다도 마무리</h2>
          <p className="text-[15px] leading-[1.8] text-neon-text-muted">
            일산명월관요정은 계절마다 식재료를 바꾸는 15첩 궁중 상차림을 낸다. 봄에는 냉이된장국, 여름에는
            전복삼계탕, 가을에는 송이버섯전골, 겨울에는 굴떡국으로 첫 상이 바뀐다. 식사 중간중간 거문고와
            해금 합주가 이어지고, 코스는 다도 의식으로 마무리한다. 전통주로는 백세주와 법주 등을 기본으로
            낸다.
          </p>
        </section>

        {/* 4. 룸 구성·인원 — roomInfo 실데이터 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">룸 구성과 인원 — 소형부터 대연회장까지</h2>
          <p className="text-[15px] leading-[1.8] text-neon-text-muted">
            객실은 6인 소형 다다미방 8개, 10인 중형 한실 5개, 20인 이상을 수용하는 대연회장 2개로
            구성된다. 전 객실에 대나무 정원을 바라보는 창이 나 있고, 한실 바닥에는 전통 온돌이 깔려 있다.
            대연회장에는 거문고·해금 합주가 가능한 전용 무대가 있다. 인원과 목적에 맞는 방은 예약할 때
            함께 확인하면 된다.
          </p>
        </section>

        {/* 5. 예약·방문 전 체크 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">예약·문의와 방문 전 확인 사항</h2>
          <ul className="space-y-2 text-[15px] leading-[1.8] text-neon-text-muted">
            <li>· 예약·문의: 신실장 전화 010-3695-4929</li>
            <li>· 영업시간: 월요일~토요일 오후 5시 ~ 익일 오전 2시 / 일요일 휴무</li>
            <li>· 주차: 발렛 주차 가능</li>
            <li>· 복장: 전통 정찬 자리인 만큼 단정한 차림이 무난하다</li>
          </ul>
        </section>

        {/* 6. FAQ — 화면 dl 과 FAQPage JSON-LD 동일 소스 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">자주 묻는 질문</h2>
          <dl className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-neon-border bg-neon-surface p-4">
                <dt className="text-[15px] font-bold text-neon-text">Q. {f.q}</dt>
                <dd className="mt-2 text-[15px] leading-[1.8] text-neon-text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 내부 링크 — 양방향 연결(고립 페이지 방지) */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-neon-text">더 자세히 보기</h2>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link to={VENUE_PATH} className="text-neon-primary underline underline-offset-2">
                일산명월관요정 상세 안내 — 상차림·룸·국악 구성 전체 보기
              </Link>
            </li>
            <li>
              <Link to="/yojeong" className="text-neon-primary underline underline-offset-2">
                전국 요정 모아보기
              </Link>
            </li>
            <li>
              <Link to="/guide" className="text-neon-primary underline underline-offset-2">
                업종별 첫 방문 입문 가이드
              </Link>
            </li>
          </ul>
        </section>

        {/* 19+ 고지 — 담백하게 1줄 */}
        <p className="text-xs leading-relaxed text-neon-text-muted">
          본 정보는 만 19세 이상 성인을 대상으로 한 업소 안내입니다.
        </p>

        {/* 하단 고정 바에 마지막 콘텐츠가 가려지지 않도록 모바일 전용 여백 */}
        <div aria-hidden className="md:hidden" style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }} />
      </main>

      <IlsanMyeongwolgwanCallBar />
    </div>
  );
}
