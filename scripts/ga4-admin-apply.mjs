#!/usr/bin/env node
/**
 * GA4 관리자 설정 ★실제 적용 시도 (대표님 명시 지시 — 직접 설정).
 *   1) 데이터 보관 → 14개월 (PATCH dataRetentionSettings)
 *   2) 핵심 이벤트 지정 → 이미 발생한 scroll_100 / sign_up / login (POST keyEvents)
 *
 * 쓰기는 analytics.edit 스코프 + 속성에서 SA 역할이 '편집자' 이상이어야 통과.
 * 권한이 '뷰어'면 GA가 403 을 돌려준다 → 그 사실을 그대로 보고(추측 아님, 실측).
 * 인증: GH Secret GSC_SA_JSON. workflow_dispatch 수동.
 */
import crypto from 'node:crypto';

const PID = (process.env.GA_PROPERTY_ID || 'properties/540830544').replace(/^properties\//, '');
const QUOTA = process.env.GA_QUOTA_PROJECT || 'theassetsquare-search-console';
const ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.edit https://www.googleapis.com/auth/analytics.manage.users.readonly';
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  const raw = process.env.GSC_SA_JSON || '';
  try { const sa = JSON.parse(raw); if (sa.private_key && sa.client_email) return sa; } catch { /* */ }
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
  if (!d.access_token) console.error('토큰 발급 실패:', JSON.stringify(d).slice(0, 200));
  return d.access_token || null;
}
function hdrs(t) { const h = { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }; if (QUOTA) h['x-goog-user-project'] = QUOTA; return h; }
async function api(method, path, body) {
  const r = await fetch(`${ADMIN}/${path}`, { method, headers: hdrs(globalThis.__t), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body: j };
}
function why(status, body) {
  const s = JSON.stringify(body || {});
  if (status === 403) return /permission|PERMISSION_DENIED|editor|insufficient/i.test(s) ? '403 권한부족 — SA가 뷰어(읽기전용)라 쓰기 불가. 속성에서 SA를 "편집자"로 올려야 함.' : `403 — ${s.slice(0, 160)}`;
  if (status === 401) return '401 인증실패';
  return `HTTP ${status} — ${s.slice(0, 160)}`;
}

async function main() {
  const token = await getToken();
  if (!token) { console.error('❌ 토큰 없음 (GSC_SA_JSON 확인 / analytics.edit 거부 가능)'); process.exit(1); }
  globalThis.__t = token;
  console.log(`🔧 GA4 설정 적용 시도 · 속성 properties/${PID} · 스코프 analytics.edit\n`);

  // 0) GA가 지금 이 SA를 무슨 역할로 보는지 직접 읽기 (편집자 전파됐는지 사실확인)
  const ab = await api('GET', `properties/${PID}/accessBindings`);
  if (ab.ok) {
    const me = (ab.body.accessBindings || []).find((b) => /gsc-mcp@/.test(b.user || ''));
    if (me) console.log(`【역할확인】 GA가 본 SA(${me.user}) 역할 = ${(me.roles || []).join(', ') || '(없음)'}\n`);
    else console.log('【역할확인】 accessBindings 에 이 SA 없음(상위 상속이거나 미등록)\n');
  } else console.log(`【역할확인】 accessBindings 읽기 실패 — ${ab.status} ${JSON.stringify(ab.body).slice(0, 120)}\n`);

  // 1) 데이터 보관 14개월
  const r1 = await api('PATCH', `properties/${PID}/dataRetentionSettings?updateMask=eventDataRetention`, { eventDataRetention: 'FOURTEEN_MONTHS' });
  if (r1.ok) console.log(`【1】 데이터 보관 → ${r1.body.eventDataRetention} ✅ 적용됨`);
  else console.log(`【1】 데이터 보관 적용 실패 — ${why(r1.status, r1.body)}`);

  // 2) 핵심 이벤트 — 이미 발생한 것만 (없는 건 GA가 만들지도 거부)
  //    search = state-audit 28일 실발생 확인됨(진짜 검색행동) → 정직 지정 가능.
  //    search_no_result/post_create/share/invite_open = 아직 미발생 → 발생 후 추가(가짜 지정 금지).
  const want = ['scroll_100', 'sign_up', 'login', 'search'];
  const existing = await api('GET', `properties/${PID}/keyEvents`);
  const have = existing.ok ? (existing.body.keyEvents || []).map((k) => k.eventName) : [];
  for (const ev of want) {
    if (have.includes(ev)) { console.log(`【5·6】 ${ev} — 이미 핵심이벤트 ✅`); continue; }
    const r = await api('POST', `properties/${PID}/keyEvents`, { eventName: ev, countingMethod: 'ONCE_PER_EVENT' });
    if (r.ok) console.log(`【5·6】 ${ev} → 핵심 이벤트 지정 ✅ 적용됨`);
    else console.log(`【5·6】 ${ev} 지정 실패 — ${why(r.status, r.body)}`);
  }

  console.log('\n※ 위가 모두 403 이면 = SA가 뷰어라 쓰기 차단(=#1 안전선). 그땐 속성 액세스에서 SA를 편집자로 올린 뒤 재실행.');
  console.log('※ ✅ 적용됐다면 = SA에 편집권한 있음. 이후 SA를 다시 뷰어로 되돌리면 자동화는 그대로 읽기전용 유지.');
}
main().catch((e) => { console.error('apply error:', e.message); process.exit(1); });
