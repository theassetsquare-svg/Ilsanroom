#!/usr/bin/env node
/**
 * GA4 관리자 설정 현황 점검 (★읽기전용 — 사이트/설정 변경 0).
 *
 * 체크리스트 9항목 중 Admin API 로 ★읽을 수 있는 것을 직접 GET 해서
 * "이미 됨 / 아직 / 화면에서만 / 권한밖" 으로 분류해 브리핑한다.
 * SA 스코프 = analytics.readonly → GET 만 가능. 쓰기(설정 변경)는 불가(의도된 안전선).
 * 인증: GH Secret GSC_SA_JSON. cron 없음 — workflow_dispatch 수동.
 */
import { getGaToken, GA_PROPERTY, GA_QUOTA_PROJECT, GA_MEASUREMENT_ID, runReport } from './lib/ga-auth.mjs';

const ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const PID = GA_PROPERTY.replace(/^properties\//, '');

function hdrs(token) {
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (GA_QUOTA_PROJECT) h['x-goog-user-project'] = GA_QUOTA_PROJECT;
  return h;
}
async function adminGet(token, path) {
  const r = await fetch(`${ADMIN}/${path}`, { headers: hdrs(token) });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

const TARGET_KEY_EVENTS = ['sign_up', 'login', 'post_create', 'share', 'invite_open', 'search', 'search_no_result', 'scroll_100'];

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY} · 측정ID ${GA_MEASUREMENT_ID}`);
  console.log('   (읽기전용 점검 — 설정 변경 0)\n');

  // ── 1·2) 속성: 보관기간 / 시간대 / 통화 ──
  const prop = await adminGet(token, `properties/${PID}`);
  const ret = await adminGet(token, `properties/${PID}/dataRetentionSettings`);
  if (prop.ok) {
    const tz = prop.body.timeZone, cur = prop.body.currencyCode;
    console.log(`【2】 시간대 = ${tz} ${tz === 'Asia/Seoul' ? '✅ 완료' : '⚠️ 아직 (Asia/Seoul 필요)'} · 통화 ${cur}${cur === 'KRW' ? ' ✅' : ' (KRW 권장)'}`);
  } else console.log(`【2】 속성 읽기 실패 — ${prop.status}`);
  if (ret.ok) {
    const r = ret.body.eventDataRetention;
    console.log(`【1】 데이터 보관 = ${r} ${r === 'FOURTEEN_MONTHS' ? '✅ 완료(14개월)' : '⚠️ 아직 (현재 ' + r + ' → 14개월로)'}`);
  } else console.log(`【1】 보관설정 읽기 실패 — ${ret.status}`);

  // ── 7) 웹 스트림 + 향상측정 ──
  const streams = await adminGet(token, `properties/${PID}/dataStreams`);
  let webStreamId = null;
  if (streams.ok) {
    const web = (streams.body.dataStreams || []).find((s) => s.type === 'WEB_DATA_STREAM');
    if (web) {
      webStreamId = web.name.split('/').pop();
      const mid = web.webStreamData?.measurementId;
      console.log(`【-】 웹 스트림 측정ID = ${mid} ${mid === GA_MEASUREMENT_ID ? '✅ 일치' : '⚠️ 불일치'}`);
      const em = await adminGet(token, `properties/${PID}/dataStreams/${webStreamId}/enhancedMeasurementSettings`);
      if (em.ok) {
        const e = em.body;
        console.log(`【7】 향상측정 = ${e.streamEnabled ? 'ON ✅' : 'OFF ⚠️'} (스크롤 ${e.scrollsEnabled ? 'ON' : 'off'} · 사이트검색 ${e.siteSearchEnabled ? 'ON' : 'off'} · 이탈클릭 ${e.outboundClicksEnabled ? 'ON' : 'off'})`);
        console.log(`       └ page_view 는 코드가 수동발송(send_page_view:false) → 중복 없음. 위 토글은 기본 ON 유지 OK`);
      } else console.log(`【7】 향상측정 읽기 실패 — ${em.status}`);
    } else console.log('【7】 웹 데이터 스트림 없음');
  } else console.log(`【7】 데이터 스트림 읽기 실패 — ${streams.status}`);

  // ── 5·6) 핵심 이벤트(keyEvents) 현황 + 실제 발생한 이벤트 ──
  const ke = await adminGet(token, `properties/${PID}/keyEvents`);
  let marked = [];
  if (ke.ok) {
    marked = (ke.body.keyEvents || []).map((k) => k.eventName);
    console.log(`\n【5·6】 핵심 이벤트(Key Events) 지정됨: ${marked.length ? marked.join(', ') : '(없음)'}`);
    const missing = TARGET_KEY_EVENTS.filter((e) => !marked.includes(e));
    console.log(`        목표 8개 중 지정됨 ${TARGET_KEY_EVENTS.length - missing.length}/${TARGET_KEY_EVENTS.length}` +
      (missing.length ? ` · 아직: ${missing.join(', ')}` : ' ✅ 전부 지정'));
  } else console.log(`\n【5·6】 keyEvents 읽기 실패 — ${ke.status}`);

  // 실제 발생한 이벤트 (지난 28일) — 발생해야 keyEvent 목록에 나타나 지정 가능
  const ev = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  });
  if (ev.ok) {
    const fired = (ev.body.rows || []).map((r) => r.dimensionValues[0].value);
    const firedTargets = TARGET_KEY_EVENTS.filter((e) => fired.includes(e));
    const notFired = TARGET_KEY_EVENTS.filter((e) => !fired.includes(e));
    console.log(`        실제 발생(28일) 목표 이벤트: ${firedTargets.length ? firedTargets.join(', ') : '(아직 없음)'}`);
    if (notFired.length) console.log(`        미발생(아직 목록에 안 뜸 → 그 행동 일어날 때까지 대기): ${notFired.join(', ')}`);
  } else console.log(`        이벤트 발생현황 읽기 실패 — ${ev.status}`);

  // ── 9) 서비스계정 역할 = 뷰어 확인 (권한 밖이면 확인불가) ──
  const ab = await adminGet(token, `properties/${PID}/accessBindings`);
  if (ab.ok) {
    const sa = (ab.body.accessBindings || []).find((b) => /gsc-mcp@/.test(b.user || ''));
    if (sa) console.log(`\n【9】 SA(${sa.user}) 역할 = ${(sa.roles || []).join(', ')} ${/(viewer)/i.test((sa.roles || []).join(',')) ? '✅ 뷰어(읽기전용)' : '⚠️ 확인필요'}`);
    else console.log('\n【9】 accessBindings 에 SA 없음(상위 계정 상속일 수 있음)');
  } else console.log(`\n【9】 accessBindings 읽기 — ${ab.status} (analytics.readonly 로는 권한밖일 수 있음 = 정상)`);

  // ── 화면/입력 필요 항목 안내 ──
  console.log('\n———');
  console.log('【3】 내부 IP 제외 — 사무실/집 공인 IP 입력 필요(대표님만 아는 값) → 화면에서만. API로 IP 자동주입 안 함.');
  console.log('【4】 봇/스파이더 필터 — GA4 기본 항상 ON(토글 없음). 확인만, 작업 없음. ✅');
  console.log('【8】 데이터 수정(Redaction) — Admin API 미노출 → 화면에서만 확인. 코드(scrubPii)로 이미 1차 차단됨.');
  console.log('\n※ 쓰기(설정 변경)는 SA가 뷰어(읽기전용)라 불가 — 이게 #1 안전선(쓰기권한0=조작불가). 위 점검은 전부 GET.');
}
main().catch((e) => { console.error('audit error:', e.message); process.exit(1); });
