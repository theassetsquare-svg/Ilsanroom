import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { fetchPosts, createPost, fetchComments, createComment, deletePost, type Post } from '@/lib/community-api';

/* ── 조각모임 규칙 (놀쿨 버전) ── */
const JOGAK_RULES = [
  { icon: '📝', title: '양식 필수 작성', desc: '장소·날짜·시간·인원·비용 미기재 시 무통보 삭제됩니다.' },
  { icon: '🏷️', title: '지역 & 성향 말머리', desc: '지역과 조각 성향(테이블/헌팅) 반드시 선택하세요.' },
  { icon: '🪑', title: '테이블 미예약 = 헌팅조각', desc: '테이블을 잡지 않는 클럽/라운지 조각은 헌팅조각으로 분류됩니다.' },
  { icon: '👤', title: '담당자 정보', desc: '제휴 업장은 반드시 담당 MD/웨이터 이름을 기재하세요. 미기재 시 삭제.' },
  { icon: '🚫', title: '오픈카톡 모집 금지', desc: '사기 방지를 위해 오픈카카오톡방 모집은 금지합니다. 놀쿨 쪽지/댓글만 허용.' },
  { icon: '💰', title: '방장 수고비 안내', desc: '홍대: 평균 1만 / 최대 2만원, 그 외: 평균 3만 / 최대 5만원. 가성비 조각(엔빵 8만원 이하)은 수고비 없음.' },
  { icon: '🔞', title: '만 19세 이상만 참여', desc: '미성년자는 참여할 수 없습니다.' },
  { icon: '⚠️', title: '노쇼 = 활동 정지', desc: '약속 불이행 시 경고 없이 활동이 정지됩니다.' },
];

const REGIONS = ['강남', '홍대', '이태원', '압구정', '일산', '부산', '수원', '대전', '인천', '대구', '성남', '기타'];
const JOGAK_TYPES = ['테이블', '헌팅', '혼합'];
const GENDER_OPTIONS = ['누구나', '남성만', '여성만', '남녀 혼성'];
const COST_OPTIONS = ['모든비용 엔빵', '주대만 엔빵', '각자 부담', '방장 초대'];
const CONTACT_OPTIONS = ['놀쿨 쪽지', '놀쿨 댓글', '전화'];
const PHOTO_OPTIONS = ['사진교환 필수', '사진교환 선택', '사진교환 안 함'];

interface JogakPost {
  id: string;
  title: string;
  author: string;
  date: string;
  comments: number;
  // 구조화 필드
  region?: string;
  jogakType?: string;
  venue?: string;
  meetDate?: string;
  meetTime?: string;
  maxPeople?: number;
  currentPeople?: number;
  genderPref?: string;
  ageRange?: string;
  costSplit?: string;
  tableCost?: string;
  perPerson?: string;
  mdName?: string;
  contactMethod?: string;
  photoExchange?: string;
  message?: string;
}

function parseJogakPost(post: Post): JogakPost {
  const u = post.users as any;
  let p: any = {};
  try { p = JSON.parse(post.content); } catch { p = { message: post.content }; }

  return {
    id: post.id,
    title: post.title,
    author: u?.nickname || '사용자',
    date: post.created_at.slice(0, 10),
    comments: (post as any).comment_count || 0,
    region: p.region,
    jogakType: p.jogakType,
    venue: p.venue,
    meetDate: p.meetDate,
    meetTime: p.meetTime,
    maxPeople: p.maxPeople,
    currentPeople: p.currentPeople || 1,
    genderPref: p.genderPref,
    ageRange: p.ageRange,
    costSplit: p.costSplit,
    tableCost: p.tableCost,
    perPerson: p.perPerson,
    mdName: p.mdName,
    contactMethod: p.contactMethod,
    photoExchange: p.photoExchange,
    message: p.message || p.desc,
  };
}

/* ── 섹션 헤더 ── */
function SectionHeader({ title }: { title: string }) {
  return <div className="flex items-center gap-2 mb-2 mt-5 first:mt-0"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs font-bold px-2" style={{ color: '#8B5CF6' }}>{title}</span><div className="h-px flex-1 bg-gray-200" /></div>;
}

export default function JogakPage() {
  useDocumentMeta('조각모임 — 같이 갈 사람 바로 구하기', '클럽·나이트·라운지 같이 갈 사람을 모집하세요. 테이블조각, 헌팅조각, 지역별 실시간 모집.');

  const { user } = useAuth();
  const [posts, setPosts] = useState<JogakPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [filterRegion, setFilterRegion] = useState('전체');

  // 글 상세
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  // 글쓰기
  const [showWrite, setShowWrite] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 폼 필드
  const [f, setF] = useState({
    title: '', region: '', jogakType: '테이블', venue: '', date: '', time: '',
    maxPeople: '4', gender: '누구나', ageRange: '', cost: '모든비용 엔빵',
    tableCost: '', perPerson: '', mdName: '', contact: '놀쿨 댓글',
    photo: '사진교환 선택', message: '',
  });
  const setField = (key: string, value: string) => setF(prev => ({ ...prev, [key]: value }));

  // DB 로드
  useEffect(() => {
    (async () => {
      const { data } = await fetchPosts('party', 50);
      setPosts(data.map(parseJogakPost));
      setLoading(false);
    })();
  }, []);

  const loadComments = async (postId: string) => {
    const data = await fetchComments(postId);
    setComments(data);
  };

  const handlePostClick = (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); return; }
    setSelectedPost(postId);
    setCommentText(''); setReplyTo(null); setReplyText('');
    setComments([]);
    loadComments(postId);
  };

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWrite(true);
  };

  const handleSubmit = async () => {
    if (!f.title.trim() || !f.region || !f.date || !f.time || !f.maxPeople || !f.cost) return;
    setSubmitting(true);

    const contentJson = JSON.stringify({
      region: f.region, jogakType: f.jogakType, venue: f.venue.trim(),
      meetDate: f.date, meetTime: f.time, maxPeople: Number(f.maxPeople) || 4,
      currentPeople: 1, genderPref: f.gender, ageRange: f.ageRange.trim(),
      costSplit: f.cost, tableCost: f.tableCost.trim(), perPerson: f.perPerson.trim(),
      mdName: f.mdName.trim(), contactMethod: f.contact, photoExchange: f.photo,
      message: f.message.trim(),
    });

    const result = await createPost({ category: 'party', title: f.title.trim(), content: contentJson });
    if (!result.error) {
      setShowWrite(false);
      setF({ title: '', region: '', jogakType: '테이블', venue: '', date: '', time: '', maxPeople: '4', gender: '누구나', ageRange: '', cost: '모든비용 엔빵', tableCost: '', perPerson: '', mdName: '', contact: '놀쿨 댓글', photo: '사진교환 선택', message: '' });
      const { data } = await fetchPosts('party', 50);
      setPosts(data.map(parseJogakPost));
    }
    setSubmitting(false);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    const { error } = await createComment(selectedPost, commentText.trim());
    if (!error) { setCommentText(''); await loadComments(selectedPost); }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !user || !selectedPost || !replyTo) return;
    const { error } = await createComment(selectedPost, replyText.trim(), replyTo.id);
    if (!error) { setReplyText(''); setReplyTo(null); await loadComments(selectedPost); }
  };

  const filtered = filterRegion === '전체' ? posts : posts.filter(p => p.region === filterRegion);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/community" className="mb-1 inline-block text-xs" style={{ color: '#999' }}>← 커뮤니티</Link>
          <h1 className="text-2xl font-black" style={{ color: '#111' }}>조각 모집</h1>
          <p className="mt-1 text-sm" style={{ color: '#555' }}>같이 놀러갈 사람, 바로 구하기</p>
        </div>
        <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
          + 조각 올리기
        </button>
      </div>

      {/* 규칙 */}
      <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <button onClick={() => setShowRules(!showRules)}
          className="flex w-full items-center justify-between px-4 py-3" style={{ backgroundColor: '#FEF3C7' }}>
          <span className="text-sm font-bold" style={{ color: '#92400E' }}>⚠️ 조각모임 필독 규칙</span>
          <span className="text-xs" style={{ color: '#92400E' }}>{showRules ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        {showRules && (
          <div className="px-4 py-3 space-y-3" style={{ backgroundColor: '#FFFBEB' }}>
            {JOGAK_RULES.map((rule, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-sm shrink-0">{rule.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#111' }}>{rule.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#555' }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 지역 필터 */}
      <div className="overflow-x-auto scrollbar-hide mb-4">
        <div className="flex gap-1.5">
          {['전체', ...REGIONS].map(r => (
            <button key={r} onClick={() => setFilterRegion(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${filterRegion === r ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-[#555]'}`}
              style={{ minHeight: 32 }}>{r}</button>
          ))}
        </div>
      </div>

      {/* 글 목록 */}
      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: '#9CA3AF' }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">🧩</p>
          <p className="text-base font-bold mb-1" style={{ color: '#111' }}>아직 모집글이 없습니다</p>
          <p className="text-sm mb-4" style={{ color: '#999' }}>첫 번째 조각을 올려보세요!</p>
          <button onClick={handleWriteClick} className="rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>조각 올리기</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: '#E5E7EB' }}>
              {/* 카드 헤더 — 말머리 */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                {post.region && <span className="rounded px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: '#8B5CF6', color: '#FFF' }}>{post.region}</span>}
                {post.jogakType && <span className="rounded px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: post.jogakType === '헌팅' ? '#F59E0B' : '#10B981', color: '#FFF' }}>{post.jogakType}</span>}
                {post.meetDate && <span className="text-[11px]" style={{ color: '#999' }}>{post.meetDate} {post.meetTime}</span>}
              </div>

              {/* 카드 본문 */}
              <div onClick={() => handlePostClick(post.id)} className="cursor-pointer px-4 py-2 transition hover:bg-gray-50">
                <h3 className="text-sm font-bold mb-2" style={{ color: '#111' }}>{post.title}</h3>

                {/* 핵심 정보 그리드 */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                  {post.venue && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>장소</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.venue}</span></div>}
                  {post.maxPeople && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>인원</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.currentPeople || 1}/{post.maxPeople}명</span></div>}
                  {post.costSplit && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>비용</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.costSplit}</span></div>}
                  {post.genderPref && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>성별</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.genderPref}</span></div>}
                  {post.ageRange && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>연령</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.ageRange}</span></div>}
                  {post.mdName && <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#999' }}>담당</span><span className="text-xs font-bold" style={{ color: '#111' }}>{post.mdName}</span></div>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                  {post.comments > 0 && <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>댓글 {post.comments}</span>}
                </div>
              </div>

              {/* 상세 + 댓글 */}
              {selectedPost === post.id && (
                <div className="px-4 pb-4 pt-2" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
                  {/* 상세 정보 카드 */}
                  <div className="rounded-lg border p-3 mb-3 bg-white" style={{ borderColor: '#E5E7EB' }}>
                    <div className="space-y-1.5 text-sm">
                      {post.venue && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>조각장소</span><span style={{ color: '#111' }}>{post.region} {post.venue}</span></div>}
                      {post.meetDate && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>날짜/시간</span><span style={{ color: '#111' }}>{post.meetDate} {post.meetTime}</span></div>}
                      {post.ageRange && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>모집연령</span><span style={{ color: '#111' }}>{post.ageRange}</span></div>}
                      {post.photoExchange && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>사진교환</span><span style={{ color: '#111' }}>{post.photoExchange}</span></div>}
                      {post.tableCost && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>주대내역</span><span style={{ color: '#111' }}>{post.tableCost}</span></div>}
                      {post.maxPeople && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>인원</span><span style={{ color: '#111' }}>{post.currentPeople || 1}/{post.maxPeople}명</span></div>}
                      {post.perPerson && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>1인당</span><span style={{ color: '#111' }}>{post.perPerson}</span></div>}
                      {post.costSplit && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>비용분담</span><span style={{ color: '#111' }}>{post.costSplit}</span></div>}
                      {post.mdName && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>담당MD</span><span style={{ color: '#111' }}>{post.mdName}</span></div>}
                      {post.contactMethod && <div className="flex"><span className="w-20 shrink-0 font-bold" style={{ color: '#555' }}>연락방법</span><span style={{ color: '#111' }}>{post.contactMethod}</span></div>}
                    </div>
                  </div>

                  {/* 한마디 */}
                  {post.message && (
                    <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#F3F0FF' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>조각에게 한마디</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{post.message}</p>
                    </div>
                  )}

                  {/* 삭제 */}
                  {user && (
                    <button onClick={async () => {
                      const result = await deletePost(post.id);
                      if (!result.error) { setSelectedPost(null); setPosts(prev => prev.filter(p => p.id !== post.id)); }
                    }} className="text-xs mb-3" style={{ color: '#EF4444', minHeight: 32 }}>글 삭제</button>
                  )}

                  {/* 댓글 */}
                  <div className="border-t pt-3 mb-3" style={{ borderColor: '#E5E7EB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>댓글 {comments.length}개</p>
                    {comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.filter(c => !c.parent_id).map((c: any) => {
                          const nickname = c.users?.nickname || '익명';
                          const children = comments.filter((ch: any) => ch.parent_id === c.id);
                          return (
                            <div key={c.id}>
                              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                                <p className="text-sm" style={{ color: '#111' }}>{c.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{nickname} · {c.created_at?.slice(5, 10)}</span>
                                  {user && (
                                    <button onClick={() => { setReplyTo(replyTo?.id === c.id ? null : { id: c.id, nickname }); setReplyText(''); }}
                                      className="text-xs font-medium" style={{ color: '#8B5CF6' }}>
                                      {replyTo?.id === c.id ? '취소' : '답글'}
                                    </button>
                                  )}
                                </div>
                                {replyTo?.id === c.id && (
                                  <div className="flex gap-2 mt-2">
                                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleReplySubmit(); }}
                                      placeholder={`${nickname}에게 답글...`}
                                      className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                                      style={{ borderColor: '#D1D5DB', color: '#111', minHeight: 40 }} autoFocus />
                                    <button onClick={handleReplySubmit} disabled={!replyText.trim()}
                                      className="rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                                      style={{ backgroundColor: '#8B5CF6', minHeight: 40 }}>등록</button>
                                  </div>
                                )}
                              </div>
                              {children.map((ch: any) => (
                                <div key={ch.id} className="rounded-lg px-3 py-2 ml-6 mt-1" style={{ backgroundColor: '#F9FAFB', borderLeft: '3px solid #8B5CF6' }}>
                                  <p className="text-sm" style={{ color: '#111' }}><span className="text-xs font-medium mr-1" style={{ color: '#8B5CF6' }}>↳</span>{ch.content}</p>
                                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{ch.users?.nickname || '익명'} · {ch.created_at?.slice(5, 10)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>참여 의사를 댓글로 남겨보세요!</p>
                    )}
                  </div>

                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <input type="text" placeholder={user ? '참여 의사나 질문을 남겨보세요' : '로그인 후 댓글 작성'}
                      value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#D1D5DB', color: '#111', minHeight: 44 }} disabled={!user} />
                    <button onClick={handleCommentSubmit} disabled={!user || !commentText.trim()}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                      style={{ backgroundColor: user ? '#8B5CF6' : '#9CA3AF', minHeight: 44 }}>등록</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ 글쓰기 모달 — 역밤 스타일 구조화 폼 ═══ */}
      {showWrite && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          {/* 상단 바 */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={() => setShowWrite(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>조각 모집 글쓰기</h2>
            <div style={{ width: 44 }} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 max-w-2xl mx-auto w-full">

            {/* ── 기본 정보 ── */}
            <SectionHeader title="기본 정보" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>제목 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.title} onChange={(e) => setField('title', e.target.value)}
              placeholder="예: 토요일 강남 클럽 같이 가실 분"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.title ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>지역 <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {REGIONS.map(r => (
                <button key={r} type="button" onClick={() => setField('region', r)}
                  className="rounded-full px-3.5 py-1.5 text-sm transition"
                  style={{ backgroundColor: f.region === r ? '#8B5CF6' : '#F3F4F6', color: f.region === r ? '#FFF' : '#374151', minHeight: 36 }}>{r}</button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>조각 성향 <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex gap-2 mb-3">
              {JOGAK_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setField('jogakType', t)}
                  className="rounded-full px-4 py-1.5 text-sm transition"
                  style={{ backgroundColor: f.jogakType === t ? (t === '헌팅' ? '#F59E0B' : '#10B981') : '#F3F4F6', color: f.jogakType === t ? '#FFF' : '#374151', minHeight: 36 }}>{t}</button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>업소명 <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={f.venue} onChange={(e) => setField('venue', e.target.value)}
              placeholder="예: 레이스, 아르쥬, 찬스돔..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: f.venue ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* ── 날짜 & 시간 ── */}
            <SectionHeader title="날짜 & 시간" />

            <div className="flex gap-2 mb-2 flex-wrap">
              {(() => {
                const today = new Date();
                const opts: { label: string; value: string }[] = [];
                for (let i = 0; i < 7; i++) {
                  const d = new Date(today); d.setDate(today.getDate() + i);
                  const dn = ['일', '월', '화', '수', '목', '금', '토'];
                  const label = i === 0 ? '오늘' : i === 1 ? '내일' : `${d.getMonth()+1}/${d.getDate()}(${dn[d.getDay()]})`;
                  opts.push({ label, value: d.toISOString().split('T')[0] });
                }
                return opts.map(o => (
                  <button key={o.value} type="button" onClick={() => setField('date', o.value)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                    style={{ backgroundColor: f.date === o.value ? '#8B5CF6' : '#F3F4F6', color: f.date === o.value ? '#FFF' : '#555', minHeight: 32 }}>{o.label}</button>
                ));
              })()}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <input type="date" value={f.date} onChange={(e) => setField('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                style={{ borderColor: f.date ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
              <input type="time" value={f.time} onChange={(e) => setField('time', e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                style={{ borderColor: f.time ? '#8B5CF6' : '#E5E7EB', color: '#111', minHeight: 48 }}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '지금 바로'].map(t => (
                <button key={t} type="button" onClick={() => setField('time', t === '지금 바로' ? t : t)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                  style={{ backgroundColor: f.time === t ? '#8B5CF6' : '#F3F4F6', color: f.time === t ? '#FFF' : '#555', minHeight: 32 }}>{t}</button>
              ))}
            </div>

            {/* ── 모집 조건 ── */}
            <SectionHeader title="모집 조건" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>모집 인원 (본인 포함) <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['1', '2', '3', '4', '5', '6', '8', '10+'].map(n => (
                <button key={n} type="button" onClick={() => setField('maxPeople', n === '10+' ? '10' : n)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition"
                  style={{ backgroundColor: f.maxPeople === (n === '10+' ? '10' : n) ? '#8B5CF6' : '#F3F4F6', color: f.maxPeople === (n === '10+' ? '10' : n) ? '#FFF' : '#374151' }}>{n}</button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>성별 조건 <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {GENDER_OPTIONS.map(g => (
                <button key={g} type="button" onClick={() => setField('gender', g)}
                  className="rounded-full px-4 py-1.5 text-sm transition"
                  style={{ backgroundColor: f.gender === g ? '#8B5CF6' : '#F3F4F6', color: f.gender === g ? '#FFF' : '#374151', minHeight: 36 }}>{g}</button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>모집 연령대</label>
            <input value={f.ageRange} onChange={(e) => setField('ageRange', e.target.value)}
              placeholder="예: 20대후반~30대초반"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>사진 교환</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PHOTO_OPTIONS.map(p => (
                <button key={p} type="button" onClick={() => setField('photo', p)}
                  className="rounded-full px-3.5 py-1.5 text-xs transition"
                  style={{ backgroundColor: f.photo === p ? '#8B5CF6' : '#F3F4F6', color: f.photo === p ? '#FFF' : '#374151', minHeight: 32 }}>{p}</button>
              ))}
            </div>

            {/* ── 비용 정보 ── */}
            <SectionHeader title="비용 정보" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>비용 분담 방식 <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COST_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setField('cost', c)}
                  className="rounded-full px-3.5 py-1.5 text-sm transition"
                  style={{ backgroundColor: f.cost === c ? '#8B5CF6' : '#F3F4F6', color: f.cost === c ? '#FFF' : '#374151', minHeight: 36 }}>{c}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>주대 내역</label>
                <input value={f.tableCost} onChange={(e) => setField('tableCost', e.target.value)}
                  placeholder="예: 테이블비 50만원"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>1인당 예상</label>
                <input value={f.perPerson} onChange={(e) => setField('perPerson', e.target.value)}
                  placeholder="예: 약 8만원"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
            </div>

            {/* ── 담당 & 연락 ── */}
            <SectionHeader title="담당 & 연락" />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>담당 MD / 웨이터 <span className="text-[10px] font-normal" style={{ color: '#EF4444' }}>(제휴업장 필수)</span></label>
            <input value={f.mdName} onChange={(e) => setField('mdName', e.target.value)}
              placeholder="예: 장미, 비제휴..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>연락 방법 <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CONTACT_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setField('contact', c)}
                  className="rounded-full px-3.5 py-1.5 text-sm transition"
                  style={{ backgroundColor: f.contact === c ? '#8B5CF6' : '#F3F4F6', color: f.contact === c ? '#FFF' : '#374151', minHeight: 36 }}>{c}</button>
              ))}
            </div>

            {/* ── 한마디 ── */}
            <SectionHeader title="한마디" />

            <textarea value={f.message} onChange={(e) => setField('message', e.target.value)}
              placeholder="조각에게 하고 싶은 말을 자유롭게 적어주세요"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 100, lineHeight: '1.7' }} />
          </div>

          {/* 하단 버튼 */}
          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t bg-white" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={handleSubmit}
              disabled={submitting || !f.title.trim() || !f.region || !f.date || !f.time || !f.venue.trim()}
              className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#8B5CF6', color: '#FFF', minHeight: 56 }}>
              {submitting ? '등록 중...' : '조각 모집글 올리기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
