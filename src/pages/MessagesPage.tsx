import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from '../components/ui/SafeLink';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import {
  fetchReceivedMessages,
  fetchSentMessages,
  fetchConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  type Message,
} from '@/lib/message-api';

/* ══════════════════════════════════════════════
   쪽지함 페이지 — 받은쪽지 / 보낸쪽지 / 대화
   ══════════════════════════════════════════════ */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg className="h-16 w-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ── 대화 뷰 ── */
function ConversationView({
  otherUserId,
  otherNickname,
  onBack,
  currentUserId,
}: {
  otherUserId: string;
  otherNickname: string;
  onBack: () => void;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const msgs = await fetchConversation(otherUserId);
    setMessages(msgs);
    // 읽음 처리
    msgs.forEach((m) => {
      if (m.receiver_id === currentUserId && !m.read_at) {
        markAsRead(m.id);
      }
    });
  }, [otherUserId, currentUserId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(otherUserId, text);
    if (!result.error) {
      setText('');
      await load();
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-bold text-gray-900">{otherNickname}</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && <EmptyState text="대화를 시작해보세요" />}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#8B5CF6] text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                  {timeAgo(msg.created_at)}
                  {isMine && msg.read_at && ' · 읽음'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
          placeholder="쪽지를 입력하세요..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30"
          maxLength={1000}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="rounded-full bg-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#7C3AED] transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  );
}

/* ── 쪽지 목록 아이템 ── */
function MessageItem({
  msg,
  type,
  onClick,
}: {
  msg: Message;
  type: 'received' | 'sent';
  onClick: () => void;
}) {
  const other = type === 'received' ? msg.sender : msg.receiver;
  const nickname = other?.nickname || '알 수 없음';
  const isUnread = type === 'received' && !msg.read_at;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
    >
      {/* 아바타 */}
      <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-sm font-bold">
        {nickname.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
            {nickname}
          </span>
          <span className="text-[11px] text-gray-400 shrink-0 ml-2">{timeAgo(msg.created_at)}</span>
        </div>
        <p className={`text-sm mt-0.5 truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {msg.content}
        </p>
      </div>
      {isUnread && (
        <div className="shrink-0 mt-2 h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
      )}
    </button>
  );
}

/* ── 메인 ── */
export default function MessagesPage() {
  useDocumentMeta('쪽지함 — 조각모임·벙개 멤버와 1:1 대화', '조각모임·벙개 멤버와 1:1로 대화하세요. 받은 쪽지·보낸 쪽지 분리 관리, 익명 닉네임 보호, 신고·차단 기능 제공. 매칭된 사람과 약속 잡기 빠르게.');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'received' | 'sent'>(
    (searchParams.get('tab') as 'received' | 'sent') || 'received'
  );
  const [received, setReceived] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 대화 뷰 상태
  const [convoUser, setConvoUser] = useState<{ id: string; nickname: string } | null>(null);

  // URL에서 to= 파라미터 처리 (쪽지 보내기 링크)
  useEffect(() => {
    const toId = searchParams.get('to');
    const toName = searchParams.get('name');
    if (toId) {
      setConvoUser({ id: toId, nickname: toName || '사용자' });
    }
  }, [searchParams]);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [r, s, u] = await Promise.all([
      fetchReceivedMessages(),
      fetchSentMessages(),
      getUnreadCount(),
    ]);
    setReceived(r);
    setSent(s);
    setUnreadCount(u);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 30초마다 새 쪽지 확인
  useEffect(() => {
    if (!user) return;
    const t = setInterval(loadMessages, 30_000);
    return () => clearInterval(t);
  }, [user, loadMessages]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
        <p className="text-sm text-gray-500 mb-6">쪽지를 보내고 받으려면 로그인해주세요.</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-3 text-sm font-bold text-white hover:bg-[#7C3AED] transition-colors"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  // 대화 뷰
  if (convoUser) {
    return (
      <div className="max-w-lg mx-auto" style={{ height: 'calc(100vh - 120px)' }}>
        <ConversationView
          otherUserId={convoUser.id}
          otherNickname={convoUser.nickname}
          currentUserId={user.id}
          onBack={() => {
            setConvoUser(null);
            setSearchParams({});
            loadMessages();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* 타이틀 */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">쪽지함</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-1">
        {(['received', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearchParams({ tab: t }); }}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
              tab === t ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'received' ? '받은 쪽지' : '보낸 쪽지'}
            {t === 'received' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {tab === t && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tab === 'received' ? (
            received.length === 0 ? (
              <EmptyState text="받은 쪽지가 없습니다" />
            ) : (
              received.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  type="received"
                  onClick={() =>
                    setConvoUser({
                      id: msg.sender_id,
                      nickname: msg.sender?.nickname || '알 수 없음',
                    })
                  }
                />
              ))
            )
          ) : sent.length === 0 ? (
            <EmptyState text="보낸 쪽지가 없습니다" />
          ) : (
            sent.map((msg) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                type="sent"
                onClick={() =>
                  setConvoUser({
                    id: msg.receiver_id,
                    nickname: msg.receiver?.nickname || '알 수 없음',
                  })
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
