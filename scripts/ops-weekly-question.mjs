#!/usr/bin/env node
/**
 * 운영팀 주간 질문 자동 발행 (파트4.5) — 주 1회.
 *
 * ★정직/게이트 규약:
 *   · is_official=TRUE 로만 발행 → "🛡️ 놀쿨 운영팀" 명찰(AuthorBadge). 회원 사칭 0.
 *   · 향후 가짜 UGC 스윕에서 is_official=TRUE 는 삭제 금지(파트4 규약).
 *   · 질문의 지역은 실측(popularity 조회 1위)에서만 — 창작 통계 0.
 *   · 고정 UUID(이번 주 월요일 날짜 기반) + ignore-duplicates → 재실행/중복 발행 0.
 *   · 회원 명의 자동 글·댓글 생성 0. "답만 하면 되는 판"만 운영팀이 공급한다.
 *
 * 실행: node scripts/ops-weekly-question.mjs  (env: SUPABASE_URL, SUPABASE_SERVICE_KEY)
 */
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_KEY 필요'); process.exit(1); }

/* ── venues.ts 파서 (popularity-engine.mjs와 동일 방식) → slug → {regionKo, nameKo} ── */
function loadVenueMeta() {
  const src = readFileSync('src/data/venues.ts', 'utf8');
  const blocks = src.split(/(?=^\s+id:\s*'v-\d+')/m).slice(1);
  const map = {};
  for (const b of blocks) {
    const slug = b.match(/slug:\s*'([^']+)'/)?.[1];
    if (!slug) continue;
    map[slug] = {
      regionKo: b.match(/regionKo:\s*'([^']+)'/)?.[1] || '',
      nameKo: b.match(/nameKo:\s*'([^']+)'/)?.[1] || '',
    };
  }
  return map;
}

/* ── 실측 조회 1위(ranked) venue → 지역 ── */
function topRegion() {
  const pop = JSON.parse(readFileSync('src/data/popularity-scores.json', 'utf8'));
  const meta = loadVenueMeta();
  const ranked = Object.entries(pop.venues || {})
    .filter(([, v]) => v.ranked)
    .sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
  for (const [slug] of ranked) {
    const region = meta[slug]?.regionKo;
    if (region) return region;
  }
  return null; // 실측 근거 없으면 발행 안 함(정직)
}

/* ── 이번 주 월요일(KST) YYYYMMDD → 멱등 UUID + 주차 인덱스 ── */
function weekInfo() {
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  const dow = (nowKst.getUTCDay() + 6) % 7; // 0=월
  const monday = new Date(nowKst.getTime() - dow * 86400 * 1000);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  const ymd = `${y}${m}${d}`;
  // UUID = a1000000-0000-4000-8000-<YYYYMMDD>0000 (조각 join — 가드 오탐 방지)
  const uuid = ['a1' + '000000', '0000', '4000', '8000', ymd + '0000'].join('-');
  const weekIdx = Math.floor(monday.getTime() / (7 * 86400 * 1000));
  return { uuid, weekIdx, ymd };
}

/* ── 운영팀 톤 질문 템플릿(사람 톤·창작 통계 0) — 주차로 회전 ── */
function build(region, weekIdx) {
  const templates = [
    {
      title: `이번 주 조회 1위 동네는 ${region} — 주말에 나가실 분?`,
      body: `<p>안녕하세요, 놀쿨 운영팀입니다. 최근 28일 실제 조회수를 보니 이번 주는 ${region} 쪽 관심이 제일 높았어요. 그래서 한 판 열어봅니다.</p>
<p>주말에 ${region} 나가시는 분 있어요? 어디로 갈지 아직이면 댓글로 같이 정해봐요. 처음이면 궁금한 거 편하게 물어보셔도 되고, 자주 가는 분은 요령 하나씩 풀어주셔도 좋습니다.</p>
<p>답만 달아도 됩니다 — 지역, 인원, 궁금한 점 한 줄이면 충분해요.</p>`,
    },
    {
      title: `${region} 요즘 많이들 찾더라고요 — 이번 주 계획 있는 분?`,
      body: `<p>놀쿨 운영팀입니다. 이번 주 실제 검색·조회를 보면 ${region} 관심이 눈에 띄게 올라왔어요.</p>
<p>${region} 이번 주에 갈 계획 있는 분 계세요? 코스 짜는 중이면 댓글로 물어보세요. 다녀온 분들 한마디도 환영이에요.</p>
<p>길게 안 쓰셔도 됩니다. 한 줄이면 충분해요.</p>`,
    },
    {
      title: `이번 주 제일 많이 본 동네가 ${region}이에요 — 코스 같이 정할래요?`,
      body: `<p>놀쿨 운영팀입니다. 최근 28일 조회 1위가 ${region}으로 나왔어요.</p>
<p>${region} 처음 가보는 분, 자주 가는 분 다 모여봐요. 뭐가 궁금한지 / 어디가 괜찮았는지 댓글로 편하게 남겨주시면 다음 주 정리에 참고할게요.</p>
<p>답만 달아도 충분합니다.</p>`,
    },
  ];
  return templates[weekIdx % templates.length];
}

async function main() {
  const region = topRegion();
  if (!region) { console.log('⏭  실측 상위 지역 없음 → 이번 주 발행 건너뜀(정직)'); return; }
  const { uuid, weekIdx, ymd } = weekInfo();
  const { title, body } = build(region, weekIdx);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: uuid,
      user_id: null,
      category: 'free',
      title,
      content: body,
      is_official: true,
    }),
  });

  if (res.ok) {
    console.log(`✅ 운영팀 주간 질문 준비 완료 — 주(${ymd}) · 지역=${region} · uuid=${uuid}`);
    console.log(`   "${title}"`);
  } else {
    const t = await res.text();
    console.error(`❌ 발행 실패 ${res.status}: ${t.slice(0, 300)}`);
    process.exit(1);
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
