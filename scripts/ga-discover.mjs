#!/usr/bin/env node
/**
 * 놀쿨 GA4 연결 발견 (일회용/검증).
 *
 * 목적: 사장님이 GA4 속성에 서비스계정(gsc-mcp@theasset-gsc)을 뷰어로 추가한 뒤,
 *   이 SA 로 GA Admin/Data API 에 접근 가능한지 + 측정ID G-W6VE6KHLLD 의 숫자 속성ID 를
 *   자동 발견한다. 로컬엔 키가 없으므로 GitHub Actions(GSC_SA_JSON secret)에서 돈다.
 *
 * 출력:
 *   - 접근 가능한 GA4 속성 목록(accountSummaries)
 *   - G-W6VE6KHLLD 매칭 속성ID (properties/NNNN)
 *   - 실시간 활성 사용자(runRealtimeReport) — 데이터 파이프 살아있음 증명
 *   - API 비활성(SERVICE_DISABLED) / 권한없음(403) 은 명확히 구분해 안내
 */
import crypto from 'node:crypto';

const MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-W6VE6KHLLD';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  const raw = process.env.GSC_SA_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON || '';
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.type === 'service_account' && sa.private_key && sa.client_email) return sa;
  } catch { /* ignore */ }
  return null;
}

async function mintToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: SCOPE,
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput); signer.end();
  const assertion = `${signingInput}.${b64url(signer.sign(sa.private_key))}`;
  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  return r.json();
}

function diagnose(status, body) {
  const s = JSON.stringify(body);
  if (/SERVICE_DISABLED|has not been used|disabled/i.test(s)) {
    const api = s.match(/([a-z]+\.googleapis\.com)/i);
    return `API 비활성 (${api ? api[1] : '해당 API'}) — ★사장님 1회: GCP 콘솔에서 활성화 필요`;
  }
  if (status === 403) return '권한 없음(403) — SA가 GA4 속성 뷰어로 안 들어갔거나 전파 지연';
  if (status === 401) return '인증 실패(401) — 토큰/키 문제';
  return `HTTP ${status}`;
}

async function gaGet(token, url) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

(async () => {
  const sa = loadSA();
  if (!sa) { console.error('❌ GSC_SA_JSON 서비스계정 키 없음 (GH Secret 주입 확인)'); process.exit(1); }
  console.log(`🔑 서비스계정: ${sa.client_email}`);

  const tok = await mintToken(sa);
  if (!tok.access_token) { console.error('❌ 토큰 발급 실패:', JSON.stringify(tok)); process.exit(1); }
  console.log(`✅ analytics.readonly 토큰 발급됨\n`);
  const token = tok.access_token;

  // 1) 접근 가능한 GA4 속성 목록
  console.log('📋 GA Admin API — accountSummaries');
  const sum = await gaGet(token, 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
  if (!sum.ok) {
    console.error(`   ❌ ${diagnose(sum.status, sum.body)}`);
    console.error(`   raw: ${JSON.stringify(sum.body).slice(0, 400)}`);
    process.exit(2);
  }
  const accts = sum.body.accountSummaries || [];
  const props = [];
  for (const a of accts) {
    for (const p of (a.propertySummaries || [])) {
      props.push({ account: a.displayName, property: p.property, name: p.displayName });
      console.log(`   • ${a.displayName} / ${p.displayName} → ${p.property}`);
    }
  }
  if (!props.length) { console.error('   ❌ 접근 가능한 속성 0개 — SA 뷰어 추가/전파 확인'); process.exit(3); }

  // 2) 측정ID 매칭으로 속성ID 확정
  console.log(`\n🔎 측정ID ${MEASUREMENT_ID} 매칭 속성 탐색`);
  let matched = null;
  for (const p of props) {
    const ds = await gaGet(token, `https://analyticsadmin.googleapis.com/v1beta/${p.property}/dataStreams`);
    if (!ds.ok) { console.log(`   (${p.property} dataStreams ${ds.status})`); continue; }
    for (const s of (ds.body.dataStreams || [])) {
      const mid = s.webStreamData?.measurementId;
      if (mid) console.log(`   ${p.property} 스트림 ${mid}`);
      if (mid === MEASUREMENT_ID) matched = { ...p, stream: s.displayName, measurementId: mid };
    }
  }
  if (matched) console.log(`\n🎯 발견: ${MEASUREMENT_ID} = ${matched.property}  (${matched.name})`);
  else { console.log(`\n⚠️  ${MEASUREMENT_ID} 매칭 스트림 못 찾음 — 위 목록 중 수동 확인 필요`); }

  // 3) 실시간 데이터 파이프 검증
  const target = matched?.property || props[0].property;
  console.log(`\n📡 GA Data API — runRealtimeReport (${target})`);
  const rt = await fetch(`https://analyticsdata.googleapis.com/v1beta/${target}:runRealtimeReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics: [{ name: 'activeUsers' }], dimensions: [{ name: 'unifiedScreenName' }], limit: 10 }),
  });
  const rtBody = await rt.json().catch(() => ({}));
  if (!rt.ok) {
    console.error(`   ❌ ${diagnose(rt.status, rtBody)}`);
    console.error(`   raw: ${JSON.stringify(rtBody).slice(0, 400)}`);
    process.exit(4);
  }
  const total = (rtBody.rows || []).reduce((n, r) => n + Number(r.metricValues?.[0]?.value || 0), 0);
  console.log(`   ✅ 실시간 활성 사용자(현재): ${total}`);
  for (const r of (rtBody.rows || []).slice(0, 10)) {
    console.log(`      ${r.dimensionValues?.[0]?.value || '(no name)'} — ${r.metricValues?.[0]?.value}`);
  }

  console.log(`\n=== 요약 ===`);
  console.log(`SA: ${sa.client_email}`);
  console.log(`속성ID: ${matched?.property || '(미확정 — 위 목록 확인)'}`);
  console.log(`실시간 활성: ${total}`);
  console.log(`→ 이 속성ID를 GA_PROPERTY_ID 로 자동 감사 워크플로에 사용`);
})();
