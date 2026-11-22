/**
 * 놀쿨 광고주 진열장 — [놀쿨86-1 · 대표님 2026-11-22 18:26]
 *   「놀쿨 홈화면에 있는 광고문의 썸네일이미지 보이지 않게 하고 광고주 썸네일이미지만 보이게 …
 *    놀쿨홈화면 보자마자 놀쿨은 사람들이 많이 이용하는구나 하고 보자마자 광고문의하게 만들라고」
 * - 그림 = 광고주 넉 줄 카드만(광고문의 석 줄 카드 0) · 자료는 src/lib/home-ad-cards.mjs 한 자리.
 * - 이름 · 곳 수 = 실제 광고주 자료 그대로(가짜 0) · 번호 · 닉네임 글자는 이 부품에 0(카드 그림 안에만).
 * - 카카오톡은 바깥 연결 0(놀쿨 규칙: 외부 링크 0) — 아이디 복사 단추만 · 알림창(alert) 0.
 */
import { useState } from 'react';
import { Link } from '../ui/SafeLink';
import { CAT_KO, homeAdCardsToday } from '@/lib/home-ad-cards';

const KAKAO_ID = 'besta12';

export default function HomeAdShowcase() {
  const cards = homeAdCardsToday();
  const [copy, setCopy] = useState<'idle' | 'done' | 'fail'>('idle');
  if (cards.length === 0) return null;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(KAKAO_ID);
      setCopy('done');
    } catch {
      setCopy('fail');
    }
  };

  return (
    <section aria-labelledby="home-ad-showcase-title" className="px-4 pt-4 pb-2 max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <h2 id="home-ad-showcase-title" className="text-[17px] font-black text-neon-text">
          놀쿨 광고주 <span className="text-neon-primary">{cards.length}</span>곳
        </h2>
        <p className="text-[11px] text-neon-text-subtle">앞자리는 날마다 한 칸씩 돌아갑니다</p>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {cards.map((c, i) => (
          <li key={c.slug}>
            <Link
              to={c.href}
              className="block overflow-hidden rounded-xl border border-neon-border bg-neon-surface transition-opacity active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-primary"
            >
              <img
                src={c.img}
                alt={`${c.shop} 안내 카드`}
                width={300}
                height={300}
                loading={i < 6 ? 'eager' : 'lazy'}
                decoding="async"
                className="block aspect-square w-full bg-neon-text object-cover"
              />
              <span className="block px-2 pb-2 pt-1.5">
                <span className="block truncate text-[12px] font-bold text-neon-text">{c.shop}</span>
                <span className="block truncate text-[11px] text-neon-text-subtle">
                  {c.regionKo} · {CAT_KO[c.cat]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-neon-border bg-neon-surface px-4 py-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-neon-text">사장님 가게도 이 자리에 올릴 수 있습니다</p>
          <p className="mt-0.5 text-[12px] text-neon-text-muted">홈 진열장에 더해 가게 쪽 맨 위 카드와 전화 단추가 같이 들어갑니다</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[13px] font-bold text-neon-text">광고문의 카카오톡 {KAKAO_ID}</span>
          <button
            type="button"
            onClick={copyId}
            className="rounded-lg bg-neon-primary px-3 text-[13px] font-bold text-white transition-opacity active:opacity-80 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-text"
            style={{ minHeight: 44 }}
            aria-describedby="home-ad-copy-state"
          >
            {copy === 'done' ? '복사됨' : '아이디 복사'}
          </button>
        </div>
      </div>
      <p id="home-ad-copy-state" role="status" className="mt-1 min-h-[1em] text-[11px] text-neon-text-subtle">
        {copy === 'done' ? `카카오톡 친구 찾기에 ${KAKAO_ID} 를 붙여 넣으세요` : copy === 'fail' ? `복사가 막힌 브라우저입니다 · 카카오톡에서 ${KAKAO_ID} 를 찾아 주세요` : ''}
      </p>
    </section>
  );
}
