import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { fetchPosts, createPost, fetchComments, createComment, deletePost, type Post } from '@/lib/community-api';

/* ── 조각모임 규칙 ── */
const JOGAK_RULES = [
  '실제로 함께 갈 의향이 있는 경우에만 글을 작성하세요.',
  '만남 장소는 공개된 업소 앞 또는 지하철역 출구 등 안전한 곳으로 정해주세요.',
  '노쇼(약속 불이행) 시 활동 제한이 될 수 있습니다.',
  '개인 연락처 교환은 댓글이 아닌 쪽지(DM)로 해주세요.',
  '불쾌한 언행, 강요, 차별적 발언은 즉시 삭제 및 제재됩니다.',
  '미성년자는 참여할 수 없습니다 (만 19세 이상).',
];

const REGIONS = ['강남', '홍대', '이태원', '일산', '부산', '수원', '대전', '인천', '대구', '기타'];
const GENDER_OPTIONS = ['누구나', '남성만', '여성만'];
const COST_OPTIONS = ['각자 부담', 'N분의1', '글쓴이 초대'];

interface JogakPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  comments: number;
  // 구조화 필드 (content JSON에서 파싱)
  region?: string;
  venue?: string;
  meetDate?: string;
  meetTime?: string;
  maxPeople?: number;
  currentPeople?: number;
  genderPref?: string;
  ageRange?: string;
  costSplit?: string;
}

function parseJogakPost(post: Post): JogakPost {
  const u = post.users as any;
  let parsed: any = {};
  try { parsed = JSON.parse(post.content); } catch { parsed = { desc: post.content }; }

  return {
    id: post.id,
    title: post.title,
    content: parsed.desc || post.content,
    author: u?.nickname || '사용자',
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
    region: parsed.region,
    venue: parsed.venue,
    meetDate: parsed.meetDate,
    meetTime: parsed.meetTime,
    maxPeople: parsed.maxPeople,
    currentPeople: parsed.currentPeople || 1,
    genderPref: parsed.genderPref,
    ageRange: parsed.ageRange,
    costSplit: parsed.costSplit,
  };
}

export default function JogakPage() {
  useDocumentMeta('같이 놀러갈 사람 구하는 조각 모집', '혼자 가기 심심할 때, 같이 갈 사람을 구해보세요. 조각모임 게시판.');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<JogakPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // 글 상세
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ author: string; text: string; date: string }[]>([]);
  const [commentText, setCommentText] = useState('');

  // 글쓰기 모달
  const [showWrite, setShowWrite] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 구조화 폼 필드
  const [formTitle, setFormTitle] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formMaxPeople, setFormMaxPeople] = useState('4');
  const [formGender, setFormGender] = useState('누구나');
  const [formAgeRange, setFormAgeRange] = useState('');
  const [formCost, setFormCost] = useState('각자 부담');
  const [formDesc, setFormDesc] = useState('');

  // DB에서 글 불러오기
  useEffect(() => {
    (async () => {
      const { data } = await fetchPosts('party', 30);
      setPosts(data.map(parseJogakPost));
      setLoading(false);
    })();
  }, []);

  // 글 클릭
  const handlePostClick = (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); return; }
    setSelectedPost(postId);
    setCommentText('');
    setComments([]);
    fetchComments(postId).then(data => {
      if (data.length > 0) {
        setComments(data.map(c => ({
          author: c.users?.nickname || '익명',
          text: c.content,
          date: c.created_at.slice(5, 10),
        })));
      }
    });
  };

  // 글쓰기
  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWrite(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formRegion) return;
    setSubmitting(true);

    // content를 JSON으로 저장 (구조화 데이터)
    const contentJson = JSON.stringify({
      region: formRegion,
      venue: formVenue.trim(),
      meetDate: formDate,
      meetTime: formTime,
      maxPeople: Number(formMaxPeople) || 4,
      currentPeople: 1,
      genderPref: formGender,
      ageRange: formAgeRange.trim(),
      costSplit: formCost,
      desc: formDesc.trim(),
    });

    const result = await createPost({
      category: 'party',
      title: formTitle.trim(),
      content: contentJson,
    });

    if (result.error) {
      alert('저장 실패: ' + result.error);
    } else {
      alert('조각 모집글이 올라갔습니다!');
      setShowWrite(false);
      // 폼 초기화
      setFormTitle(''); setFormRegion(''); setFormVenue(''); setFormDate(''); setFormTime('');
      setFormMaxPeople('4'); setFormGender('누구나'); setFormAgeRange(''); setFormCost('각자 부담'); setFormDesc('');
      // 새로고침
      const { data } = await fetchPosts('party', 30);
      setPosts(data.map(parseJogakPost));
    }
    setSubmitting(false);
  };

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    const { data, error } = await createComment(selectedPost, commentText.trim());
    if (data) {
      setComments(prev => [...prev, { author: user.user_metadata?.nickname || user.user_metadata?.name || '나', text: commentText.trim(), date: new Date().toISOString().slice(5, 10) }]);
      setCommentText('');
    }
    if (error) alert(error);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-16">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm" style={{ color: '#999' }}>← 커뮤니티</Link>
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>🧩 조각 모집</h1>
          <p className="mt-2 text-sm" style={{ color: '#555' }}>같이 놀러갈 사람을 구하는 게시판</p>
        </div>
        <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-medium text-white min-h-[44px]"
          style={{ backgroundColor: '#8B5CF6' }}>
          모집 글쓰기
        </button>
      </div>

      {/* 규칙 토글 */}
      <div className="mb-6 rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <button onClick={() => setShowRules(!showRules)}
          className="flex w-full items-center justify-between px-4 py-3 text-left" style={{ backgroundColor: '#F3F0FF' }}>
          <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>📋 조각모임 규칙</span>
          <span className="text-xs" style={{ color: '#8B5CF6' }}>{showRules ? '접기' : '펼치기'}</span>
        </button>
        {showRules && (
          <div className="px-4 py-3 space-y-2" style={{ backgroundColor: '#FAFAFA' }}>
            {JOGAK_RULES.map((rule, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: '#555' }}>
                {i + 1}. {rule}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 글 목록 */}
      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: '#9CA3AF' }}>불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-lg mb-2" style={{ color: '#111' }}>아직 모집글이 없습니다</p>
          <p className="text-sm" style={{ color: '#999' }}>첫 번째 조각 모집을 시작해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              {/* 글 카드 */}
              <div onClick={() => handlePostClick(post.id)}
                className="cursor-pointer px-5 py-4 transition hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold" style={{ color: '#111' }}>{post.title}</h3>
                  {post.comments > 0 && <span className="text-xs ml-2 shrink-0" style={{ color: '#8B5CF6' }}>[{post.comments}]</span>}
                </div>

                {/* 구조화 정보 태그 */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {post.region && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>📍 {post.region}</span>}
                  {post.venue && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>🏢 {post.venue}</span>}
                  {post.meetDate && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>📅 {post.meetDate} {post.meetTime}</span>}
                  {post.maxPeople && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>👥 {post.currentPeople}/{post.maxPeople}명</span>}
                  {post.genderPref && post.genderPref !== '누구나' && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#FCE7F3', color: '#9D174D' }}>{post.genderPref}</span>}
                  {post.costSplit && <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>💰 {post.costSplit}</span>}
                </div>

                <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>

              {/* 글 상세 + 댓글 */}
              {selectedPost === post.id && (
                <div className="px-5 pb-5 pt-2" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
                  {/* 본문 설명 */}
                  {post.content && (
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  )}

                  {/* 삭제 버튼 */}
                  {user && (
                    <button onClick={async () => {
                      if (!confirm('글을 삭제하시겠습니까?')) return;
                      const result = await deletePost(post.id);
                      if (result.error) { alert('삭제 실패: ' + result.error); return; }
                      alert('삭제되었습니다');
                      setSelectedPost(null);
                      setPosts(prev => prev.filter(p => p.id !== post.id));
                    }} className="text-xs mb-3" style={{ color: '#EF4444', minHeight: 32 }}>
                      글 삭제
                    </button>
                  )}

                  {/* 댓글 */}
                  <div className="border-t pt-3 mb-3" style={{ borderColor: '#E5E7EB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>댓글 {comments.length}개</p>
                    {comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.map((c, ci) => (
                          <div key={ci} className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                            <p className="text-sm" style={{ color: '#111' }}>{c.text}</p>
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>{c.author} · {c.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>아직 댓글이 없어요. 참여 의사를 댓글로 남겨보세요!</p>
                    )}
                  </div>

                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <input type="text" placeholder={user ? '참여 의사나 질문을 남겨보세요' : '로그인 후 댓글 작성'}
                      value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px]"
                      style={{ borderColor: '#D1D5DB', color: '#111' }} disabled={!user} />
                    <button onClick={handleCommentSubmit} disabled={!user || !commentText.trim()}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white min-h-[44px]"
                      style={{ backgroundColor: user ? '#8B5CF6' : '#9CA3AF' }}>등록</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 글쓰기 모달 — 구조화 폼 */}
      {showWrite && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={() => setShowWrite(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>🧩 조각 모집 글쓰기</h2>
            <div style={{ width: 44 }} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 max-w-2xl mx-auto w-full">
            {/* 제목 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>제목 *</label>
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 토요일 강남 클럽 같이 가실 분"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-4 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* 지역 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>어디? (지역) *</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setFormRegion(r)}
                  className="rounded-full px-3.5 py-1.5 text-sm transition"
                  style={{
                    backgroundColor: formRegion === r ? '#8B5CF6' : '#F3F4F6',
                    color: formRegion === r ? '#FFFFFF' : '#374151',
                    minHeight: 36,
                  }}>{r}</button>
              ))}
            </div>

            {/* 업소명 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>업소명 (선택)</label>
            <input value={formVenue} onChange={(e) => setFormVenue(e.target.value)}
              placeholder="예: 레이스, 아르쥬, 버뮤다..."
              className="w-full rounded-lg border px-4 py-3 text-sm mb-4 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* 날짜 + 시간 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>날짜</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>시간</label>
                <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)}
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
            </div>

            {/* 모집 인원 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>모집 인원 (본인 포함)</label>
            <div className="flex items-center gap-3 mb-4">
              {['2', '3', '4', '6', '8', '10'].map(n => (
                <button key={n} onClick={() => setFormMaxPeople(n)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition"
                  style={{
                    backgroundColor: formMaxPeople === n ? '#8B5CF6' : '#F3F4F6',
                    color: formMaxPeople === n ? '#FFFFFF' : '#374151',
                  }}>{n}</button>
              ))}
            </div>

            {/* 성별 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>성별 조건</label>
            <div className="flex gap-2 mb-4">
              {GENDER_OPTIONS.map(g => (
                <button key={g} onClick={() => setFormGender(g)}
                  className="rounded-full px-4 py-1.5 text-sm transition"
                  style={{
                    backgroundColor: formGender === g ? '#8B5CF6' : '#F3F4F6',
                    color: formGender === g ? '#FFFFFF' : '#374151',
                    minHeight: 36,
                  }}>{g}</button>
              ))}
            </div>

            {/* 나이 범위 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>나이 범위 (선택)</label>
            <input value={formAgeRange} onChange={(e) => setFormAgeRange(e.target.value)}
              placeholder="예: 25~35세"
              className="w-full rounded-lg border px-4 py-3 text-sm mb-4 outline-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />

            {/* 비용 분담 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>비용 분담</label>
            <div className="flex gap-2 mb-4">
              {COST_OPTIONS.map(c => (
                <button key={c} onClick={() => setFormCost(c)}
                  className="rounded-full px-4 py-1.5 text-sm transition"
                  style={{
                    backgroundColor: formCost === c ? '#8B5CF6' : '#F3F4F6',
                    color: formCost === c ? '#FFFFFF' : '#374151',
                    minHeight: 36,
                  }}>{c}</button>
              ))}
            </div>

            {/* 추가 설명 */}
            <label className="mb-1 block text-xs font-bold" style={{ color: '#555' }}>추가 설명</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              placeholder="함께 가고 싶은 이유, 분위기, 원하는 조건 등 자유롭게 적어주세요"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 120, lineHeight: '1.7' }} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <button onClick={handleSubmit}
              disabled={submitting || !formTitle.trim() || !formRegion}
              className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
              {submitting ? '등록 중...' : '모집글 올리기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
