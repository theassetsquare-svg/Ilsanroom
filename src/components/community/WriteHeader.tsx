import { Link } from '../ui/SafeLink';

const NAV_ITEMS = [
  { label: '홈', to: '/' },
  { label: '커뮤니티', to: '/community' },
  { label: '랭킹', to: '/ranking' },
  { label: '조각모임', to: '/community/jogak' },
  { label: '매거진', to: '/magazine' },
];

interface WriteHeaderProps {
  onCancel: () => void;
  title?: string;
}

export default function WriteHeader({ onCancel, title = '글쓰기' }: WriteHeaderProps) {
  return (
    <div style={{ borderColor: '#E5E7EB' }}>
      {/* 상단 네비게이션 바 — 네이버 스타일 */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b overflow-x-auto scrollbar-hide" style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', WebkitOverflowScrolling: 'touch' as any }}>
        <Link to="/" className="flex items-center gap-1 mr-2 flex-shrink-0" style={{ minHeight: 44 }}>
          <span className="text-base" style={{ fontWeight: 300, color: '#8B5CF6', letterSpacing: '0.05em' }}>놀쿨</span>
        </Link>
        <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
        {NAV_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100"
            style={{ color: '#555', minHeight: 28, whiteSpace: 'nowrap' }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {/* 글쓰기 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
        <button onClick={onCancel} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
        <h2 className="text-base font-bold" style={{ color: '#111' }}>{title}</h2>
        <div style={{ width: 44 }} />
      </div>
    </div>
  );
}
