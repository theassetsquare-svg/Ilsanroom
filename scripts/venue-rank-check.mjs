#!/usr/bin/env node
/**
 * 지정 가게이름 N개의 Google Search Console 실순위 즉석 조회 (읽기 전용·콘솔 전용·메일 없음).
 *
 * 사용자 요청(2026-06-13): "GSC에서 12개 가게 실제 순위 뽑아와".
 * venue-rank-trend(주간 메일·상위10만 로그)와 달리, 지정 검색어 각각의
 * 노출가중 평균순위·노출·클릭·CTR 절대값을 전수 콘솔 출력한다.
 *
 * 인증: GSC_SA_JSON (서비스계정, 만료없음) — 로컬엔 없고 GitHub Actions에서만 주입.
 * GSC 데이터는 정책상 약 2일 지연. 기본 28일 윈도우.
 *
 * 사용: node scripts/venue-rank-check.mjs ["가게이름1" "가게이름2" ...]
 *       인자 없으면 아래 DEFAULT_TARGETS 사용.
 */
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const DEFAULT_TARGETS = [
  '일산룸', '부산물나이트', '일산명월관', '일산요정', '해운대고구려', '강남호빠',
  '건대호빠', '수원호빠', '장안동호빠', '대전원나이트', '창원룰루랄라나이트', '대구바밤바나이트',
];

const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;
const DAYS = Number(process.env.GSC_DAYS || 28);
const norm = (s) => (s || '').replace(/\s+/g, '');

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵 (로컬엔 키 없음, Actions에서 실행)');
  process.exit(0);
}

(async () => {
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  access_token 발급 실패'); process.exit(0); }

  const { rows, start, end } = await gscQuery(token, { dimensions: ['query'], rowLimit: 25000, days: DAYS });
  console.log(`📊 GSC searchAnalytics — 기간 ${start} ~ ${end} (${DAYS}일, 약 2일 지연) · 전체 검색어 행 ${rows.length}`);
  console.log(`🔎 조회 대상 ${targets.length}개\n`);

  for (const t of targets) {
    const key = norm(t);
    const matched = rows.filter((r) => norm(r.keys?.[0]).includes(key));
    if (matched.length === 0) {
      console.log(`❌ ${t}: 노출 0 (28일간 이 검색어로 nolcool 노출/클릭 기록 없음)`);
      continue;
    }
    let imp = 0, clicks = 0, posW = 0;
    for (const r of matched) {
      const i = r.impressions || 0;
      imp += i; clicks += r.clicks || 0; posW += (r.position || 0) * i;
    }
    const pos = imp ? posW / imp : 0;
    const ctr = imp ? (clicks / imp) * 100 : 0;
    // 가장 노출 많은 실제 검색어 예시
    const top = [...matched].sort((a, b) => (b.impressions || 0) - (a.impressions || 0))[0];
    console.log(
      `✅ ${t}: 평균 ${pos.toFixed(1)}위 · 노출 ${imp} · 클릭 ${clicks} · CTR ${ctr.toFixed(1)}%` +
      ` · 검색어 ${matched.length}종 (대표 "${top.keys?.[0]}" 노출 ${top.impressions})`
    );
  }
  console.log('\n참고: 평균순위는 노출가중. 노출 0 = 해당 검색어에서 아직 색인/노출 안 됨(또는 2일 지연 미반영).');
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
