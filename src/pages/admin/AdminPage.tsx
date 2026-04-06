import { useState, useEffect } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { Link } from 'react-router-dom';

// ★ 관리자 이메일 — 이 이메일로 로그인한 사람만 접근 가능
const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com'];

export default function AdminPage() {
  useDocumentMeta('관리자 페이지', '놀쿨 사이트 관리');
  const { user } = useAuth();
  const supabase = createClient();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'advertisers'>('posts');

  // 관리자 체크
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // 글 목록 불러오기
  useEffect(() => {
    if (!supabase || !isAdmin) return;
    supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [isAdmin]);

  // 글 삭제
  const deletePost = async (id: string) => {
    if (!confirm('이 글을 삭제하시겠습니까?')) return;
    if (!supabase) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    alert('삭제되었습니다');
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>로그인이 필요합니다</p>
        <Link to="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>로그인</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold mb-2" style={{ color: '#111' }}>접근 권한이 없습니다</p>
        <p className="text-sm mb-4" style={{ color: '#555' }}>관리자만 접근할 수 있는 페이지입니다.</p>
        <Link to="/" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>홈으로</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#111' }}>🔧 관리자 페이지</h1>
      <p className="text-sm mb-6" style={{ color: '#555' }}>로그인: {user.email}</p>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        {[
          { key: 'posts' as const, label: '📝 글 관리' },
          { key: 'events' as const, label: '🎉 이벤트 관리' },
          { key: 'advertisers' as const, label: '📢 광고주 관리' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-3 text-sm font-medium border-b-2 transition"
            style={{
              borderColor: activeTab === tab.key ? '#8B5CF6' : 'transparent',
              color: activeTab === tab.key ? '#8B5CF6' : '#555',
              minHeight: 44,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 글 관리 */}
      {activeTab === 'posts' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>전체 글 목록 ({posts.length}개)</h2>
          {loading ? (
            <p style={{ color: '#999' }}>불러오는 중...</p>
          ) : posts.length === 0 ? (
            <p style={{ color: '#999' }}>글이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {posts.map(post => (
                <div key={post.id} className="flex items-center justify-between rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{post.title}</p>
                    <p className="text-xs" style={{ color: '#999' }}>{post.category} · {post.created_at?.slice(0, 10)} · {post.user_id?.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => deletePost(post.id)} className="shrink-0 ml-3 text-xs font-medium" style={{ color: '#EF4444', minHeight: 32 }}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 이벤트 관리 */}
      {activeTab === 'events' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>이벤트 관리</h2>
          <div className="rounded-2xl border p-6 mb-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              이벤트는 <strong>관리자가 승인한 광고주만</strong> 등록할 수 있습니다.<br /><br />
              광고주가 이벤트를 등록하려면:<br />
              1. 카카오톡 <strong>besta12</strong>로 이벤트 내용 전달<br />
              2. 관리자 검토 후 승인<br />
              3. 이벤트 페이지에 게시<br /><br />
              현재 이벤트는 관리자가 직접 코드에서 관리합니다.<br />
              추후 광고주 전용 이벤트 등록 페이지를 오픈 예정입니다.
            </p>
          </div>
          <Link to="/events" className="inline-block rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
            이벤트 페이지 보기 →
          </Link>
        </div>
      )}

      {/* 광고주 관리 */}
      {activeTab === 'advertisers' && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>광고주 관리</h2>
          <div className="rounded-2xl border p-6 mb-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              광고주별 권한을 설정할 수 있습니다.<br /><br />
              <strong>광고주 권한 종류:</strong><br />
              • 업소 정보 수정 — 자기 업소 사진/설명/연락처 변경<br />
              • 이벤트 등록 — 승인 후 이벤트 페이지에 게시<br />
              • 프로모션 배너 — 홈 배너에 업소 홍보<br /><br />
              광고주 등록/관리는 카카오톡 <strong>besta12</strong>로 문의해주세요.
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-sm font-bold mb-2" style={{ color: '#111' }}>등록된 광고주</p>
            <p className="text-xs" style={{ color: '#999' }}>아직 등록된 광고주가 없습니다. 카톡 besta12로 문의해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
