#!/usr/bin/env node
/**
 * Gmail 서치콘솔 문제메일 자동 triage + 해결확인 후 정리 (의존성 없음)
 *
 * 닫힌 루프의 마지막 조각. google-issue-monitor.mjs(API 직접 감지)와 짝.
 *   - google-issue-monitor : 문제를 "감지"하고 sitemap 재제출/메일 (전체 sitemap 크롤)
 *   - gmail-autofix(이 파일): Search Console이 Gmail로 보낸 "문제 알림 메일"을 읽어,
 *       그 메일이 가리키는 URL이 지금도 진짜 깨졌는지 GSC API로 검증 →
 *         ✅ 해결됨(PASS)  → 메일 휴지통으로 (gmail.modify, 30일 복구 가능 — 영구삭제 아님)
 *         🔴 아직 깨짐    → 메일 보존 + 타깃 재크롤(IndexNow+sitemap) + 사람 알림
 *         🛠️ 수동조치/보안 → 절대 자동처리·삭제 X, 보존 + 라벨 + 사람 알림
 *
 * 인증:
 *   Gmail : GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN (scope gmail.modify)
 *           → scripts/gmail-get-token.mjs 로 1회 발급
 *   GSC   : scripts/lib/gsc-auth.mjs (GSC_SA_JSON 또는 GOOGLE_OAUTH_*) — URL 검증용
 *   메일  : RESEND_API_KEY + NOTIFICATION_EMAIL (사람 알림)
 *
 * 안전장치:
 *   - 휴지통 이동은 "GSC inspect verdict === PASS" 로 검증된 메일만 (라이브 200만으론 삭제 X)
 *   - 보안/수동조치 메일은 어떤 경우에도 보존
 *   - GSC 인증 없으면 검증 불가 → 어떤 메일도 삭제하지 않고 전부 보존
 *   - DRY=1 : 읽기·분류·검증만, Gmail 변경(휴지통/라벨) 0 (배포 전 시뮬레이션)
 *   - 메일에 적힌 URL만 inspect (전체 크롤 X = GSC 일일 quota 보호)
 */

import { getAccessToken, hasGscCredentials } from './lib/gsc-auth.mjs';

const SITE = 'nolcool.com';
const SITE_PROPERTY = 'sc-domain:nolcool.com';
const SITEMAP_URL = `https://${SITE}/sitemap.xml`;
const DRY = process.env.DRY === '1';
const MAX_VERIFY = Number(process.env.MAX_VERIFY || 30); // 메일당·실행당 inspect 상한 (quota 보호)

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, RESEND_API_KEY, INDEXNOW_KEY } = process.env;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const KEEP_LABEL = 'NOLCOOL/사람확인필요';

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
  console.log('⏭️  Gmail 인증정보 미설정 (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN) — gmail-autofix 스킵');
  console.log('   설정: node scripts/gmail-get-token.mjs 로 토큰 발급 후 GitHub Secret 3개 등록');
  process.exit(0);
}

function kstNow() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
}

async function sendMail(subject, html) {
  if (!RESEND_API_KEY) { console.log('⏭️  RESEND_API_KEY 없음 — 알림 메일 스킵'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject, html }),
  }).catch(() => null);
  if (r) console.log(`📧 알림 메일: ${r.status}`);
}

/* ───────────── Gmail API (raw fetch, gmail.modify) ───────────── */

async function gmailToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    console.warn('⚠️  Gmail access_token 갱신 실패:', JSON.stringify(data));
    return null;
  }
  return data.access_token;
}

async function gmailGet(token, path) {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

async function gmailPost(token, path, body) {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return r.ok;
}

/** 서치콘솔 알림 메일만. is:unread 로 처리한 메일 재처리 방지 (휴지통/라벨 후 read 처리). */
async function listMessages(token) {
  const q = encodeURIComponent('from:search-console-noreply@google.com is:unread');
  const data = await gmailGet(token, `messages?q=${q}&maxResults=50`);
  return data?.messages || [];
}

function decodeB64Url(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

/** payload 트리에서 text/plain·text/html 본문 추출 (재귀). */
function extractBody(payload) {
  let text = '';
  const walk = (p) => {
    if (!p) return;
    if (p.body?.data && (p.mimeType === 'text/plain' || p.mimeType === 'text/html')) {
      text += ' ' + decodeB64Url(p.body.data);
    }
    for (const part of p.parts || []) walk(part);
  };
  walk(payload);
  return text;
}

async function getMessage(token, id) {
  const m = await gmailGet(token, `messages/${id}?format=full`);
  if (!m) return null;
  const headers = m.payload?.headers || [];
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  const body = extractBody(m.payload);
  return { id, threadId: m.threadId, subject, body };
}

async function ensureLabel(token, name) {
  const data = await gmailGet(token, 'labels');
  const found = (data?.labels || []).find(l => l.name === name);
  if (found) return found.id;
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, labelListVisibility: 'labelShow', messageLabelListVisibility: 'show' }),
  });
  const j = await r.json().catch(() => null);
  return j?.id || null;
}

/* ───────────── 분류 + URL 추출 ───────────── */

function classifyEmail(subject, body) {
  const t = `${subject}\n${body}`;
  if (/security|보안|해킹|hacked|malware|악성|피싱|phishing/i.test(t)) return 'SECURITY';
  if (/manual action|수동 ?조치|스팸 정책|policy violation|정책 위반/i.test(t)) return 'MANUAL';
  if (/ownership|소유권|verification|확인이 필요|소유 ?확인/i.test(t)) return 'OWNERSHIP';
  if (/coverage|index|색인|크롤|crawl|페이지 ?(가|이|를)?.*(색인|crawl)|not indexed|발견됨|not found|404|soft 404|noindex|robots/i.test(t)) return 'COVERAGE';
  return 'UNKNOWN';
}

/** 메일 본문에서 nolcool.com 페이지 URL 추출 (GSC 링크/추적 파라미터 제거). */
function extractUrls(body) {
  const set = new Set();
  for (const m of body.matchAll(/https?:\/\/(?:www\.)?nolcool\.com\/[^\s"'<>)]*/gi)) {
    let u = m[0].replace(/[.,;]+$/, '');
    // GSC 메일은 종종 search.google.com 리다이렉트로 감싸므로 raw nolcool.com만 채택
    if (!/nolcool\.com/i.test(u)) continue;
    set.add(u.split('?')[0]);
  }
  return [...set];
}

/* ───────────── GSC 검증 ───────────── */

async function inspect(token, inspectionUrl) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl: SITE_PROPERTY, languageCode: 'ko-KR' }),
  });
  if (r.status === 429) return { quota: true };
  if (!r.ok) return { error: r.status };
  const data = await r.json();
  const idx = data.inspectionResult?.indexStatusResult || {};
  return { verdict: idx.verdict, coverageState: idx.coverageState, pageFetchState: idx.pageFetchState };
}

async function liveOk(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'NolcoolGmailAutofix/1.0', 'Cache-Control': 'no-cache' } });
    return r.ok;
  } catch { return false; }
}

/* ───────────── 타깃 재크롤 (아직 깨진 URL 가속) ───────────── */

async function resubmitSitemap(token) {
  if (!token) return;
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const r = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (r) console.log(`   🗺️  sitemap 재제출: ${r.status === 200 || r.status === 204 ? 'OK' : r.status}`);
}

async function indexNowPing(urls) {
  if (!INDEXNOW_KEY || !urls.length) return;
  const payload = { host: SITE, key: INDEXNOW_KEY, keyLocation: `https://${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 1000) };
  for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
    const r = await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (r) console.log(`   📨 IndexNow ${ep.includes('bing') ? 'bing' : 'indexnow'}: ${r.status}`);
  }
}

/* ───────────── main ───────────── */

async function main() {
  console.log(`🔑 Gmail 토큰 발급...${DRY ? ' (DRY=1 — 읽기/검증만, 변경 0)' : ''}`);
  const gToken = await gmailToken();
  if (!gToken) { console.log('⏭️  Gmail 토큰 실패 — 스킵'); return; }

  const gscOk = hasGscCredentials();
  const scToken = gscOk ? await getAccessToken() : null;
  if (!scToken) console.log('⚠️  GSC 인증 없음/실패 — 검증 불가 → 어떤 메일도 삭제하지 않고 전부 보존');

  console.log('📥 서치콘솔 미읽음 메일 조회...');
  const msgs = await listMessages(gToken);
  console.log(`   ${msgs.length}개`);
  if (!msgs.length) { console.log('✅ 처리할 서치콘솔 메일 없음 — 종료'); return; }

  const resolved = [];   // 휴지통 처리한 (해결됨) 메일
  const keptManual = []; // 보안/수동/소유권 — 사람 필요
  const keptBroken = []; // 아직 깨진 URL
  const keptUnclear = []; // URL 추출 불가/검증불가
  let inspected = 0;

  const brokenUrls = new Set();

  for (const { id } of msgs) {
    const msg = await getMessage(gToken, id);
    if (!msg) continue;
    const kind = classifyEmail(msg.subject, msg.body);
    const subj = msg.subject.slice(0, 80);

    // 보안/수동조치/소유권 = 절대 자동처리·삭제 X
    if (kind === 'SECURITY' || kind === 'MANUAL' || kind === 'OWNERSHIP') {
      console.log(`🛠️  [${kind}] ${subj} — 보존 + 사람 알림`);
      keptManual.push({ kind, subject: msg.subject });
      if (!DRY) {
        const lid = await ensureLabel(gToken, KEEP_LABEL);
        if (lid) await gmailPost(gToken, `messages/${id}/modify`, { addLabelIds: [lid] });
      }
      continue;
    }

    // GSC 인증 없으면 검증 불가 → 보존
    if (!scToken) { keptUnclear.push({ subject: msg.subject, reason: 'GSC 검증불가' }); continue; }

    const urls = extractUrls(msg.body).slice(0, MAX_VERIFY);
    if (!urls.length) {
      console.log(`❓ [${kind}] ${subj} — URL 추출 실패, 보존`);
      keptUnclear.push({ subject: msg.subject, reason: 'URL 추출 실패' });
      continue;
    }

    // 메일에 적힌 URL만 검증 (quota 보호)
    let allResolved = true;
    const stillBroken = [];
    for (const u of urls) {
      if (inspected >= MAX_VERIFY) { allResolved = false; break; }
      const r = await inspect(scToken, u);
      inspected++;
      if (r.quota || r.error) { allResolved = false; stillBroken.push(u); continue; }
      const ok = r.verdict === 'PASS' && (await liveOk(u));
      if (!ok) { allResolved = false; stillBroken.push(u); }
    }

    if (allResolved) {
      console.log(`✅ [${kind}] ${subj} — ${urls.length}개 URL 모두 PASS → 휴지통`);
      resolved.push({ subject: msg.subject, urls });
      if (!DRY) {
        const trashed = await gmailPost(gToken, `messages/${id}/trash`);
        console.log(`   🗑️  휴지통: ${trashed ? 'OK' : '실패'}`);
      }
    } else {
      console.log(`🔴 [${kind}] ${subj} — ${stillBroken.length}/${urls.length} 아직 깨짐 → 보존+재크롤`);
      keptBroken.push({ subject: msg.subject, broken: stillBroken });
      stillBroken.forEach(u => brokenUrls.add(u));
    }
  }

  // 아직 깨진 URL 가속 (자가치유 유도)
  if (brokenUrls.size && !DRY) {
    console.log(`\n♻️  타깃 재크롤 ${brokenUrls.size}개...`);
    await resubmitSitemap(scToken);
    await indexNowPing([...brokenUrls]);
  }

  console.log(`\n📊 결과: ✅해결삭제 ${resolved.length} · 🔴깨짐보존 ${keptBroken.length} · 🛠️사람필요 ${keptManual.length} · ❓불명확 ${keptUnclear.length} · inspect ${inspected}`);

  // 알림 메일: 사람 행동이 필요한 것(보안/수동/아직깨짐)이 있을 때만 (season66 실패시만 정책)
  const needsHuman = keptManual.length || keptBroken.length;
  if (needsHuman && !DRY) {
    const li = (arr, fmt) => arr.map(fmt).join('');
    const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#222">
      <h2 style="color:#111">[📬 서치콘솔 메일 자동 정리]</h2>
      <p style="color:#666;font-size:13px">측정: ${kstNow()} · ✅ 해결돼 정리한 메일 ${resolved.length}건</p>
      ${keptManual.length ? `<h3 style="color:#DC2626">🛠️ 사람이 직접 확인 — ${keptManual.length}건 (자동삭제 안 함, "${KEEP_LABEL}" 라벨)</h3>
        <ul>${li(keptManual, x => `<li><b>${x.kind}</b> · ${x.subject}</li>`)}</ul>
        <p style="color:#555;font-size:13px">보안/수동조치/소유권 문제는 자동 수정 대상이 아닙니다. 서치콘솔에서 직접 확인하세요.</p>` : ''}
      ${keptBroken.length ? `<h3 style="color:#D97706">🔴 아직 안 고쳐진 페이지 — ${keptBroken.length}건 (재크롤 발사함, 메일 보존)</h3>
        <ul>${li(keptBroken, x => `<li>${x.subject}<br><span style="color:#888;font-size:12px">${x.broken.join('<br>')}</span></li>`)}</ul>` : ''}
      <p style="color:#9CA3AF;font-size:11px;margin-top:18px">해결 확인된 메일만 휴지통(30일 복구 가능)으로 옮깁니다. 이 메일은 사람 행동이 필요할 때만 발송됩니다.</p>
    </div>`;
    await sendMail(`[놀쿨][📬] 서치콘솔 메일 — 사람확인 ${keptManual.length} · 미해결 ${keptBroken.length}`, html);
  } else if (resolved.length && !DRY) {
    console.log(`✅ 해결 ${resolved.length}건 정리 완료, 사람 행동 필요 0 — 알림 메일 생략`);
  }
}

main().catch(e => { console.error('❌ 실패:', e); process.exit(1); });
