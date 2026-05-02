#!/usr/bin/env node
/**
 * 24시간 자동 콘텐츠 생성 스크립트
 * GitHub Actions에서 매 시간 실행
 * 글 1개 + 댓글 3~5개 자동 생성 + 최근 글에 자동 댓글
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_KEY required');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const opts = { method, headers: { ...headers } };
  if (method === 'POST') opts.headers['Prefer'] = 'return=representation';
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  const text = await res.text();
  if (!text) return method === 'GET' ? [] : {};
  try { return JSON.parse(text); } catch { return {}; }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  // 1. 유저 목록
  const users = await api('GET', 'users?select=id&limit=20');
  if (!users.length) { console.log('No users, skipping'); return; }

  // 2. 미사용 글 가져오기
  let pool = await api('GET', 'seed_post_pool?used=eq.false&limit=1');
  if (!pool.length) {
    // 리셋
    await api('PATCH', 'seed_post_pool?used=eq.true', { used: false });
    pool = await api('GET', 'seed_post_pool?used=eq.false&limit=1');
  }
  if (!pool.length) { console.log('No post pool'); return; }

  const seedPost = pool[0];
  await api('PATCH', `seed_post_pool?id=eq.${seedPost.id}`, { used: true });

  // 3. 글 삽입
  const authorId = pick(users).id;
  const likes = Math.floor(Math.random() * 30) + 5;
  const newPost = await api('POST', 'posts', {
    user_id: authorId,
    title: seedPost.title,
    content: seedPost.content,
    category: seedPost.category,
    likes,
    comment_count: 0,
  });

  const postId = Array.isArray(newPost) ? newPost[0]?.id : newPost?.id;
  if (!postId) { console.log('Failed to create post:', JSON.stringify(newPost)); return; }
  console.log(`Post created: "${seedPost.title}" (${seedPost.category})`);

  // 4. 댓글 3~5개
  const commentCount = Math.floor(Math.random() * 3) + 3;
  const comments = await api('GET', `seed_comment_pool?limit=${commentCount}`);

  for (let i = 0; i < Math.min(commentCount, comments.length); i++) {
    const commenterId = pick(users.filter(u => u.id !== authorId) || users).id;
    await api('POST', 'comments', {
      post_id: postId,
      user_id: commenterId,
      content: comments[i].content,
    });
  }

  await api('PATCH', `posts?id=eq.${postId}`, { comment_count: Math.min(commentCount, comments.length) });
  console.log(`Added ${Math.min(commentCount, comments.length)} comments`);

  // 5. 최근 글에 자동 댓글 (글 쓰면 반응이 온다)
  const recent = await api('GET', 'posts?comment_count=lt.3&order=created_at.desc&limit=3');
  let replied = 0;
  for (const post of recent) {
    if (post.id === postId) continue; // 방금 만든 글 스킵
    const replyComment = pick(comments || [{ content: 'ㅋㅋ 공감' }]);
    const replierId = pick(users.filter(u => u.id !== post.user_id) || users).id;
    await api('POST', 'comments', {
      post_id: post.id,
      user_id: replierId,
      content: replyComment.content,
    });
    await api('PATCH', `posts?id=eq.${post.id}`, { comment_count: (post.comment_count || 0) + 1 });
    replied++;
  }
  console.log(`Auto-replied to ${replied} recent posts`);
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
