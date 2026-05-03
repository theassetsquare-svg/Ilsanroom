import { useStealthMode } from '@/hooks/useStealthMode';

/* Stealth 모드 토글 — 헤더/메뉴에 노출
   ON 시 탭 제목 "📚 메모" + favicon 책 이모지로 위장.
   유흥 사용자가 폰 잠깐 빌려줄 때 30초면 켜기/끄기 가능. */

export default function StealthToggle({ compact = false }: { compact?: boolean }) {
  const { on, toggle } = useStealthMode();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        title={on ? 'Stealth 모드 ON — 탭 제목 위장 중' : 'Stealth 모드 OFF'}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
          on
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
        }`}
      >
        <span>{on ? '🥷' : '👁️'}</span>
        <span>Stealth {on ? 'ON' : 'OFF'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
        on
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-neutral-200 bg-white hover:border-neutral-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{on ? '🥷' : '👁️'}</span>
        <div className="text-left">
          <div className="text-sm font-bold text-[#111]">Stealth 모드</div>
          <div className="text-[11px] text-[#666]">
            {on ? '탭 제목 "📚 메모"로 위장 중' : '폰 빌려줄 때 한 번 토글'}
          </div>
        </div>
      </div>
      <div className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </div>
    </button>
  );
}
