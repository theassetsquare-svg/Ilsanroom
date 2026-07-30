import CONFIRMED from '@/data/ilsanmyeongwolgwan-confirmed.json';

/* 일산요정 가이드 자체 제작 인라인 SVG 정보 그래픽 3종.
   외부 이미지 요청 0 · 사람/스톡 사진 0 · 선정적 요소 0.
   놀쿨 디자인 토큰(#7C3AED primary · #0E7490 accent · #111 text · #D1D5DB border)로 통일.
   각 컨테이너 aspect-ratio 고정 → CLS 0. role=img + <title>/<desc> + figcaption 로 접근성/정직성 확보. */

const C = { primary: '#7C3AED', accent: '#0E7490', text: '#111111', muted: '#6B7280', border: '#D1D5DB', surface: '#FFFFFF', bg: '#F5F5F5' };
const CAP = '업소 제공 정보 기준 · 2026-07-30 업소 확인';

function Figure({ children, w, h, label, caption }: { children: React.ReactNode; w: number; h: number; label: string; caption: string }) {
  return (
    <figure className="my-4 rounded-xl border border-neon-border bg-neon-surface p-3">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${w} / ${h}` }}>
        {children}
      </svg>
      <figcaption className="mt-2 text-xs leading-relaxed text-neon-text-muted">{caption}</figcaption>
    </figure>
  );
}

/* ① 마두역 → 업소 도보 동선 개념도 */
export function RouteMapGraphic() {
  return (
    <Figure w={360} h={130} label="지하철 3호선 마두역에서 일산명월관요정까지 도보 동선 개념도. 정발산 근린공원과 일산호수공원 사이 장항동에 위치하며 발렛 주차가 가능하다." caption={`3호선 마두역 → 일산명월관요정(장항동 895-1 B1층). 정발산 근린공원·일산호수공원 인접, 발렛 주차 가능. · ${CAP}`}>
      <title>마두역에서 일산명월관요정까지 도보 동선</title>
      <desc>왼쪽 마두역 노드에서 점선 도보 경로를 따라 오른쪽 일산명월관요정 노드로 이어진다. 위쪽에 정발산 근린공원과 일산호수공원 지형지물이 표시된다.</desc>
      {/* 지형지물 */}
      <text x="80" y="20" fontSize="11" fill={C.muted} textAnchor="middle">정발산 근린공원</text>
      <text x="280" y="20" fontSize="11" fill={C.muted} textAnchor="middle">일산호수공원</text>
      {/* 도보 경로 (점선) */}
      <line x1="92" y1="72" x2="250" y2="72" stroke={C.accent} strokeWidth="2.5" strokeDasharray="6 5" />
      <text x="171" y="63" fontSize="11" fill={C.accent} textAnchor="middle">도보</text>
      {/* 마두역 노드 */}
      <rect x="14" y="52" width="78" height="40" rx="8" fill={C.surface} stroke={C.border} strokeWidth="1.5" />
      <text x="53" y="70" fontSize="13" fontWeight="700" fill={C.text} textAnchor="middle">마두역</text>
      <text x="53" y="84" fontSize="10" fill={C.muted} textAnchor="middle">3호선</text>
      {/* 업소 노드 */}
      <rect x="250" y="48" width="98" height="48" rx="8" fill={C.primary} />
      <text x="299" y="68" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">일산명월관요정</text>
      <text x="299" y="84" fontSize="10" fill="#EDE9FE" textAnchor="middle">장항동 895-1 B1 · 발렛</text>
      {/* 방향 화살표 */}
      <path d="M243 72 l8 -4 v8 z" fill={C.accent} />
    </Figure>
  );
}

/* ② 객실 구성 도식 — 크기 비교 */
export function RoomLayoutGraphic() {
  const rooms = CONFIRMED.rooms;
  // 수용 인원에 비례해 박스 높이 시각화
  const heights = [46, 62, 92];
  const xs = [24, 138, 252];
  const widths = [84, 84, 96];
  return (
    <Figure w={360} h={150} label={`객실 구성 도식. 6인 소형 다다미방 8개, 10인 중형 한실 5개, 20인 이상 대연회장 2개를 수용 인원 크기 순으로 비교한다.`} caption={`객실 3종 — ${rooms.map(r => `${r.capacity} ${r.type} ${r.count}개`).join(' · ')}. · ${CAP}`}>
      <title>일산명월관요정 객실 구성</title>
      <desc>수용 인원이 큰 순서로 소형 다다미방, 중형 한실, 대연회장 세 종류의 상대 크기를 막대로 비교한다.</desc>
      <line x1="12" y1="126" x2="348" y2="126" stroke={C.border} strokeWidth="1" />
      {rooms.map((r, i) => {
        const hgt = heights[i];
        const y = 122 - hgt;
        return (
          <g key={r.type}>
            <rect x={xs[i]} y={y} width={widths[i]} height={hgt} rx="6" fill={i === 2 ? C.primary : C.accent} opacity={i === 2 ? 1 : 0.85 - i * 0.1} />
            <text x={xs[i] + widths[i] / 2} y={y - 6} fontSize="12" fontWeight="700" fill={C.text} textAnchor="middle">{r.capacity}</text>
            <text x={xs[i] + widths[i] / 2} y="140" fontSize="10.5" fill={C.muted} textAnchor="middle">{r.type} {r.count}개</text>
          </g>
        );
      })}
    </Figure>
  );
}

/* ③ 계절 코스 표 — 4칸 (확인된 메뉴명만) */
export function SeasonCourseGraphic() {
  const courses = CONFIRMED.courses;
  const colW = 88;
  const startX = 4;
  return (
    <Figure w={360} h={110} label={`계절 코스 표. ${courses.map(c => `${c.season} ${c.menu}`).join(', ')}. 계절별 15첩 궁중 상차림의 첫 상 메뉴다.`} caption={`계절별 15첩 궁중 상차림 첫 상 — ${courses.map(c => `${c.season} ${c.menu}`).join(' · ')}. · ${CAP}`}>
      <title>일산명월관요정 계절 코스</title>
      <desc>봄, 여름, 가을, 겨울 네 칸에 계절별 첫 상 메뉴가 표로 정리돼 있다.</desc>
      {courses.map((c, i) => {
        const x = startX + i * (colW + 2);
        return (
          <g key={c.season}>
            <rect x={x} y="8" width={colW} height="26" rx="5" fill={C.primary} />
            <text x={x + colW / 2} y="26" fontSize="13" fontWeight="700" fill="#FFFFFF" textAnchor="middle">{c.season}</text>
            <rect x={x} y="38" width={colW} height="60" rx="5" fill={C.surface} stroke={C.border} strokeWidth="1.2" />
            <text x={x + colW / 2} y="73" fontSize="12" fill={C.text} textAnchor="middle">{c.menu}</text>
          </g>
        );
      })}
    </Figure>
  );
}
