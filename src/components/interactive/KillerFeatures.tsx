'use client';

import { useState, useEffect } from 'react';
import { venues } from '@/data/venues';
import ShareButtons from './ShareButtons';

/* ═══ [F] 지금 이 시간 핫한 곳 ═══ */
export function HotRightNow() {
  const [hour, setHour] = useState(22);
  useEffect(() => { setHour(new Date().getHours()); }, []);

  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');
  const shuffled = [...openVenues].sort(() => Math.random() - 0.5);
  const top3 = shuffled.slice(0, 3);
  const timeLabel = hour >= 22 || hour < 4 ? '심야 핫플' : hour >= 18 ? '저녁 추천' : '오후 추천';

  return (
    <div className="rounded-2xl border border-neon-pink/30 bg-neon-surface p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-neon-pink animate-pulse" />
        <h3 className="text-lg font-bold text-neon-text">지금 이 시간 — {timeLabel}</h3>
        <span className="text-xs text-neon-text-muted">{hour}시 기준</span>
      </div>
      <div className="space-y-3">
        {top3.map((v, i) => (
          <a key={v.id} href={`/${v.category === 'club' ? 'clubs' : v.category === 'night' ? 'nights' : v.category === 'room' ? 'rooms' : v.category === 'yojeong' ? 'yojeong' : v.category === 'lounge' ? 'lounges' : 'hoppa'}/${v.category === 'club' || v.category === 'room' || v.category === 'yojeong' ? v.region + '/' : ''}${v.slug}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-bg p-3 transition hover:border-neon-pink/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-pink/20 text-sm font-bold text-neon-pink">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
              <p className="text-xs text-neon-text-muted">{v.regionKo}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ═══ [O] 출석 도장 ═══ */
export function AttendanceCheck() {
  const [streak, setStreak] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('attendance_last');
    const s = parseInt(localStorage.getItem('attendance_streak') || '0');
    setStreak(s);
    if (lastCheck === today) setChecked(true);
  }, []);

  const handleCheck = () => {
    if (checked) return;
    const today = new Date().toDateString();
    const newStreak = streak + 1;
    localStorage.setItem('attendance_last', today);
    localStorage.setItem('attendance_streak', String(newStreak));
    setStreak(newStreak);
    setChecked(true);
  };

  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-6 text-center">
      <h3 className="text-lg font-bold text-neon-text mb-2">출석 도장</h3>
      <p className="text-sm text-neon-text-muted mb-4">매일 접속하면 보상! 7일 연속=쿠폰, 30일=VIP뱃지</p>
      <div className="flex justify-center gap-1 mb-4">
        {[1,2,3,4,5,6,7].map((d) => (
          <div key={d} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${streak >= d ? 'bg-neon-gold text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}>
            {streak >= d ? '✓' : d}
          </div>
        ))}
      </div>
      <p className="text-2xl font-bold text-neon-gold mb-3">{streak}일 연속</p>
      <button onClick={handleCheck} disabled={checked}
        className={`rounded-xl px-8 py-3 font-bold transition ${checked ? 'bg-neon-surface-2 text-neon-text-muted' : 'bg-neon-gold text-white hover:bg-neon-gold/90 btn-glow'}`}>
        {checked ? '오늘 출석 완료!' : '출석 체크'}
      </button>
    </div>
  );
}

/* ═══ [S] 술값 계산기 ═══ */
export function DrinkBudgetCalc() {
  const [people, setPeople] = useState('');
  const [drink, setDrink] = useState('양주');
  const [rounds, setRounds] = useState('1');

  const prices: Record<string, number> = { '양주': 200000, '맥주': 50000, '소주': 30000, '칵테일': 80000, '와인': 150000 };
  const total = people && rounds ? Number(people) * prices[drink] * Number(rounds) : 0;
  const perPerson = total && people ? Math.ceil(total / Number(people)) : 0;

  return (
    <div className="rounded-2xl border border-neon-accent/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-4">술값 계산기</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">인원</label>
          <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="4"
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent" />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">주종</label>
          <select value={drink} onChange={(e) => setDrink(e.target.value)}
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none">
            {Object.keys(prices).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">차수</label>
          <select value={rounds} onChange={(e) => setRounds(e.target.value)}
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none">
            <option value="1">1차만</option><option value="2">2차까지</option><option value="3">3차까지</option>
          </select>
        </div>
      </div>
      {total > 0 && (
        <div className="rounded-xl bg-neon-accent/10 p-4 text-center">
          <p className="text-sm text-neon-text-muted">예상 총 비용</p>
          <p className="text-3xl font-bold text-neon-accent">{total.toLocaleString()}원</p>
          <p className="text-sm text-neon-text-muted mt-1">1인당 {perPerson.toLocaleString()}원</p>
        </div>
      )}
      <p className="mt-3 text-[10px] text-neon-text-muted/60">※ 참고용 예상 금액입니다. 실제 비용은 업소마다 다릅니다.</p>
    </div>
  );
}

/* ═══ [T] 대리운전 원클릭 ═══ */
export function QuickDriverCall() {
  return (
    <div className="rounded-2xl border border-neon-green/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-2">대리운전 원클릭</h3>
      <p className="text-sm text-neon-text-muted mb-4">놀고 나서 안전하게 귀가하세요</p>
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:1577-4080" className="flex items-center justify-center gap-2 rounded-xl bg-neon-green/20 py-3 text-sm font-bold text-neon-green transition hover:bg-neon-green/30" style={{minHeight:'44px'}}>
          카카오T 대리 1577-4080
        </a>
        <a href="tel:1588-5765" className="flex items-center justify-center gap-2 rounded-xl bg-neon-accent/20 py-3 text-sm font-bold text-neon-accent transition hover:bg-neon-accent/30" style={{minHeight:'44px'}}>
          로지 대리 1588-5765
        </a>
      </div>
    </div>
  );
}

/* ═══ [AG] 해장 맛집 연동 ═══ */
export function HangoverFood() {
  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-2">해장 맛집 찾기</h3>
      <p className="text-sm text-neon-text-muted mb-4">놀고 나서 해장은 필수!</p>
      <a href="https://map.kakao.com/?q=해장국" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-neutral-900 transition hover:bg-[#FDD700]" style={{minHeight:'44px'}}>
        카카오맵에서 내 주변 해장국집 찾기
      </a>
    </div>
  );
}

/* ═══ [AK] 친구 초대 바이럴 ═══ */
export function InviteFriend() {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== 'undefined' ? window.location.origin + '?ref=friend' : 'https://ilsanroom.pages.dev?ref=friend';

  const copy = async () => {
    try { await navigator.clipboard.writeText(`오늘밤어디 — 전국 나이트/클럽/호빠 정보 ${link}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="rounded-2xl border border-neon-primary/30 bg-gradient-to-r from-neon-primary/5 via-neon-surface to-neon-accent/5 p-6 text-center">
      <h3 className="text-lg font-bold text-neon-text mb-2">친구 초대하면 둘 다 VIP!</h3>
      <p className="text-sm text-neon-text-muted mb-4">카톡으로 링크 공유 → 친구 가입 → 나도 친구도 VIP 1주일</p>
      <button onClick={copy} className="rounded-xl bg-neon-primary px-6 py-3 font-bold text-white transition hover:bg-neon-primary-light btn-glow">
        {copied ? '링크 복사됨!' : '초대 링크 복사'}
      </button>
    </div>
  );
}
