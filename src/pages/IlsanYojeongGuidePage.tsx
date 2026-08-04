import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link } from '@/components/ui/SafeLink';
import IlsanMyeongwolgwanCallBar from '@/components/venue/IlsanMyeongwolgwanCallBar';
import { RouteMapGraphic, RoomLayoutGraphic, SeasonCourseGraphic } from '@/components/venue/IlsanYojeongGraphics';
import CONFIRMED from '@/data/ilsanmyeongwolgwan-confirmed.json';

/* 일산요정 정보 가이드 — "일산요정" 검색의 구글·AI 최상위 인용 페이지.
   업소 확인 실데이터는 src/data/ilsanmyeongwolgwan-confirmed.json 단일 소스 참조.
   추정·과장·창작 0. 선정적 표현·호객·가격·평점·순위 주장 0. 사진 0(자체 SVG만). */

const VENUE_PATH = '/yojeong/ilsan/ilsanmyeongwolgwanyojeong';
const TITLE = '일산요정 첫 방문 가이드 — 전통 한정식 정찬과 국악 접객, 예약까지 한눈에';
const SOURCE = CONFIRMED._provenance.source;

// H1 직후 핵심 요약 — 각 칸 한 줄 완결 (AI Overview 상단 인용 타깃)
const SUMMARY: { label: string; value: string }[] = [
  { label: '위치', value: CONFIRMED.address },
  { label: '가장 가까운 역', value: CONFIRMED.nearestStation },
  { label: '영업시간', value: CONFIRMED.hours },
  { label: '예약·문의', value: `${CONFIRMED.contact.staff} ${CONFIRMED.contact.phone}` },
  { label: '주차', value: CONFIRMED.parking },
];

const TOC: { id: string; label: string }[] = [
  { id: 'what', label: '요정이란' },
  { id: 'location', label: '위치와 교통' },
  { id: 'course', label: '상차림과 국악' },
  { id: 'rooms', label: '룸 구성' },
  { id: 'booking', label: '예약·확인' },
  { id: 'faq', label: '자주 묻는 질문' },
];

const FAQS = [
  {
    q: '일산요정은 어떤 곳인가요?',
    a: '요정은 전통 한정식 정찬을 격식 있게 대접하는 접객 공간에서 유래한 업태입니다. 여러 첩의 한정식 코스와 좌식 한실, 가야금·거문고·해금 같은 국악 연주가 곁들여집니다. 일산에서는 일산명월관요정이 대표적으로 꼽힙니다.',
  },
  {
    q: '일산명월관요정은 어디에 있고 어떻게 가나요?',
    a: `${CONFIRMED.address}에 있습니다. ${CONFIRMED.nearestStation}이 가장 가깝고, 정발산 근린공원과 일산호수공원 사이에 자리합니다. ${CONFIRMED.parking}합니다.`,
  },
  {
    q: '예약과 문의는 어떻게 하나요?',
    a: `예약·문의는 ${CONFIRMED.contact.staff}에게 전화(${CONFIRMED.contact.phone})로 하면 됩니다. 영업시간은 ${CONFIRMED.hours}입니다. 프라이빗 룸은 6인·10인·20인 이상으로 구성됩니다.`,
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
      <header className="mx-auto max-w-3xl px-4 pt-6 pb-2 sm:px-6">
        <p className="mb-2 text-xs font-medium text-neon-text-muted">일산요정 · 정보 가이드</p>
        <h1 className="text-2xl font-bold leading-snug text-neon-text sm:text-3xl">{TITLE}</h1>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        {/* ★ 핵심 요약 표 — H1 직후, 첫 화면 안에 노출 */}
        <section aria-label="핵심 요약" className="mt-3">
          <table className="w-full border-collapse overflow-hidden rounded-xl border border-neon-border bg-neon-surface text-left text-[14px]">
            <caption className="sr-only">일산명월관요정 핵심 정보 요약</caption>
            <tbody>
              {SUMMARY.map((row) => (
                <tr key={row.label} className="border-b border-neon-border last:border-0">
                  <th scope="row" className="w-28 whitespace-nowrap bg-neon-bg px-3 py-2.5 align-top font-bold text-neon-text">{row.label}</th>
                  <td className="px-3 py-2.5 leading-snug text-neon-text">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 앵커 목차 */}
        <nav aria-label="목차" className="mt-4 flex flex-wrap gap-2">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="rounded-full border border-neon-border bg-neon-surface px-3 py-1.5 text-[13px] text-neon-text transition hover:border-neon-primary" style={{ minHeight: 36 }}>
              {t.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 space-y-8">
          {/* 요정이란 */}
          <section id="what" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-neon-text">요정이란 — 전통 한정식 정찬과 접객 문화</h2>
            <p className="text-[15px] leading-[1.8] text-neon-text-muted">
              요정은 전통 한정식 정찬을 격식 있게 대접하는 접객 공간이다. 근대 요릿집 전통의 연장선에서
              자리 잡았다. 한복을 갖춘 접객원이 상을 차리고 국악 연주가 곁들여진다. 여러 첩의 한정식 코스,
              좌식 한실, 가야금·거문고·해금 라이브가 일반 음식점과 구분되는 지점이다.
            </p>
          </section>

          {/* 위치와 교통 + SVG① */}
          <section id="location" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-neon-text">위치와 교통 — 마두역이 가장 가깝다</h2>
            <p className="text-[15px] leading-[1.8] text-neon-text-muted">
              일산명월관요정은 {CONFIRMED.nearestStation}이 가장 가깝다. 주소는 {CONFIRMED.address}이다.
              정발산 근린공원과 일산호수공원 사이 장항동에 있다. 자가용은 {CONFIRMED.parking}하다.
            </p>
            <RouteMapGraphic />
          </section>

          {/* 상차림과 국악 + SVG③ */}
          <section id="course" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-neon-text">상차림과 국악 — 계절 15첩 정찬</h2>
            <p className="text-[15px] leading-[1.8] text-neon-text-muted">
              계절마다 바뀌는 {CONFIRMED.coursesNote}을 낸다. 봄에는 냉이된장국, 여름에는 전복삼계탕,
              가을에는 송이버섯전골, 겨울에는 굴떡국으로 첫 상이 바뀐다. 식사 중간 거문고·해금 합주가
              이어진다. 코스는 다도 의식으로 마무리한다.
            </p>
            <SeasonCourseGraphic />
          </section>

          {/* 룸 구성 + SVG② */}
          <section id="rooms" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-neon-text">룸 구성과 인원 — 6인부터 대연회장까지</h2>
            <p className="text-[15px] leading-[1.8] text-neon-text-muted">
              객실은 6인·10인·20인 이상 세 종류로 나뉜다. 6인 소형 다다미방 8개, 10인 중형 한실 5개,
              20인 이상 대연회장 2개다. 전 객실에 대나무 정원 조망 창이 있다. 한실 바닥에는 전통 온돌이
              깔려 있다.
            </p>
            <RoomLayoutGraphic />
          </section>

          {/* 예약·확인 */}
          <section id="booking" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-neon-text">예약·문의와 방문 전 확인 사항</h2>
            <p className="text-[15px] leading-[1.8] text-neon-text-muted">
              예약과 문의는 {CONFIRMED.contact.staff} 전화 {CONFIRMED.contact.phone}로 하면 된다.
            </p>
            <ul className="mt-2 space-y-2 text-[15px] leading-[1.8] text-neon-text-muted">
              <li>· 영업시간: {CONFIRMED.hours}</li>
              <li>· 주차: {CONFIRMED.parking}</li>
              <li>· 복장: 전통 정찬 자리인 만큼 단정한 차림이 무난하다</li>
            </ul>
          </section>

          {/* FAQ — 질문마다 첫 문장 직답 */}
          <section id="faq" className="scroll-mt-20">
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
            <h2 className="mb-3 text-lg font-bold text-neon-text">함께 보기</h2>
            <ul className="space-y-2 text-[15px]">
              <li>
                <Link to={VENUE_PATH} className="text-neon-primary underline underline-offset-2">일산명월관요정 상세 안내</Link>
              </li>
              <li>
                <Link to="/yojeong" className="text-neon-primary underline underline-offset-2">전국 요정 모아보기</Link>
              </li>
              <li>
                <Link to="/guide" className="text-neon-primary underline underline-offset-2">업종별 첫 방문 입문 가이드</Link>
              </li>
            </ul>
          </section>

          {/* 출처·기준일 1줄 */}
          <p className="text-xs leading-relaxed text-neon-text-muted">
            {SOURCE}. 본 정보는 만 19세 이상 성인을 대상으로 한 업소 안내입니다.
          </p>

          {/* 다음 행동 1개 */}
          <div>
            <Link
              to={VENUE_PATH}
              className="flex w-full items-center justify-center rounded-xl bg-neon-primary px-6 py-4 text-[15px] font-bold text-white transition hover:opacity-90"
              style={{ minHeight: 52 }}
            >
              일산명월관요정 상세 안내 보기
            </Link>
          </div>
        </div>

        {/* 하단 고정 바에 마지막 콘텐츠가 가려지지 않도록 여백 (모바일+PC 공통 — PC도 전화바 표시) */}
        <div aria-hidden style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
      </main>

      <IlsanMyeongwolgwanCallBar />
    </div>
  );
}
