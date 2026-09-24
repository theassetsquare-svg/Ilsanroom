#!/usr/bin/env node
/**
 * [놀쿨11-5] 가입 급증 사람 패턴 검사 — 표시만 한다(차단·삭제 0).
 *  가짜 0 규칙: 가짜 회원·자동 가입·구매 트래픽을 우리가 만들지 않을 뿐 아니라, 들어온 것도 월간 보고에 드러낸다.
 *  판정은 「보류 표시」까지 — 막을지는 규칙대로 사람이 본다(대표님 결정 아님 · 지시서 11-5 2-5).
 *
 *  입력: --in=<json>  [{ id, created_at(ISO), ip?(원문 또는 해시), provider? }]  ← Supabase 인증 사용자 내보내기
 *  출력: --out=<json> (없으면 화면만) · 종료코드 항상 0(표시 도구)
 *  규칙:
 *   R1 같은 IP 에서 60분 안에 가입 3건 이상 → 그 계정들 「보류 표시」
 *   R2 사이트 전체 10분 안에 가입 20건 이상 → 「급증 표시」(그 창의 첫·끝 시각)
 *   R3 같은 제공자로 1분 안에 5건 이상 연속 → 「연속 가입 표시」
 *  --self-test : 내장 예시로 규칙이 맞게 걸리는지 확인(검증 스크립트가 부른다)
 */
import fs from 'node:fs';

export const RULES = { sameIpN: 3, sameIpWindowMin: 60, burstN: 20, burstWindowMin: 10, streakN: 5, streakWindowMin: 1 };

export function detect(rows, rules = RULES) {
  const list = (rows || []).filter((r) => r && r.created_at && !Number.isNaN(Date.parse(r.created_at))).map((r) => ({ ...r, t: Date.parse(r.created_at) })).sort((a, b) => a.t - b.t);
  const hold = new Set(); const flags = [];
  // R1
  const byIp = {};
  for (const r of list) if (r.ip) (byIp[r.ip] ||= []).push(r);
  for (const [ip, arr] of Object.entries(byIp)) {
    for (let i = 0; i < arr.length; i++) {
      const win = arr.filter((x) => x.t >= arr[i].t && x.t - arr[i].t <= rules.sameIpWindowMin * 60000);
      if (win.length >= rules.sameIpN) { win.forEach((x) => hold.add(x.id)); flags.push({ rule: 'R1', ip: String(ip).slice(0, 12), n: win.length, from: new Date(win[0].t).toISOString() }); break; }
    }
  }
  // R2
  for (let i = 0; i < list.length; i++) {
    const win = list.filter((x) => x.t >= list[i].t && x.t - list[i].t <= rules.burstWindowMin * 60000);
    if (win.length >= rules.burstN) { flags.push({ rule: 'R2', n: win.length, from: new Date(win[0].t).toISOString(), to: new Date(win[win.length - 1].t).toISOString() }); break; }
  }
  // R3
  const byProv = {};
  for (const r of list) (byProv[r.provider || 'unknown'] ||= []).push(r);
  for (const [prov, arr] of Object.entries(byProv)) {
    for (let i = 0; i < arr.length; i++) {
      const win = arr.filter((x) => x.t >= arr[i].t && x.t - arr[i].t <= rules.streakWindowMin * 60000);
      if (win.length >= rules.streakN) { flags.push({ rule: 'R3', provider: prov, n: win.length, from: new Date(win[0].t).toISOString() }); break; }
    }
  }
  return { total: list.length, holdIds: [...hold], flags, action: 'display-only' };
}

export function selfTest() {
  const base = Date.parse('2026-09-24T01:00:00Z');
  const at = (m) => new Date(base + m * 60000).toISOString();
  const cases = [];
  // 사람 같은 가입(띄엄띄엄 · IP 다름) → 표시 0
  const normal = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, created_at: at(i * 37), ip: `10.0.0.${i}`, provider: i % 2 ? 'kakao' : 'google' }));
  const r0 = detect(normal); cases.push({ name: '정상 12건 → 표시 0', ok: r0.flags.length === 0 && r0.holdIds.length === 0 });
  // 같은 IP 3건/20분 → R1 보류 3
  const sameIp = [...normal, { id: 'a1', created_at: at(5), ip: '1.2.3.4', provider: 'kakao' }, { id: 'a2', created_at: at(15), ip: '1.2.3.4', provider: 'kakao' }, { id: 'a3', created_at: at(25), ip: '1.2.3.4', provider: 'google' }];
  const r1 = detect(sameIp); cases.push({ name: '같은 IP 3건/20분 → R1 · 보류 3', ok: r1.flags.some((f) => f.rule === 'R1') && ['a1', 'a2', 'a3'].every((x) => r1.holdIds.includes(x)) && r1.holdIds.length === 3 });
  // 같은 IP 2건 → 표시 0
  const two = [...normal, { id: 'b1', created_at: at(5), ip: '5.6.7.8' }, { id: 'b2', created_at: at(9), ip: '5.6.7.8' }];
  cases.push({ name: '같은 IP 2건 → R1 없음', ok: !detect(two).flags.some((f) => f.rule === 'R1') });
  // 같은 IP 3건이지만 2시간에 걸침 → 표시 0
  const spread = [...normal, { id: 'c1', created_at: at(0), ip: '9.9.9.9' }, { id: 'c2', created_at: at(70), ip: '9.9.9.9' }, { id: 'c3', created_at: at(140), ip: '9.9.9.9' }];
  cases.push({ name: '같은 IP 3건/140분 → R1 없음', ok: !detect(spread).flags.some((f) => f.rule === 'R1') });
  // 10분 안 20건 → R2
  const burst = Array.from({ length: 20 }, (_, i) => ({ id: `u${i}`, created_at: at(i * 0.4), ip: `172.16.0.${i}`, provider: i % 3 ? 'kakao' : 'google' }));
  cases.push({ name: '10분 안 20건 → R2 급증', ok: detect(burst).flags.some((f) => f.rule === 'R2') });
  cases.push({ name: '10분 안 19건 → R2 없음', ok: !detect(burst.slice(0, 19)).flags.some((f) => f.rule === 'R2') });
  // 같은 제공자 1분 안 5건 → R3
  const streak = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, created_at: at(i * 0.2), ip: `192.168.1.${i}`, provider: 'kakao' }));
  cases.push({ name: '같은 제공자 1분 안 5건 → R3', ok: detect(streak).flags.some((f) => f.rule === 'R3') });
  cases.push({ name: '같은 제공자 1분 안 4건 → R3 없음', ok: !detect(streak.slice(0, 4)).flags.some((f) => f.rule === 'R3') });
  // 표시만 — action 값
  cases.push({ name: '행동 = 표시만(display-only)', ok: detect(sameIp).action === 'display-only' });
  // 망가진 행 무시
  cases.push({ name: '시각 없는 행 무시', ok: detect([{ id: 'x' }, { id: 'y', created_at: 'bad' }]).total === 0 });
  return cases;
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/member-signup-anomaly.mjs');
if (isMain) {
  const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
  if (process.argv.includes('--self-test')) {
    const cases = selfTest();
    for (const c of cases) console.log(`${c.ok ? '통과' : '실패'} · ${c.name}`);
    console.log(`자체 시험 ${cases.length}건 · 실패 ${cases.filter((c) => !c.ok).length}`);
    process.exit(0);
  }
  const inPath = arg('in');
  if (!inPath || !fs.existsSync(inPath)) { console.log('입력 파일 없음 — --in=<Supabase 인증 사용자 내보내기 json> (표시 도구 · 종료 0)'); process.exit(0); }
  const res = detect(JSON.parse(fs.readFileSync(inPath, 'utf8')));
  console.log(`가입 ${res.total}건 · 표시 ${res.flags.length}건 · 보류 표시 계정 ${res.holdIds.length}개 (차단·삭제 0)`);
  for (const f of res.flags) console.log('  ', JSON.stringify(f));
  const out = arg('out');
  if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
}
