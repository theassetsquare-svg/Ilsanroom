import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isOfficialTeam } from '@/components/community/AuthorBadge';
import { trackEvent } from '@/lib/visitor-tracker';
import { rememberReturn, takeReturn, safePath } from '@/lib/auth-return';
import { makeConsent, requiredOk, savePending, givenBefore } from '@/lib/consent';

/**
 * [놀쿨11-5] /login — 옛 src/pages/auth/LoginPage.tsx 를 옮겨 고친 판(주소 그대로).
 *  옛 자리는 P6 훅(비밀값 경로 auth/)이 편집을 막아 새 자리에 두고 App.tsx 라우트만 바꿨다. 비밀값은 이 파일에 없다.
 *  바뀐 것: ① 동의 필수 3·선택 2 분리(간주 동의 삭제) ② 방금 보던 쪽으로 복귀 ③ 설명문의 거짓(네이버 로그인·가입 100P) 삭제 ④ signup_start 측정.
 */
function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  // 삼성 인터넷 인앱, 카톡, 네이버, 인스타, 페이스북 등 WebView 감지
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|DaumApps|SamsungBrowser\/.*CrossApp|wv|WebView/i.test(ua);
}

function openInExternalBrowser(url: string) {
  // intent:// 스킴으로 크롬에서 열기 (안드로이드)
  const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
  window.location.href = intentUrl;
  // 0.5초 후에도 안 열리면 일반 열기 시도
  setTimeout(() => { window.open(url, '_blank'); }, 500);
}

function signInWith(provider: 'kakao' | 'google') {
  const supabase = createClient();
  if (!supabase) return;
  // 구글은 WebView에서 차단됨 — 외부 브라우저로 이동
  if (provider === 'google' && isWebView()) {
    openInExternalBrowser('https://nolcool.com/login');
    return;
  }
  supabase.auth.signInWithOAuth({ provider, options: { redirectTo: 'https://nolcool.com/auth/callback' } });
}

type Checks = { age19: boolean; terms: boolean; privacy: boolean; service: boolean; ad: boolean };

function ConsentRow({ on, onToggle, label, req, link, note }: { on: boolean; onToggle: () => void; label: string; req: boolean; link?: string; note?: string }) {
  return (
    <label className="flex items-start gap-2 py-1.5 text-[13px] text-neon-text">
      <input type="checkbox" checked={on} onChange={onToggle} className="mt-0.5 h-4 w-4 shrink-0 accent-[#7C3AED]" data-nc-consent-item={req ? 'required' : 'optional'} />
      <span className="min-w-0">
        <span className={req ? 'font-bold' : ''}>({req ? '필수' : '선택'}) {label}</span>
        {link && <> <a href={link} className="text-neon-primary underline">보기</a></>}
        {note && <span className="mt-0.5 block text-[11px] text-neon-text-muted">{note}</span>}
      </span>
    </label>
  );
}

export default function LoginPage() {
  // 설명문은 사실만 — 네이버 로그인 버튼은 없고 가입 포인트 지급 코드도 없다(새 프로필 points 0)
  useDocumentMeta('카카오 탭 한 번, 3초면 로그인 끝', '카카오·구글 계정으로 로그인. 가입하면 바로 찜 목록 저장·주간 투표·알림 설정을 쓸 수 있습니다. 닉네임만 공개되고 본명은 공개하지 않습니다.');
  const [loading, setLoading] = useState<'kakao' | 'google' | 'email' | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  // 동의 — 필수 3(만 19세 · 약관 · 개인정보)과 선택 2(서비스 알림 · 광고성 정보). 선택은 기본 꺼짐.
  const prev = givenBefore();
  const [checks, setChecks] = useState<Checks>({ age19: prev, terms: prev, privacy: prev, service: false, ad: false });
  const [needConsent, setNeedConsent] = useState(false);
  const reqOk = requiredOk(checks);
  const allOn = reqOk && checks.service && checks.ad;
  const setAll = (on: boolean) => setChecks({ age19: on, terms: on, privacy: on, service: on, ad: on });
  const flip = (k: keyof Checks) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  // 방금 보던 쪽 — ?redirect= 가 있으면 그것, 없으면 같은 사이트에서 왔을 때의 이전 쪽
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('redirect');
    const ref = (() => { try { const u = new URL(document.referrer); return u.origin === window.location.origin ? u.pathname + u.search : null; } catch { return null; } })();
    const target = safePath(q) || safePath(ref);
    if (target) rememberReturn(target);
  }, []);

  const loginTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (loginTimerRef.current) clearTimeout(loginTimerRef.current); }, []);

  const gate = (via: string): boolean => {
    if (!reqOk) { setNeedConsent(true); return false; }
    savePending(makeConsent(checks, via));
    return true;
  };

  const handleLogin = (provider: 'kakao' | 'google') => {
    if (!gate(provider)) return;
    trackEvent('signup_start', { provider });
    setLoading(provider);
    signInWith(provider);
    if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    loginTimerRef.current = setTimeout(() => setLoading(null), 3000);
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setEmailError('이메일과 비밀번호를 입력해주세요'); return; }
    if (password.length < 6) { setEmailError('비밀번호는 6자 이상이어야 합니다'); return; }
    if (!gate('email')) return;
    const supabase = createClient();
    if (!supabase) { setEmailError('Supabase 연결 실패'); return; }
    setLoading('email');
    setEmailError('');
    setEmailSuccess('');

    if (mode === 'signup') {
      if (!nickname.trim()) { setEmailError('닉네임을 입력해주세요'); setLoading(null); return; }
      if (nickname.trim().length < 2 || nickname.trim().length > 12) { setEmailError('닉네임은 2~12자로 입력해주세요'); setLoading(null); return; }
      // 운영팀 사칭 방지 — 공식 명찰 닉네임은 예약어(가입 불가)
      if (isOfficialTeam(nickname)) { setEmailError('사용할 수 없는 닉네임입니다'); setLoading(null); return; }
      trackEvent('signup_start', { provider: 'email' });
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: 'https://nolcool.com/auth/callback', data: { nickname: nickname.trim() } },
      });
      setLoading(null);
      if (error) setEmailError(error.message);
      else setEmailSuccess('인증 메일을 발송했습니다. 메일함을 확인해주세요.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(null);
      if (error) setEmailError(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 일치하지 않습니다' : error.message);
      else window.location.href = takeReturn() || '/';
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold text-neon-text">{mode === 'login' ? '로그인' : '회원가입'}</h1>
      <p className="mb-6 text-center text-sm text-neon-text-muted">
        {mode === 'login' ? '처음이면 이대로 가입까지 한 번에 끝납니다' : '이메일로 새 계정을 만드세요'}
      </p>

      {/* 동의 — 필수/선택 분리 · 선택은 꺼진 채로 시작 · 가입 뒤 알림 설정에서 언제든 바꾼다 */}
      <section aria-label="약관 동의" className={`mb-5 rounded-xl border p-3 ${needConsent && !reqOk ? 'border-red-400' : 'border-neon-border'}`} data-nc-consent>
        <label className="flex items-center gap-2 border-b border-neon-border pb-2 text-sm font-bold text-neon-text">
          <input type="checkbox" checked={allOn} onChange={() => setAll(!allOn)} className="h-4 w-4 accent-[#7C3AED]" data-nc-consent-all />
          전체 동의(선택 포함)
        </label>
        <ConsentRow on={checks.age19} onToggle={() => flip('age19')} req label="만 19세 이상입니다" note="놀쿨은 만 19세 이상만 이용합니다." />
        <ConsentRow on={checks.terms} onToggle={() => flip('terms')} req label="이용약관 동의" link="/terms" />
        <ConsentRow on={checks.privacy} onToggle={() => flip('privacy')} req label="개인정보 수집·이용 동의" link="/privacy" note="소셜 계정 식별번호·이메일·닉네임 · 회원 식별과 찜 목록·투표 · 탈퇴하면 바로 지움" />
        <ConsentRow on={checks.service} onToggle={() => flip('service')} req={false} label="서비스 알림 받기" note="내 지역·관심 업종의 새 가게·새 글·주간 투표 결과 · 주 최대 3번 · 밤 9시~아침 8시엔 보내지 않음" />
        <ConsentRow on={checks.ad} onToggle={() => flip('ad')} req={false} label="광고성 정보 받기" note="이벤트·광고주 소식 · 제목에 (광고) 표시 · 언제든 한 번에 끔" />
        <p className="pt-1 text-[11px] text-neon-text-muted">선택 항목은 동의하지 않아도 가입·이용할 수 있습니다.</p>
        {needConsent && !reqOk && <p className="pt-1 text-[12px] font-bold text-red-500" role="alert">필수 항목 3개에 체크해 주세요</p>}
      </section>

      <div className="space-y-3">
        <button
          onClick={() => handleLogin('kakao')}
          disabled={loading === 'kakao'}
          aria-disabled={!reqOk}
          className={`flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-neutral-900 transition hover:bg-[#FDD700] disabled:opacity-60 ${reqOk ? '' : 'opacity-60'}`}
          style={{ minHeight: '48px' }}
          data-nc-login="kakao"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#3C1E1E">
            <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.14.53-.92 3.31-.95 3.53 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.11.12 1.69.12 5.52 0 10-3.58 10-7.97C22 6.58 17.52 3 12 3z"/>
          </svg>
          {loading === 'kakao' ? '연결 중...' : '카카오로 시작하기'}
        </button>

        <button
          onClick={() => handleLogin('google')}
          disabled={loading === 'google'}
          aria-disabled={!reqOk}
          className={`flex w-full items-center justify-center gap-3 rounded-xl border border-neon-border bg-white py-3.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-60 ${reqOk ? '' : 'opacity-60'}`}
          style={{ minHeight: '48px' }}
          data-nc-login="google"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading === 'google' ? '연결 중...' : 'Google로 시작하기'}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-neon-border" />
        <span className="text-xs text-neon-text-muted">또는 이메일로</span>
        <div className="h-px flex-1 bg-neon-border" />
      </div>

      <div className="space-y-3">
        {mode === 'signup' && (
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 (2~12자)" maxLength={12}
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary transition" />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소"
          className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary transition" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()} placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary transition" />

        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        {emailSuccess && <p className="text-sm text-green-600">{emailSuccess}</p>}

        <button onClick={handleEmailAuth} disabled={loading === 'email'}
          className="flex w-full items-center justify-center rounded-xl bg-neon-primary py-3.5 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-60">
          {loading === 'email' ? '처리 중...' : mode === 'login' ? '이메일로 로그인' : '회원가입'}
        </button>

        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setEmailError(''); setEmailSuccess(''); }}
          className="w-full text-center text-sm text-neon-text-muted hover:text-neon-primary transition">
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-neon-text-muted/60">만 19세 이상만 이용할 수 있습니다</p>
    </div>
  );
}
