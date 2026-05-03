import { createClient } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Lead Capture
// ---------------------------------------------------------------------------

export interface LeadData {
  name?: string;
  email: string;
  kakaoId?: string;
  source: 'nightlife-guide' | 'quiz' | 'weekly-hot' | 'waitlist' | 'referral';
  quizAnswers?: Record<string, string>;
  referralCode?: string;
}

export async function captureLead(data: LeadData): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) {
    // Fallback: save to localStorage
    const leads = JSON.parse(localStorage.getItem('nolcool_leads') || '[]');
    leads.push({ ...data, capturedAt: new Date().toISOString() });
    localStorage.setItem('nolcool_leads', JSON.stringify(leads));
    return true;
  }

  try {
    const { error } = await supabase.from('leads').insert({
      name: data.name || null,
      email: data.email,
      kakao_id: data.kakaoId || null,
      source: data.source,
      quiz_answers: data.quizAnswers || null,
      referral_code: data.referralCode || null,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch {
    // Fallback to localStorage
    const leads = JSON.parse(localStorage.getItem('nolcool_leads') || '[]');
    leads.push({ ...data, capturedAt: new Date().toISOString() });
    localStorage.setItem('nolcool_leads', JSON.stringify(leads));
    return true;
  }
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

const WAITLIST_KEY = 'nolcool_waitlist';

export function getWaitlistCount(): number {
  const stored = localStorage.getItem(WAITLIST_KEY + '_count');
  return stored ? parseInt(stored, 10) : 187;
}

export function incrementWaitlist(): number {
  const current = getWaitlistCount();
  const next = Math.min(current + 1, 300);
  localStorage.setItem(WAITLIST_KEY + '_count', String(next));
  return next;
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getOrCreateReferralCode(): string {
  const stored = localStorage.getItem('nolcool_referral_code');
  if (stored) return stored;
  const code = generateReferralCode();
  localStorage.setItem('nolcool_referral_code', code);
  return code;
}

export interface ReferralStats {
  code: string;
  referredCount: number;
  vipFreeMonths: number;
}

export function getReferralStats(): ReferralStats {
  const code = getOrCreateReferralCode();
  const count = parseInt(localStorage.getItem('nolcool_referred_count') || '0', 10);
  return {
    code,
    referredCount: count,
    vipFreeMonths: count >= 3 ? Infinity : count,
  };
}

export function addReferral(): void {
  const current = parseInt(localStorage.getItem('nolcool_referred_count') || '0', 10);
  localStorage.setItem('nolcool_referred_count', String(current + 1));
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Nurture email sequence (template data)
// ---------------------------------------------------------------------------

export const EMAIL_SEQUENCE = [
  { day: 1, week: 1, subject: '환영! 놀쿨 VIP가 된 걸 축하합니다', type: 'trust' },
  { day: 3, week: 1, subject: '이번 주말 갈 만한 곳 3선', type: 'trust' },
  { day: 5, week: 1, subject: '단골들만 아는 숨겨진 업소 이야기', type: 'trust' },
  { day: 8, week: 2, subject: '놀쿨 매치 퀴즈: 당신의 밤 유형은?', type: 'value' },
  { day: 11, week: 2, subject: '실제 VIP 후기: 놀쿨로 인생 업소 찾은 이야기', type: 'value' },
  { day: 15, week: 3, subject: '검색으로 찾아서 망한 밤 vs 놀쿨로 찾아서 성공한 밤', type: 'problem' },
  { day: 18, week: 3, subject: '매주 어디 갈지 고민하는 시간: 평균 47분 → 놀쿨: 3초', type: 'problem' },
  { day: 22, week: 4, subject: 'VIP 등급 48시간 미리보기 — 숨겨진 업소 공개', type: 'convert' },
  { day: 25, week: 4, subject: '300명 중 261명 등록 — 마감 임박', type: 'convert' },
  { day: 28, week: 4, subject: '내일부터 정가. 지금이 마지막', type: 'convert' },
] as const;
