#!/usr/bin/env node
// 일회용 — 라이브 벨 화면확인용. A→B 실제 댓글흐름으로 B에게 알림 1건 남긴다(삭제 안 함).
// ACTION=cleanup 이면 마커 글/댓글/알림만 정리. 실행 후 파일 삭제 예정.
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const ACTION = process.env.ACTION || 'create';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const MARK = '알림 화면확인용 임시글';
const A_EMAIL = 'theassetsquare@gmail.com', B_EMAIL = 'baesunwook@gmail.com';

async function rest(method, path, body, prefer = 'return=representation') {
  const r = await fetch(`${URL}/rest/v1/${path}`, { method, headers: { ...H, Prefer: prefer }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${t}`);
  return j;
}
async function uid(email) {
  const r = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const j = await r.json(); const u = (j.users || j).find(x => (x.email||'').toLowerCase() === email.toLowerCase());
  if (!u) throw new Error(`uid not found ${email}`); return u.id;
}
async function purge() {
  const posts = await rest('GET', `posts?select=id&title=eq.${encodeURIComponent(MARK)}`, null);
  for (const p of posts) {
    const link = `/community/post/${p.id}`;
    for (const n of await rest('GET', `notifications?select=id&link=eq.${encodeURIComponent(link)}`, null)) await rest('DELETE', `notifications?id=eq.${n.id}`, null, 'return=minimal').catch(()=>{});
    await rest('DELETE', `comments?post_id=eq.${p.id}`, null, 'return=minimal').catch(()=>{});
    await rest('DELETE', `posts?id=eq.${p.id}`, null, 'return=minimal').catch(()=>{});
  }
  console.log(`purged ${posts.length} marker post(s)`);
}

(async () => {
  await purge(); // 이전 잔여 정리(멱등)
  if (ACTION === 'cleanup') { console.log('CLEANUP DONE ✅'); return; }

  const Auid = await uid(A_EMAIL), Buid = await uid(B_EMAIL);
  const [post] = await rest('POST', 'posts', { category: 'free', title: MARK, content: '벨 화면확인용. 캡처 후 삭제됩니다.', user_id: Buid });
  await rest('POST', 'comments', { post_id: post.id, user_id: Auid, content: 'A가 B 글에 남긴 댓글입니다' });
  await new Promise(r => setTimeout(r, 1200));
  const link = `/community/post/${post.id}`;
  const bN = await rest('GET', `notifications?select=id,type,title,message,is_read,link&link=eq.${encodeURIComponent(link)}&user_id=eq.${Buid}`, null);
  console.log(`post=${post.id}\nB 알림: ${JSON.stringify(bN)}`);
  console.log(bN.find(n=>n.type==='comment') ? '✅ B에게 comment 알림 생성됨 — 라이브 벨 캡처 준비 완료 (미삭제)' : '❌ 알림 없음');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
