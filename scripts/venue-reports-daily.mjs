#!/usr/bin/env node
/**
 * 시즌64 — 폐업/오정보 신고 일일 요약 + threshold 즉시 알림
 *
 * 동작:
 *   1) pending 신고 전체 조회
 *   2) threshold 도달 (서로 다른 fp ≥3 × 같은 venue × 같은 reason) 별도 강조
 *   3) 매일 KST 09:30 메일 발송 (pending 0이어도 1통 — 사장님 안심용)
 *
 * 환경: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, NOTIFY_EMAIL
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || process.env.NOTIFICATION_EMAIL;

if (!SUPABASE_KEY || !RESEND_API_KEY || !NOTIFY_EMAIL) {
  console.error('❌ 필수 환경변수 누락 (SUPABASE_SERVICE_KEY / RESEND_API_KEY / NOTIFY_EMAIL)');
  process.exit(1);
}

const REASON_LABEL = {
  closed: '폐업',
  wrong_info: '오정보',
  duplicate: '중복',
  scam: '사기·바가지',
  other: '기타',
};

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchPending() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venue_reports?status=eq.pending&select=id,venue_slug,reason,evidence_url,memo,reporter_fingerprint,created_at&order=created_at.desc&limit=500`,
    { headers }
  );
  if (!res.ok) throw new Error(`pending fetch ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchLast24h() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venue_reports?created_at=gte.${since}&select=id,status`,
    { headers }
  );
  if (!res.ok) return [];
  return res.json();
}

function aggregateThresholds(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = `${r.venue_slug}|${r.reason}`;
    const cur = map.get(k) || { venue_slug: r.venue_slug, reason: r.reason, fps: new Set(), count: 0, oldest: r.created_at };
    cur.fps.add(r.reporter_fingerprint);
    cur.count += 1;
    if (r.created_at < cur.oldest) cur.oldest = r.created_at;
    map.set(k, cur);
  }
  return Array.from(map.values())
    .filter(x => x.fps.size >= 3)
    .sort((a, b) => b.fps.size - a.fps.size);
}

async function main() {
  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const pending = await fetchPending();
  const last24h = await fetchLast24h();
  const thresholds = aggregateThresholds(pending);

  const new24 = last24h.length;
  const verified24 = last24h.filter(r => r.status === 'verified').length;
  const rejected24 = last24h.filter(r => r.status === 'rejected').length;

  const hasThreshold = thresholds.length > 0;

  // 시간별 watch 모드 — threshold 도달 없으면 메일 skip
  if (process.env.THRESHOLD_ONLY === '1' && !hasThreshold) {
    console.log('✅ threshold 미도달 — 메일 skip');
    return;
  }

  // ★ 메일 정책 — 일일 모드도 실패시만 발송 (pending=0 + threshold=0 → 메일 skip)
  if (!hasThreshold && pending.length === 0) {
    console.log(`✅ 깨끗 — pending=0, threshold=0 — 메일 발송 안 함 (실패시만 정책)`);
    return;
  }

  const statusLabel = hasThreshold ? '⚠ threshold 도달' : (pending.length > 0 ? `대기 ${pending.length}건` : '✅ 신고 없음');
  const statusColor = hasThreshold ? '#DC2626' : (pending.length > 0 ? '#D97706' : '#059669');

  // threshold 섹션
  const thresholdHtml = hasThreshold ? `
    <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px;margin-bottom:20px">
      <p style="margin:0 0 8px;font-weight:700;color:#DC2626">⚠ ${thresholds.length}건 — 즉시 검토 권장 (서로 다른 신고자 3+)</p>
      <ul style="margin:0;padding-left:20px;color:#555;font-size:14px">
        ${thresholds.map(t => `
          <li style="margin-bottom:4px">
            <strong>${t.venue_slug}</strong> · ${REASON_LABEL[t.reason] || t.reason}
            · <span style="color:#DC2626">${t.fps.size}명 일치 (${t.count}건)</span>
            · 최초 ${new Date(t.oldest).toLocaleString('ko-KR')}
          </li>`).join('')}
      </ul>
    </div>` : '';

  // pending 목록 (상위 20)
  const pendingHtml = pending.length === 0 ? `
    <div style="background:#ECFDF5;border-left:4px solid #059669;padding:12px">
      <b>대기 중인 업소 신고 없음 — 깨끗.</b>
    </div>` : `
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#F3F4F6">
        <th style="text-align:left;padding:8px;border-bottom:2px solid #E5E7EB">업소</th>
        <th style="text-align:left;padding:8px;border-bottom:2px solid #E5E7EB">사유</th>
        <th style="text-align:left;padding:8px;border-bottom:2px solid #E5E7EB">증거</th>
        <th style="text-align:right;padding:8px;border-bottom:2px solid #E5E7EB">접수</th>
      </tr></thead>
      <tbody>
        ${pending.slice(0, 20).map(r => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px"><strong>${r.venue_slug}</strong></td>
            <td style="padding:8px">${REASON_LABEL[r.reason] || r.reason}</td>
            <td style="padding:8px"><a href="${r.evidence_url}" style="color:#2563EB;font-size:11px">link</a></td>
            <td style="padding:8px;text-align:right;color:#666;font-size:12px">${new Date(r.created_at).toLocaleString('ko-KR')}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    ${pending.length > 20 ? `<p style="color:#666;font-size:12px;margin:8px 0 0">… 외 ${pending.length - 20}건</p>` : ''}`;

  const html = `
    <div style="font-family:-apple-system,sans-serif;color:#111;max-width:680px;margin:0 auto;padding:20px">
      <h1 style="color:${statusColor};margin:0 0 8px">${statusLabel} · ${today} 업소 신고 일일</h1>
      <p style="color:#666;margin:0 0 20px">매일 KST 09:30 발송 · 시즌64 anti-abuse 8중 방어</p>

      <div style="background:#F9FAFB;border-radius:8px;padding:14px;margin-bottom:20px">
        <table style="width:100%;font-size:14px">
          <tr>
            <td style="padding:4px 0">최근 24h 접수</td>
            <td style="text-align:right;font-weight:700">${new24}건</td>
          </tr>
          <tr>
            <td style="padding:4px 0">확정 (verified)</td>
            <td style="text-align:right;font-weight:700;color:#059669">${verified24}건</td>
          </tr>
          <tr>
            <td style="padding:4px 0">기각 (rejected)</td>
            <td style="text-align:right;font-weight:700;color:#6B7280">${rejected24}건</td>
          </tr>
          <tr style="border-top:1px solid #E5E7EB">
            <td style="padding:8px 0 0">총 pending</td>
            <td style="text-align:right;padding:8px 0 0;font-weight:700;color:${pending.length > 0 ? '#D97706' : '#059669'}">${pending.length}건</td>
          </tr>
        </table>
      </div>

      ${thresholdHtml}

      <h2 style="font-size:15px;margin:24px 0 12px">대기 중 신고</h2>
      ${pendingHtml}

      <p style="color:#999;font-size:12px;margin:24px 0 0;text-align:center">
        놀쿨 신고봇 · 매일 KST 09:30 발송<br>
        관리자: <a href="https://nolcool.com/admin">nolcool.com/admin</a>
      </p>
    </div>`;

  const subject = hasThreshold
    ? `⚠ ${today} 즉시검토 ${thresholds.length}건 · 대기 ${pending.length}건`
    : `📋 ${today} 업소 신고 일일 — 대기 ${pending.length}건`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: '놀쿨 신고봇 <onboarding@resend.dev>',
      to: [NOTIFY_EMAIL],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error('❌ Resend 실패:', res.status, await res.text());
    process.exit(1);
  }
  console.log(`📧 venue-reports 일일 메일 발송 — pending=${pending.length} threshold=${thresholds.length}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
