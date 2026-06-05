/**
 * 지역×업종 교차 페이지 후킹 title 24h 회귀 watch (시즌96 — 오늘 작업 자동화).
 * 매일 KST 09:05 — /region/{지역}/{업종} 교차 페이지 전수 라이브 점검 → 회귀시만 메일.
 *
 * 배경:
 *   generic "지역 나이트/클럽/호빠" 노다지(4~15위) 검색의 CTR을 끌어올리려고
 *   모든 교차 페이지의 약한 공용 title("…한눈에 비교하고 고르기")을 CROSS_SIG 후킹 카피로 교체.
 *   이 watch는 그 카피가 라이브에서 풀리거나(템플릿 복귀) 깨지지 않는지 매일 확인한다.
 *
 * 페이지당 검사:
 *   1) HTTP 200
 *   2) title에 CROSS_SIG 후킹 tail 포함 (= 후킹 카피 적용 확인)
 *   3) title에 약한 템플릿 "한눈에 비교하고 고르기" 미포함 (= 회귀 마커)
 *   4) title ≤60자
 *   5) title 중복단어 없음
 *   6) 후킹 5축 ≥1축 (analyzeHook)
 * 전수 후:
 *   7) 후미 5어절 사이트 교차 페이지 내 unique (#0 차별화 룰)
 *
 * 환경:
 *   RESEND_API_KEY     필수(없으면 메일 skip)
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';
import { analyzeHook } from './lib/hook-detector.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const BASE = 'https://nolcool.com';
const TEMPLATE_MARKER = '한눈에 비교하고 고르기';

// 업종 → URL path 세그먼트 (prerender catMap 기준)
const CAT_PATH = { night: 'nights', club: 'clubs', hoppa: 'hoppa', yojeong: 'yojeong', room: 'rooms', lounge: 'lounges' };

// prerender-seo.mjs CROSS_SIG 의 후킹 tail (라이브가 이걸 유지해야 함)
const CROSS_SIG = {
  night: {
    '광주': '상무지구 새벽까지 합석 도는 코스', '대전': '둔산동 부킹 제대로 잡는 웨이터 라인',
    '대구': '동성로 피크에 합석 몰리는 자리', '노원': '막차 전 동북권 합석 붙는 거점',
    '김포': '한강신도시 토박이 합석 도는 코스', '수원': '인계동 새벽 부킹 가장 센 라인',
    '성남': '모란 웨이터가 합석 척척 붙이는 자리', '부천': '7호선 환승객 합석 회전 빠른 거점',
    '안산': '중앙역 단골이 합석 빠르다 찍은 곳', '천안': '신부동 단골 합석 회전 도는 자리',
    '청주': '성안길 웨이터가 합석 바로 잡아주는 라인', '부산': '서면 새벽 합석 가장 활발한 거점',
    '울산': '삼산동 토박이 합석 빠른 라인', '일산': '호수공원 코스 끝에 합석 잡는 자리',
    '청담': '명품거리 멤버십 부킹 비공개 라인', '강남': '역삼 새벽 부킹 가장 센 거점',
    '신림': '순환 라인 솔로도 합석 붙는 자리', '수유': '북한산 산행 끝에 합석 푸는 거점',
    '독산': '가산 야근족 퇴근하고 합석 붙는 라인', '강서': '발산역 토박이 합석 척척 붙는 코스',
    '길동': '천호 라인 합석 빠르게 도는 거점', '파주': '운정 토박이 합석 회전 도는 자리',
    '화정': '덕양 단골 합석 빠르다는 코스', '구리': '돌다리 동북권 합석 몰리는 라인',
    '오산': '운암동 토박이 합석 자주 붙는 거점', '분당': '서현 평일 저녁 합석 천천히 익는 라인',
    '평택': '소사벌 야근족 퇴근하고 합석 코스', '인천': '구월동 토박이 합석 빠른 자리',
    '서산': '시내 토박이 합석 자주 도는 거점', '구미': '원평동 단골 합석 자주 붙는 라인',
    '제주': '시청 일대 관광객 섞여 합석 도는 거점', '창원': '상남동 피크에 합석 몰리는 자리',
    '부산 연산동': '라이브 무대 끼고 합석 도는 거점', '상봉동': '망우로 동북권 합석 도는 코스',
    '답십리': '장한평 단골 합석 빠른 자리', '영등포': '타임스퀘어 끼고 합석 피크 도는 라인',
    '의정부': '1호선 막차까지 합석 도는 거점', '인덕원': '범계 라인 토박이 합석 빠른 코스',
  },
  club: {
    '용인': '죽전 게스트 부킹 도는 플로어', '인천': '송도 게스트 라인업 센 홀',
    '이태원': '외국인 게스트 새벽까지 노는 플로어', '일산': '호수 라인 게스트 만남 도는 자리',
    '강남': '신논현 게스트 부킹 회전 빠른 홀', '압구정': '로데오 멤버십 게스트 비공개 셋',
    '대전': '은행동 게스트 부킹 붙는 플로어', '홍대': '연남 라인 인디 게스트 섞이는 무대',
    '청주': '성안길 30대 클러버 모이는 플로어', '노원': '동북권 막차 전 게스트 도는 홀',
    '서울': '광역 클러버 게스트 한자리 비교', '의정부': '경전철 막차까지 게스트 노는 플로어',
    '용산': '한강뷰 옥상 게스트 같이 노는 자리', '부천': '7호선 환승 게스트 빠른 홀',
    '청담': '명품거리 멤버십 게스트 비공개 라인',
  },
  hoppa: {
    '장안동': '장한평 실장이 호스트 셀렉션 돕는 자리', '해운대': '해변 끝 실장 추천 호스트 라인',
    '강남': '역삼 실장 골라주는 호스트 코스', '수원': '인계동 실장이 호스트 붙여주는 자리',
    '대구': '동성로 실장 매칭 호스트 무대', '대전': '갤러리아 실장 호스트 셀렉션 라인',
    '홍대': '연남 실장 호스트 추천 도는 곳',
    '건대': '화양리 실장 골라주는 호스트 무대', '부산': '서면 실장 호스트 셀렉션 빠른 라인',
    '부산 해운대': '달맞이 실장 매칭 호스트 자리', '전주': '객사 실장 골라주는 호스트 코스',
  },
  yojeong: { '일산': '가야금 정찬 실장 모시는 만찬 코스' },
  room: { '일산': '양주 라인 실장이 룸 맞춰주는 자리', '부산 해운대': '광안대교 야경 끼고 룸 잡는 코스' },
  lounge: { '압구정': '로데오 칵테일바 조용한 만남 자리' },
};

function fetchHtml(url) {
  /* 일시적 5xx/timeout 1회 재시도 (false-positive 메일 방지) */
  const _once = () => new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, html: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolRegionCrossWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, html: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, html: '' }); });
  });
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

const lastNTokens = (title, n = 5) => {
  const tail = title.split(/[—\-:|]/).pop().trim();
  return tail.split(/\s+/).filter(Boolean).slice(-n).join(' ');
};

async function main() {
  const issues = [];
  const tailMap = new Map(); // 후미 5어절 → [url]
  let checked = 0;

  for (const [cat, regions] of Object.entries(CROSS_SIG)) {
    const path = CAT_PATH[cat];
    for (const [regionKo, sigTail] of Object.entries(regions)) {
      const url = `${BASE}/region/${encodeURIComponent(regionKo)}/${path}/`;
      const label = `${regionKo} ${cat}`;
      const r = await fetchHtml(url);
      checked++;
      if (r.status !== 200) { issues.push(`[${label}] HTTP ${r.status}`); continue; }

      const tm = r.html.match(/<title>([^<]+)<\/title>/);
      const title = tm ? tm[1].trim() : '';
      if (!title) { issues.push(`[${label}] title 없음`); continue; }

      if (title.includes(TEMPLATE_MARKER)) issues.push(`[${label}] 약한 템플릿 복귀 ("${TEMPLATE_MARKER}")`);
      if (!title.includes(sigTail)) issues.push(`[${label}] 후킹 tail 누락 ("${sigTail}") · 현재: ${title}`);
      if (title.length > 60) issues.push(`[${label}] title ${title.length}자 (>60)`);

      const words = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
      const dup = words.filter((w, i) => words.indexOf(w) !== i);
      if (dup.length) issues.push(`[${label}] title 중복단어 [${[...new Set(dup)].join(',')}]`);

      if (analyzeHook(title).axesHit === 0) issues.push(`[${label}] 후킹 5축 0`);

      const tail5 = lastNTokens(title);
      if (!tailMap.has(tail5)) tailMap.set(tail5, []);
      tailMap.get(tail5).push(label);
    }
  }

  for (const [tail5, labels] of tailMap) {
    if (labels.length > 1) issues.push(`후미 5어절 중복 "${tail5}" → ${labels.join(' / ')}`);
  }

  console.log(`지역×업종 교차 title watch — ${checked}개 페이지 점검`);
  console.log(`  회귀: ${issues.length}건`);
  for (const i of issues.slice(0, 30)) console.log('  -', i);

  if (issues.length > 0) {
    await sendMail({ issues, checked });
    process.exit(1);
  }
  console.log('✅ 전 교차 페이지 통과 — 메일 발송 안 함 (실패시만 정책)');
}

async function sendMail({ issues, checked }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 지역×업종 교차 title 회귀] ${issues.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} · 점검 ${checked}개 페이지</p>
    <p style="color:#666;font-size:13px">generic "지역+업종" 노다지 검색 CTR을 지키는 후킹 title이 풀렸습니다.</p>
    <h3>회귀 사유</h3>
    <ul>${issues.map(i => `<li style="color:#DC2626">${esc(i)}</li>`).join('')}</ul>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 09:05 자동 — region-cross-title-watch.mjs · 교정: scripts/prerender-seo.mjs CROSS_SIG</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 지역×업종 교차 title 회귀 ${issues.length}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
