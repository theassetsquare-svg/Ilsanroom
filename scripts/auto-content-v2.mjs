#!/usr/bin/env node
/**
 * 24시간 자동 콘텐츠 생성 v2 — 시간대별 활동량 시뮬레이션
 *
 * 이전 버전: 매시간 무조건 글 1개 생성 → 부자연스러움
 * 이번 버전:
 *  - 매 15분 실행 (96회/일)
 *  - 한국 표준시(KST) 기준 시간대별 활동량 다름
 *  - 새벽 1~4시 피크(유흥 특성), 점심~오후 휴면, 저녁 회복
 *  - 금/토/일 보너스 1.5배
 *  - 댓글은 글 작성 시간 기반으로 "성장하듯" 점진 추가
 *  - 글마다 추가될 댓글 개수 랜덤 (1~12개), 시간 지나면서 차차 달림
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

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────────────
// 시간대별 글 생성 확률 (KST 기준)
// 값 = 이번 15분에 글 1개 만들 확률 (0~1)
// 0이면 절대 안 만들고, 1이면 무조건 만듦
// ─────────────────────────────────────────────────────
function getPostProbability(hourKST, dayOfWeek) {
  // 시간대별 가중치 (유흥 사이트 특성: 새벽 피크, 점심 휴면)
  const hourly = {
    0: 0.95,  1: 1.00,  2: 1.00,  3: 0.85,  4: 0.55,
    5: 0.20,  6: 0.10,  7: 0.15,  8: 0.25,  9: 0.30,
    10: 0.35, 11: 0.40, 12: 0.50, 13: 0.30, 14: 0.20,
    15: 0.25, 16: 0.30, 17: 0.40, 18: 0.55, 19: 0.65,
    20: 0.75, 21: 0.85, 22: 0.90, 23: 0.95
  };

  let prob = hourly[hourKST] ?? 0.3;

  // 금(5)/토(6)/일(0) 보너스
  const weekendBonus = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.5
                     : (dayOfWeek === 0) ? 1.2
                     : 1.0;

  prob = Math.min(prob * weekendBonus, 1.0);

  return prob;
}

// 댓글 빠르게 달리는 글 vs 천천히 달리는 글 분포 (현실 반영)
function getCommentTargetCount() {
  const r = Math.random();
  if (r < 0.05) return 0;     // 5% 글은 댓글 0개 (불운한 글)
  if (r < 0.30) return rand(1, 2);  // 25% — 1~2개
  if (r < 0.65) return rand(3, 5);  // 35% — 3~5개 (평범)
  if (r < 0.90) return rand(6, 10); // 25% — 6~10개 (인기글)
  return rand(11, 18);              // 10% — 떡상글
}

// ─────────────────────────────────────────────────────
// 메인 로직
// ─────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  // KST = UTC+9
  const kstHour = (now.getUTCHours() + 9) % 24;
  const kstDow = (now.getUTCDay() + (now.getUTCHours() + 9 >= 24 ? 1 : 0)) % 7;

  console.log(`[v2] KST hour=${kstHour}, dayOfWeek=${kstDow}`);

  const users = await api('GET', 'users?select=id&limit=30');
  if (!users.length) { console.log('No users, skipping'); return; }

  // ── 1. 시간대 확률로 새 글 생성할지 결정 ──
  const postProb = getPostProbability(kstHour, kstDow);
  const willCreatePost = Math.random() < postProb;
  console.log(`[v2] Post probability=${postProb.toFixed(2)}, will create=${willCreatePost}`);

  if (willCreatePost) {
    // 피크 타임이면 한번에 2개까지 가능
    const postCount = (postProb >= 0.85 && Math.random() < 0.3) ? 2 : 1;

    for (let i = 0; i < postCount; i++) {
      let pool = await api('GET', 'seed_post_pool?used=eq.false&limit=1');
      if (!pool.length) {
        await api('PATCH', 'seed_post_pool?used=eq.true', { used: false });
        pool = await api('GET', 'seed_post_pool?used=eq.false&limit=1');
      }
      if (!pool.length) { console.log('No post pool'); break; }

      const seedPost = pool[0];
      await api('PATCH', `seed_post_pool?id=eq.${seedPost.id}`, { used: true });

      const authorId = pick(users).id;
      // 좋아요도 시간대별 다르게 (피크일수록 더 많이)
      const likesBase = Math.floor(postProb * 25);
      const likes = rand(Math.max(2, likesBase - 5), likesBase + 15);

      const newPost = await api('POST', 'posts', {
        user_id: authorId,
        title: seedPost.title,
        content: seedPost.content,
        category: seedPost.category,
        likes,
        comment_count: 0,
      });

      const postId = Array.isArray(newPost) ? newPost[0]?.id : newPost?.id;
      if (postId) {
        console.log(`[v2] Post created: "${seedPost.title}" (${seedPost.category}, likes=${likes})`);

        // 새 글에는 즉시 댓글 0~1개만 (자연스럽게)
        if (Math.random() < 0.4) {
          const firstComment = await api('GET', `seed_comment_pool?limit=1&order=id.asc`);
          if (firstComment.length) {
            const replierId = pick(users.filter(u => u.id !== authorId) || users).id;
            await api('POST', 'comments', {
              post_id: postId,
              user_id: replierId,
              content: firstComment[0].content,
            });
            await api('PATCH', `posts?id=eq.${postId}`, { comment_count: 1 });
            console.log(`[v2] Initial comment added`);
          }
        }
      }
    }
  }

  // ── 2. 기존 글에 점진적으로 댓글 추가 (성장 효과) ──
  // 최근 24시간 글 중 댓글 적게 달린거에 추가
  const recentPosts = await api('GET', 'posts?order=created_at.desc&limit=20');

  let repliesAdded = 0;
  for (const post of recentPosts) {
    const ageMin = (Date.now() - new Date(post.created_at).getTime()) / 60000;
    if (ageMin < 5) continue;          // 너무 새글 스킵
    if (ageMin > 1440) continue;       // 24시간 넘은 글 스킵

    // 글마다 목표 댓글 수 (글 ID 기반 결정적)
    const target = getCommentTargetCount();
    const current = post.comment_count || 0;
    if (current >= target) continue;

    // 시간이 지날수록 댓글 달릴 확률 ↑ (단, 너무 많으면 안 달림)
    // 1시간 = 30%, 3시간 = 60%, 6시간 = 80%
    const ageScore = Math.min(ageMin / 360, 1) * 0.8 + 0.2;
    const wantsReply = Math.random() < ageScore * postProb;
    if (!wantsReply) continue;

    const comments = await api('GET', `seed_comment_pool?limit=1&order=id.desc`);
    if (!comments.length) continue;

    const replierId = pick(users.filter(u => u.id !== post.user_id) || users).id;
    await api('POST', 'comments', {
      post_id: post.id,
      user_id: replierId,
      content: pick(comments).content,
    });
    await api('PATCH', `posts?id=eq.${post.id}`, { comment_count: (post.comment_count || 0) + 1 });
    repliesAdded++;

    if (repliesAdded >= 3) break;  // 매 실행마다 최대 3개 댓글
  }
  console.log(`[v2] Added ${repliesAdded} progressive comments`);

  console.log('[v2] Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
