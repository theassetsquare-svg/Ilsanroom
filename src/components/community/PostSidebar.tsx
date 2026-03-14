import type { Post } from '@/lib/community-types';

interface PostSidebarProps {
  currentPost: Post;
  relatedPosts: Post[];
}

export default function PostSidebar({ currentPost, relatedPosts }: PostSidebarProps) {
  const boardLabels: Record<string, string> = {
    free: '자유게시판', reviews: '후기', party: '파티모집',
    tips: '팁', fashion: '패션', qna: 'Q&A',
  };

  return (
    <aside className="space-y-6">
      {/* Read Time */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>읽기 시간: <strong className="text-neon-text">{currentPost.readTimeMin}분</strong></span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
          <span>조회 {currentPost.views.toLocaleString()}</span>
          <span>좋아요 {currentPost.likes}</span>
          <span>댓글 {currentPost.commentCount}</span>
        </div>
      </div>

      {/* Hashtags */}
      {currentPost.hashtags.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-neon-text">해시태그</h3>
          <div className="flex flex-wrap gap-2">
            {currentPost.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-neon-text">관련 글</h3>
          <div className="space-y-3">
            {relatedPosts.map((post) => (
              <div key={post.id} className="group">
                <p className="text-sm text-neutral-300 line-clamp-2 transition group-hover:text-violet-400">
                  {post.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-600">
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5">{boardLabels[post.board]}</span>
                  <span>♥ {post.likes}</span>
                  <span>{post.readTimeMin}분</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Author Info */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-neon-text">작성자</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-400">
            {currentPost.author.nickname.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-neon-text">{currentPost.author.nickname}</p>
            <p className="text-xs text-neutral-500">{currentPost.author.level} · XP {currentPost.author.xp}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
