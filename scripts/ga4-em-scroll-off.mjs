#!/usr/bin/env node
/**
 * GA4 향상측정 "스크롤" 끄기 — 정체불명 트래픽(이탈률 오염) 근본 제거.
 *
 * 왜: index.html 은 send_page_view:false(수동 page_view만). 그런데 GA4 향상측정 'scroll'이
 *     켜져 있어 gtag.js 가 모든 방문자에게 scroll 을 자동 발사한다. React 마운트 전(=게이트
 *     통과 수동 page_view 발송 전)에 떠난 빠른 방문자는 GA가 scroll 만 받고 page_view=0 →
 *     랜딩 (not set) + 출처 Unassigned + 100% 이탈 = 사이트 이탈률 오염원.
 *     (probe ③ 증거: (unknown)랜딩 세션 이벤트 = scroll 13873·user_engagement 186·page_view 0)
 *     사이트는 자체 게이트 scroll_100 으로 스크롤을 이미 측정 → 향상측정 'scroll'은 잉여 노이즈.
 *     ⇒ 끄면 page_view 없는 ghost 세션 생성이 멈추고 이탈률이 진짜 방문자 기준으로 정직해진다.
 *
 * 안전: 사이트 코드/콘텐츠 변경 0. GA4 설정 토글(되돌릴 수 있음). 가짜 이벤트 주입 0.
 *       scrollsEnabled 만 false 로 PATCH(updateMask 한정) — 다른 향상측정 항목은 그대로.
 *       쓰기라 SA가 '편집자'여야 통과, '뷰어'면 403(그 사실 그대로 보고).
 *
 * API: Admin v1alpha properties.dataStreams.updateEnhancedMeasurementSettings (analytics.edit).
 * 인증: GH Secret GSC_SA_JSON. workflow_dispatch.
 */
import crypto from 'node:crypto';

const PID = (process.env.GA_PROPERTY_ID || 'properties/540830544').replace(/^properties\//, '');
const QUOTA = process.env.GA_QUOTA_PROJECT || 'theassetsquare-search-console';
const V1A = 'https://analyticsadmin.googleapis.com/v1alpha';
const V1B = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.edit';
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  try { const sa = JSON.parse(process.env.GSC_SA_JSON || ''); if (sa.private_key && sa.client_email) return sa; } catch { /* */ }
  return null;
}
async function getToken() {
  const sa = loadSA();
  if (!sa) return null;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const signer = crypto.createSign('RSA-SHA256'); signer.update(`${head}.${claim}`); signer.end();
  const assertion = `${head}.${claim}.${b64url(signer.sign(sa.private_key))}`;
  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const d = await r.json().catch(() => ({}));
  return d.access_token || null;
}
function hdrs(t) { const h = { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }; if (QUOTA) h['x-goog-user-project'] = QUOTA; return h; }
async function api(base, method, path, body) {
  const r = await fetch(`${base}/${path}`, { method, headers: hdrs(globalThis.__t), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body: j };
}
function why(status, body) {
  const s = JSON.stringify(body || {});
  if (status === 403) return /permission|PERMISSION_DENIED|editor|insufficient/i.test(s) ? '403 권한부족 — SA가 뷰어(읽기전용)라 쓰기 불가. 속성에서 SA를 "편집자"로 올린 뒤 재실행.' : `403 — ${s.slice(0, 160)}`;
  return `HTTP ${status} — ${s.slice(0, 180)}`;
}
function emLine(e) {
  return `스트림ON=${e.streamEnabled} · 스크롤=${e.scrollsEnabled} · 사이트검색=${e.searchQueryEnabled ?? e.siteSearchEnabled} · 이탈클릭=${e.outboundClicksEnabled} · 동영상=${e.videoEngagementEnabled} · 파일다운=${e.fileDownloadsEnabled}`;
}

async function main() {
  const token = await getToken();
  if (!token) { console.error('❌ 토큰 없음 (GSC_SA_JSON / analytics.edit 확인)'); process.exit(1); }
  globalThis.__t = token;
  console.log(`🔧 향상측정 '스크롤' 끄기 시도 · 속성 properties/${PID} · analytics.edit\n`);

  // 1) 웹 스트림 id
  const streams = await api(V1B, 'GET', `properties/${PID}/dataStreams`);
  if (!streams.ok) { console.error(`데이터 스트림 읽기 실패 — ${why(streams.status, streams.body)}`); process.exit(2); }
  const web = (streams.body.dataStreams || []).find((s) => s.type === 'WEB_DATA_STREAM');
  if (!web) { console.error('웹 데이터 스트림 없음'); process.exit(2); }
  const sid = web.name.split('/').pop();
  console.log(`웹 스트림 = ${web.name} (측정ID ${web.webStreamData?.measurementId})`);

  // 2) 현재 EM 상태 (v1alpha)
  const before = await api(V1A, 'GET', `properties/${PID}/dataStreams/${sid}/enhancedMeasurementSettings`);
  if (!before.ok) { console.error(`향상측정 읽기 실패 — ${why(before.status, before.body)}`); process.exit(2); }
  console.log(`【전】 ${emLine(before.body)}`);
  if (before.body.scrollsEnabled === false) { console.log('\n✅ 이미 스크롤 OFF — 변경 없음(idempotent).'); return; }

  // 3) scrollsEnabled=false 만 PATCH (다른 항목 보존)
  const patch = await api(V1A, 'PATCH', `properties/${PID}/dataStreams/${sid}/enhancedMeasurementSettings?updateMask=scrollsEnabled`, { scrollsEnabled: false });
  if (!patch.ok) { console.log(`\n❌ 끄기 실패 — ${why(patch.status, patch.body)}`); process.exit(3); }
  console.log(`【후】 ${emLine(patch.body)}`);
  console.log(`\n✅ 향상측정 '스크롤' = ${patch.body.scrollsEnabled} (OFF) 적용됨. page_view 없는 ghost 세션 생성원 제거.`);
  console.log('※ 되돌리려면 같은 방식으로 scrollsEnabled:true PATCH. 사이트는 자체 scroll_100 으로 스크롤 측정 유지(무영향).');
  console.log('※ 적용 후 SA를 다시 뷰어로 되돌리면 자동화는 읽기전용(쓰기0 안전선) 복귀.');
}
main().catch((e) => { console.error('em-scroll-off error:', e.message); process.exit(1); });
