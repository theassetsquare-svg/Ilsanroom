#!/usr/bin/env node
// 일회용 검증 — 테스트계정 A/B로 댓글·대댓글 → 알림 발화 + self/시드 스킵 확인 후 전부 정리. 실행 후 삭제.
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const A_EMAIL = 'theassetsquare@gmail.com';
const B_EMAIL = 'baesunwook@gmail.com';

async function rest(method, path, body, prefer = 'return=representation') {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method, headers: { ...H, Prefer: prefer }, body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${t}`);
  return j;
}
async function findUid(email) {
  // admin API로 이메일 → uid (비밀번호 불필요)
  const r = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const j = await r.json();
  const list = j.users || j;
  const u = list.find(x => (x.email || '').toLowerCase() === email.toLowerCase());
  if (!u) throw new Error(`uid not found for ${email}`);
  return u.id;
}

(async () => {
  const Auid = await findUid(A_EMAIL);
  const Buid = await findUid(B_EMAIL);
  console.log(`A(${A_EMAIL})=${Auid}\nB(${B_EMAIL})=${Buid}`);

  const [post] = await rest('POST', 'posts', { category: 'free', title: '알림 배선 검증용 임시글', content: '트리거 동작 확인. 곧 삭제됩니다.', user_id: Auid });
  console.log(`\n[1] A 글 작성 post=${post.id}`);

  const [c1] = await rest('POST', 'comments', { post_id: post.id, user_id: Buid, content: 'B가 단 댓글입니다' });
  console.log(`[2] B 댓글 → A에게 'comment' 기대  c1=${c1.id}`);

  const [c2] = await rest('POST', 'comments', { post_id: post.id, user_id: Auid, content: 'A가 단 답글입니다', parent_id: c1.id });
  console.log(`[3] A 답글 → B에게 'reply' 기대 (A self 알림 없어야)  c2=${c2.id}`);

  // 시드/익명(user_id NULL) 댓글 — 알림 0이어야
  const [c3] = await rest('POST', 'comments', { post_id: post.id, user_id: null, content: '시드 댓글(익명)' });
  console.log(`[4] 익명 댓글(user_id NULL) → 알림 없어야  c3=${c3.id}`);

  await new Promise(r => setTimeout(r, 1500));

  const link = `/community/post/${post.id}`;
  const aN = await rest('GET', `notifications?select=id,type,title,message,link&link=eq.${encodeURIComponent(link)}&user_id=eq.${Auid}`, null);
  const bN = await rest('GET', `notifications?select=id,type,title,message,link&link=eq.${encodeURIComponent(link)}&user_id=eq.${Buid}`, null);
  console.log(`\n[5] A 알림: ${JSON.stringify(aN)}`);
  console.log(`    B 알림: ${JSON.stringify(bN)}`);

  const aComment = aN.find(n => n.type === 'comment');
  const aReplySelf = aN.find(n => n.message === 'A가 단 답글입니다');
  const bReply = bN.find(n => n.type === 'reply');
  const totalForPost = aN.length + bN.length;

  console.log(`\n=== 판정 ===`);
  console.log(`A 💬 comment 수신:        ${aComment ? 'PASS ✅  "'+aComment.title+'" / '+aComment.message : 'FAIL ❌'}`);
  console.log(`B ↩️ reply 수신:          ${bReply ? 'PASS ✅  "'+bReply.title+'" / '+bReply.message : 'FAIL ❌'}`);
  console.log(`A self-답글 알림 없음:    ${aReplySelf ? 'FAIL ❌' : 'PASS ✅'}`);
  console.log(`익명 댓글로 추가 알림 0:  ${totalForPost === 2 ? 'PASS ✅ (정확히 2통)' : 'FAIL ❌ ('+totalForPost+'통)'}`);

  // 정리
  console.log(`\n[6] 정리...`);
  for (const n of [...aN, ...bN]) await rest('DELETE', `notifications?id=eq.${n.id}`, null, 'return=minimal').catch(()=>{});
  for (const id of [c2.id, c1.id, c3.id]) await rest('DELETE', `comments?id=eq.${id}`, null, 'return=minimal').catch(()=>{});
  await rest('DELETE', `posts?id=eq.${post.id}`, null, 'return=minimal').catch(()=>{});
  const left = await rest('GET', `posts?select=id&id=eq.${post.id}`, null);
  const leftN = await rest('GET', `notifications?select=id&link=eq.${encodeURIComponent(link)}`, null);
  console.log(`    글 삭제: ${left.length === 0 ? 'PASS ✅' : 'FAIL ❌'} | 알림 잔여: ${leftN.length} | 댓글 잔여: 확인생략`);
  console.log(`\n${aComment && bReply && !aReplySelf && totalForPost === 2 && left.length === 0 ? '🎉 전체 PASS' : '⚠️ 일부 FAIL'}`);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
