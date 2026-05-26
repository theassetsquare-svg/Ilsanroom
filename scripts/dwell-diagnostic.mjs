/**
 * dwell-diagnostic — Bounce 100% 원인 진단 (일회용)
 *
 * dwell-time-monitor와 같은 page_events를 읽고:
 *   ① 세션당 event_type 분포 (view 단독 vs view+exit vs view+scroll+...)
 *   ② 멀티 path 세션 비율
 *   ③ exit 이벤트 캡처율 (총 view 대비 exit 비율)
 *
 * 결론으로 분류:
 *   - 진짜 bounce: view+exit 다 찍히는데 path 1개
 *   - 측정 누락: view만 있고 exit 없음 (mobile pagehide 누락)
 *   - 세션 분절: session_id가 path마다 다름 (sessionStorage 깨짐)
 */
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

function fetchJson(url, headers) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 30000);
    https.get(url, { headers }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        clearTimeout(t);
        try { res({ status: r.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (e) { res({ status: r.statusCode, body: null, error: e.message }); }
      });
    }).on('error', e => { clearTimeout(t); rej(e); });
  });
}

async function main() {
  if (!SUPABASE_SECRET_KEY) { console.error('SUPABASE_SECRET_KEY 없음'); process.exit(1); }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/page_events?select=session_id,path,event_type,device_type,dwell_ms,created_at&created_at=gt.${since}&order=created_at.asc&limit=20000`;
  const r = await fetchJson(url, { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` });
  if (r.status !== 200) { console.error('HTTP', r.status, JSON.stringify(r.body)); process.exit(1); }
  const events = r.body;
  console.log(`total events: ${events.length}`);

  /* 세션 그룹핑 */
  const sessions = {};
  for (const e of events) {
    if (!sessions[e.session_id]) sessions[e.session_id] = [];
    sessions[e.session_id].push(e);
  }
  const sessionIds = Object.keys(sessions);
  console.log(`total sessions: ${sessionIds.length}`);

  /* event_type 글로벌 분포 */
  const typeGlobal = {};
  for (const e of events) typeGlobal[e.event_type] = (typeGlobal[e.event_type] || 0) + 1;
  console.log('\nevent_type 분포 (global):');
  for (const [t, n] of Object.entries(typeGlobal).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${t.padEnd(12)} ${n}`);
  }

  /* 세션별 event_type 조합 분포 */
  const comboDist = {};
  const pathCountDist = {};
  const eventCountDist = {};
  let onlyViewSessions = 0;
  let hasExitSessions = 0;
  let multiPathSessions = 0;
  const examples = { only_view: [], view_plus: [], multi_path: [] };

  for (const sid of sessionIds) {
    const s = sessions[sid];
    const types = new Set(s.map(e => e.event_type));
    const paths = new Set(s.map(e => e.path));
    const combo = [...types].sort().join('+');
    comboDist[combo] = (comboDist[combo] || 0) + 1;
    pathCountDist[paths.size] = (pathCountDist[paths.size] || 0) + 1;
    eventCountDist[s.length] = (eventCountDist[s.length] || 0) + 1;
    if (types.size === 1 && types.has('view')) {
      onlyViewSessions++;
      if (examples.only_view.length < 5) examples.only_view.push({ sid, n: s.length, path: s[0].path, device: s[0].device_type });
    }
    if (types.has('exit')) {
      hasExitSessions++;
      if (examples.view_plus.length < 5) examples.view_plus.push({ sid, types: [...types].join(','), paths: [...paths].join(',') });
    }
    if (paths.size >= 2) {
      multiPathSessions++;
      if (examples.multi_path.length < 5) examples.multi_path.push({ sid, paths: [...paths].join(' → ') });
    }
  }

  console.log('\nevent_type 조합 분포 (per session, top 15):');
  for (const [c, n] of Object.entries(comboDist).sort((a,b) => b[1]-a[1]).slice(0, 15)) {
    console.log(`  ${String(n).padStart(4)} ${c}`);
  }

  console.log('\nunique path 분포:');
  for (const [p, n] of Object.entries(pathCountDist).sort((a,b) => Number(a[0])-Number(b[0]))) {
    console.log(`  paths=${p}: ${n} 세션`);
  }

  console.log('\nevent count 분포:');
  for (const [c, n] of Object.entries(eventCountDist).sort((a,b) => Number(a[0])-Number(b[0])).slice(0, 12)) {
    console.log(`  events=${c}: ${n} 세션`);
  }

  console.log('\n── 핵심 KPI ──');
  console.log(`view 단독 세션 (exit/scroll/time 0): ${onlyViewSessions}/${sessionIds.length} (${(onlyViewSessions/sessionIds.length*100).toFixed(1)}%)`);
  console.log(`exit 있는 세션:                       ${hasExitSessions}/${sessionIds.length} (${(hasExitSessions/sessionIds.length*100).toFixed(1)}%)`);
  console.log(`멀티 path 세션 (≥2 unique):           ${multiPathSessions}/${sessionIds.length} (${(multiPathSessions/sessionIds.length*100).toFixed(1)}%)`);

  /* device 분포 */
  const deviceSessions = {};
  for (const sid of sessionIds) {
    const dev = sessions[sid][0].device_type || 'unknown';
    if (!deviceSessions[dev]) deviceSessions[dev] = { total: 0, onlyView: 0, multiPath: 0 };
    deviceSessions[dev].total++;
    const types = new Set(sessions[sid].map(e => e.event_type));
    const paths = new Set(sessions[sid].map(e => e.path));
    if (types.size === 1 && types.has('view')) deviceSessions[dev].onlyView++;
    if (paths.size >= 2) deviceSessions[dev].multiPath++;
  }
  console.log('\n디바이스별 분포:');
  for (const [dev, s] of Object.entries(deviceSessions)) {
    console.log(`  ${dev.padEnd(10)} total=${s.total}, view단독=${s.onlyView} (${(s.onlyView/s.total*100).toFixed(0)}%), 멀티path=${s.multiPath} (${(s.multiPath/s.total*100).toFixed(0)}%)`);
  }

  /* 결론 */
  console.log('\n── 결론 ──');
  const onlyViewPct = onlyViewSessions / sessionIds.length;
  const multiPathPct = multiPathSessions / sessionIds.length;
  if (onlyViewPct > 0.7) {
    console.log('🛑 view 단독 세션이 70%+ — 측정 누락 가능 (exit/pagehide 미캡처)');
    console.log('   대응: send()에 navigator.sendBeacon() 폴백 추가 (mobile Safari bfcache 대응)');
  } else if (multiPathPct < 0.05 && hasExitSessions / sessionIds.length > 0.5) {
    console.log('ℹ️  exit는 잘 잡히는데 멀티 path 세션이 5% 미만 — 실제 bounce 행동');
    console.log('   대응: 진입 페이지 cross-link 강화, 즉시 클릭 가능한 위젯 추가 (UX 영역)');
  } else {
    console.log('ℹ️  혼합 — 측정 일부 누락 + 실제 bounce 둘 다');
  }

  /* 샘플 */
  console.log('\n샘플: view 단독 세션 (측정 누락 의심)');
  for (const e of examples.only_view) console.log(`  ${e.sid} | ${e.device} | n=${e.n} | path=${e.path}`);
  console.log('\n샘플: 멀티 path 세션 (정상 navigation)');
  for (const e of examples.multi_path) console.log(`  ${e.sid} | ${e.paths}`);
}

main().catch(e => { console.error(e); process.exit(1); });
