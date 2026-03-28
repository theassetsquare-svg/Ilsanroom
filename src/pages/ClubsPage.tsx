
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'sinchon', label: '신촌' }, { key: 'geondae', label: '건대' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'incheon', label: '인천' }, { key: 'suwon', label: '수원' }, { key: 'jeju', label: '제주' },
];

export default function ClubsPage() {
  useDocumentMeta('금요일 밤 줄 50m, 그래도 들어가야 하는 이유 | 플밤', '강남·홍대·이태원 EDM 파티 공간 35곳. 드레스코드부터 입장 팁까지 솔직하게 비교했다.');
  const venues = getVenuesByCategory('club');
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '클럽' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">전국 EDM · 힙합 파티 공간</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            금요일 밤 11시. 강남 한복판 지하로 내려가는 계단에 줄이 50m다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            문이 열리는 순간 베이스가 가슴을 때린다. 조명이 천장에서 바닥까지 쏟아지고, DJ가 턴테이블 위에서 손을 올리면 500명이 동시에 점프한다. 이게 EDM 파티 공간의 진짜 매력이다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            강남·청담 쪽 대형 베뉴는 1,000명 넘게 들어가는 메가 플로어를 운영한다. 해외 게스트 DJ가 정기적으로 오고, 사운드 시스템은 일본·유럽에서 직수입한 장비를 쓴다. 테이블을 잡으면 전담 스태프가 붙고, 일반 입장은 바 카운터에서 음료 하나 들고 플로어로 합류하면 된다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            홍대 쪽은 분위기가 다르다. 200~300명 규모 중소형 공간에서 인디·얼터너티브 장르가 섞인다. 입장료가 강남 절반 수준이고, 분위기가 자유로워서 처음 가는 사람도 어색하지 않다. 이태원은 외국인 비율이 높아서 영어가 섞인 다국적 파티 느낌이다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            드레스코드는 업소마다 다르니까 가기 전에 확인하자. 슬리퍼·운동복은 거의 다 안 된다. 셔츠에 슬랙스면 어디든 무난하다. 금토 자정 이후가 피크 타임이고, 목요일은 레이디스 나이트로 여성 무료 입장하는 곳도 있다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/clubs/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="EDM 파티 공간"
        dress="스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼·운동복 입장 제한. 여성은 드레스나 블라우스+스커트."
        budget="입장료 2~3만원 + 음료 1~2만원. 테이블 예약 시 35~50만원+ (주말). 평일은 상대적으로 저렴."
        alone="혼자 방문 가능. 바 카운터에서 음료 마시며 분위기 즐기다 댄스플로어 합류하면 됨."
        reservation="테이블은 사전 예약 권장. 일반 입장은 현장 대기. 주말은 0시 이후 대기 길어질 수 있음."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '23:00~03:00', level: 90 },
        { day: '토요일', time: '23:00~04:00', level: 100 },
        { day: '일요일', time: '22:00~02:00', level: 50 },
        { day: '목요일', time: '23:00~02:00', level: 60 },
        { day: '수요일', time: '22:00~01:00', level: 30 },
      ]} />

      <CategoryVSBattle venueA="청담 레이스" venueB="압구정 하입" topic="강남 vs 압구정 — EDM 파티 대결" />

      <RelatedMagazine articles={[
        { title: '논현 EDM TOP5 — 올해 꼭 가봐야 할 곳', tag: '추천' },
        { title: '홍대 vs 이태원 — 어디가 나에게 맞을까?', tag: '비교' },
      ]} />
    </div>
  );
}
