

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import ShareButtons from './ShareButtons';

/* ═══ [F] 지금 이 시간 추천 (날짜·시간 기반 결정적 선정) ═══ */
export function HotRightNow() {
  const [hour, setHour] = useState(22);
  const [bucket, setBucket] = useState(0);
  useEffect(() => {
    const d = new Date();
    setHour(d.getHours());
    // 24h 자동 갱신: 날짜 + 시간/4 단위로 버킷 변경
    setBucket(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + Math.floor(d.getHours() / 4));
  }, []);

  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');
  // 결정적 회전: bucket 기반 인덱스 시작점 + 3칸 슬라이스 (랜덤 X)
  const start = openVenues.length > 0 ? bucket % openVenues.length : 0;
  const top3 = [
    openVenues[start % openVenues.length],
    openVenues[(start + 1) % openVenues.length],
    openVenues[(start + 2) % openVenues.length],
  ].filter(Boolean);
  const timeLabel = hour >= 22 || hour < 4 ? '심야 추천' : hour >= 18 ? '저녁 추천' : '오후 추천';

  return (
    <div className="rounded-2xl border border-neon-pink/30 bg-neon-surface p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-neon-pink animate-pulse" />
        <h3 className="text-lg font-bold text-neon-text">지금 이 시간 — {timeLabel}</h3>
        <span className="text-xs text-neon-text-muted">{hour}시 기준</span>
      </div>
      <div className="space-y-3">
        {top3.map((v, i) => (
          <Link key={v.id} to={`/${v.category === 'club' ? 'clubs' : v.category === 'night' ? 'nights' : v.category === 'room' ? 'rooms' : v.category === 'yojeong' ? 'yojeong' : v.category === 'lounge' ? 'lounges' : 'hoppa'}/${v.category === 'club' || v.category === 'room' || v.category === 'yojeong' ? v.region + '/' : ''}${v.slug}`}
            className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-bg p-3 transition hover:border-neon-pink/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-pink/20 text-sm font-bold text-neon-pink">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
              <p className="text-xs text-neon-text-muted">{v.regionKo}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══ [O] 출석 도장 + 뱃지 보상 ═══ */
const BADGES = [
  { days: 3, label: '루키', icon: '🌱', color: 'text-green-400' },
  { days: 7, label: 'VIP', icon: '👑', color: 'text-neon-gold' },
  { days: 14, label: '단골', icon: '🔥', color: 'text-orange-400' },
  { days: 30, label: '전설', icon: '💎', color: 'text-purple-400' },
];

export function getEarnedBadges(): { label: string; icon: string; color: string }[] {
  const streak = parseInt(localStorage.getItem('attendance_streak') || '0');
  return BADGES.filter(b => streak >= b.days);
}

export function AttendanceCheck() {
  const [streak, setStreak] = useState(0);
  const [checked, setChecked] = useState(false);
  const [justEarned, setJustEarned] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('attendance_last');
    const s = parseInt(localStorage.getItem('attendance_streak') || '0');
    // 어제가 아니면 streak 리셋 (연속 출석 체크)
    if (lastCheck) {
      const lastDate = new Date(lastCheck);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / 86400000);
      if (diff > 1) {
        localStorage.setItem('attendance_streak', '0');
        setStreak(0);
      } else {
        setStreak(s);
      }
    } else {
      setStreak(s);
    }
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

    // 뱃지 획득 체크
    const newBadge = BADGES.find(b => b.days === newStreak);
    if (newBadge) {
      setJustEarned(newBadge.label);
      localStorage.setItem('nolcool_badges', JSON.stringify(BADGES.filter(b => newStreak >= b.days).map(b => b.label)));
      setTimeout(() => setJustEarned(null), 3000);
    }
  };

  const earned = BADGES.filter(b => streak >= b.days);
  const nextBadge = BADGES.find(b => streak < b.days);

  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-6 text-center">
      <h3 className="text-lg font-bold text-neon-text mb-2">출석 도장</h3>
      {earned.length > 0 && (
        <div className="flex justify-center gap-2 mb-3">
          {earned.map(b => (
            <span key={b.label} className={`text-sm font-bold ${b.color}`}>{b.icon} {b.label}</span>
          ))}
        </div>
      )}
      {nextBadge && (
        <p className="text-xs text-neon-text-muted mb-3">{nextBadge.icon} {nextBadge.days}일 연속 출석 시 <span className={`font-bold ${nextBadge.color}`}>{nextBadge.label}</span> 뱃지 획득!</p>
      )}
      <div className="flex justify-center gap-1 mb-4">
        {[1,2,3,4,5,6,7].map((d) => (
          <div key={d} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${streak >= d ? 'bg-neon-gold text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}>
            {streak >= d ? '✓' : d}
          </div>
        ))}
      </div>
      <p className="text-2xl font-bold text-neon-gold mb-3">{streak}일 연속</p>
      {justEarned && (
        <div className="mb-3 animate-bounce text-lg font-bold text-neon-gold">
          🎉 {justEarned} 뱃지 획득!
        </div>
      )}
      <button onClick={handleCheck} disabled={checked}
        className={`rounded-xl px-8 py-3 font-bold transition ${checked ? 'bg-neon-surface-2 text-neon-text-muted' : 'bg-neon-gold text-white hover:bg-neon-gold/90 btn-glow'}`}>
        {checked ? '오늘 출석 완료!' : '출석 체크'}
      </button>
    </div>
  );
}

/* 술값 계산기는 가격 비노출 정책에 따라 비활성화 (CLAUDE.md / feedback_no_price_anywhere) */
export function DrinkBudgetCalc() {
  return null;
}

/* ═══ [T] 대리운전 원클릭 ═══ */
export function QuickDriverCall() {
  return (
    <div className="rounded-2xl border border-neon-green/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-2">대리운전 원클릭</h3>
      <p className="text-sm text-neon-text-muted mb-4">놀고 나서 안전하게 귀가하세요</p>
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:1577-4080" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-neon-green/20 py-3 text-sm font-bold text-neon-green transition hover:bg-neon-green/30" style={{minHeight:'44px'}}>
          카카오T 대리 1577-4080
        </a>
        <a href="tel:1588-5765" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-neon-accent/20 py-3 text-sm font-bold text-neon-accent transition hover:bg-neon-accent/30" style={{minHeight:'44px'}}>
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

/* ═══ [AK] 친구 초대 — VIP 보장 같은 가공 보상 표기 제거 ═══ */
export function InviteFriend() {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== 'undefined' ? window.location.origin + '?ref=friend' : 'https://nolcool.com?ref=friend';

  const copy = async () => {
    try { await navigator.clipboard.writeText(`놀쿨 — 전국 나이트/클럽/호빠 정보 ${link}`); setCopied(true); const t = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(t); } catch {}
  };

  return (
    <div className="rounded-2xl border border-neon-primary/30 bg-gradient-to-r from-neon-primary/5 via-neon-surface to-neon-accent/5 p-6 text-center">
      <h3 className="text-lg font-bold text-neon-text mb-2">친구한테 놀쿨 공유하기</h3>
      <p className="text-sm text-neon-text-muted mb-4">카톡으로 링크 한 번이면 끝. 가입까지 30초.</p>
      <button onClick={copy} className="rounded-xl bg-neon-primary px-6 py-3 font-bold text-white transition hover:bg-neon-primary-light btn-glow">
        {copied ? '링크 복사됨!' : '초대 링크 복사'}
      </button>
    </div>
  );
}
