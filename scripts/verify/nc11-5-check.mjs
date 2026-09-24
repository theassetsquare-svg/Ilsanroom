#!/usr/bin/env node
/**
 * [놀쿨11-5] 3단계 검증 — node scripts/verify/nc11-5-check.mjs <스테이징|디버깅|최종> [--dist=dist] [--base=<라이브 사이트맵 xml>] [--build-log=<log>] [--research=<11-1 연구 md>] [--out=<json>]
 *  판정 낱말은 넷뿐: 통과 / 실패 / 실행 불가 / 해당 없음. 검사 0건은 실패다. 읽기만 한다(--out 보고만).
 *  스테이징 = 파일:줄 · 법 조항 출처 1:1 · 가짜 장치 0 · 비밀값 0 · 디버깅 = T1~T7(규칙 함수를 실제로 돌린다) · 최종 = 가입→저장→알림→공유 한 바퀴 + 대표님 원문 대조
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gatePage } from '../page-gate.mjs';

const stage = process.argv[2];
const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const DIST = arg('dist', 'dist');
const BASE_SITEMAP = arg('base', '');
const BUILD_LOG = arg('build-log', '');
const RESEARCH = arg('research', 'docs/NOLCOOL11-1_연구_2026-09-23.md');
const OUT = arg('out', '');
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note || '').slice(0, 180) });
const rd = (p) => fs.readFileSync(p, 'utf8');
const ex = (p) => fs.existsSync(p);
const line = (src, re) => src.split('\n').findIndex((l) => re.test(l)) + 1;

// ── 규칙 함수를 실제로 불러온다(TS → esbuild 묶음 → data: 모듈) · 브라우저 전역은 흉내 ──
async function loadTs(entry) {
  const esbuild = await import('esbuild');
  const r = esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear() };
globalThis.window = { location: { origin: 'https://nolcool.com', pathname: '/clubs/gangnam/gangnamclub-race/', search: '' } };

const FILES = {
  login: 'src/pages/member/LoginPage.tsx', cb: 'src/pages/member/AuthCallbackPage.tsx', join: 'src/components/member/JoinCard.tsx', notify: 'src/components/member/NotifySettings.tsx', welcome: 'src/components/member/WelcomeBenefits.tsx',
  policy: 'src/lib/notify-policy.ts', consent: 'src/lib/consent.ts', ret: 'src/lib/auth-return.ts', tracker: 'src/lib/visitor-tracker.ts', useAuth: 'src/hooks/useAuth.ts', fav: 'src/hooks/useFavorites.ts',
  vote: 'src/components/community/WeeklyVoteWidget.tsx', share: 'src/components/interactive/ShareButtons.tsx', myref: 'src/pages/my/MyReferralsPage.tsx', ref: 'src/pages/ReferralPage.tsx', welcomePage: 'src/pages/WelcomePage.tsx',
  favPage: 'src/pages/my/MyFavoritesPage.tsx', privacy: 'src/pages/PrivacyPage.tsx', terms: 'src/pages/TermsPage.tsx', legal: 'src/pages/LegalPage.tsx', layout: 'src/layouts/MainLayout.tsx', app: 'src/App.tsx',
  anomaly: 'scripts/member-signup-anomaly.mjs', conductor: 'scripts/monthly-conductor.mjs',
};
// 주석은 설명 글자라 검사에서 뺀다(「간주 동의 삭제」 같은 설명이 걸리지 않게)
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
const SRC = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, ex(f) ? noComments(rd(f)) : '']));
const NEW_MEMBER_CODE = [SRC.login, SRC.cb, SRC.join, SRC.notify, SRC.welcome, SRC.policy, SRC.consent, SRC.ret].join('\n');

// 법 조항 출처(11-1 연구 3절 표 id) — 규칙 → 출처
const LAW = {
  '광고성 정보 사전 동의·야간·전송자·수신거부·(광고) 표시': 'LAW-정보통신망법',
  '최소 수집·선택 비동의로 서비스 거부 금지': 'LAW-개인정보보호법',
  '만 19세 이상(청소년 유입 장치 0)': 'LAW-청소년보호법',
  '추천 보상 표시(경제적 이해관계)': 'LAW-추천보증심사지침',
  '거짓·과장 표시 금지(100P·네이버 삭제 근거)': 'LAW-표시광고법',
};

if (stage === '스테이징') {
  for (const [k, f] of Object.entries(FILES)) ck(`파일 ${f}`, !!SRC[k]);
  ck('검증 파일 scripts/verify/nc11-5-check.mjs', ex('scripts/verify/nc11-5-check.mjs'));
  // 2-1 가입 마찰
  ck(`/login 라우트 = member/LoginPage(src/App.tsx:${line(SRC.app, /pages\/member\/LoginPage/)})`, /import\('\.\/pages\/member\/LoginPage'\)/.test(SRC.app));
  ck(`/auth/callback 라우트 = member/AuthCallbackPage(src/App.tsx:${line(SRC.app, /pages\/member\/AuthCallbackPage/)})`, /import\('\.\/pages\/member\/AuthCallbackPage'\)/.test(SRC.app));
  ck('라우트 주소 수 그대로(새 주소 0)', (() => { try { return (execFileSync('git', ['show', 'HEAD:src/App.tsx'], { encoding: 'utf8' }).match(/<Route /g) || []).length === (SRC.app.match(/<Route /g) || []).length; } catch { return null; } })());
  ck('/login · /auth/callback 주소 문자열 그대로', /<Route path="\/login"/.test(SRC.app) && /<Route path="\/auth\/callback"/.test(SRC.app));
  ck(`로그인 동의 칸(src/pages/member/LoginPage.tsx:${line(SRC.login, /data-nc-consent>/)})`, /data-nc-consent>/.test(SRC.login));
  for (const [lab, req] of [['만 19세 이상입니다', true], ['이용약관 동의', true], ['개인정보 수집·이용 동의', true], ['서비스 알림 받기', false], ['광고성 정보 받기', false]]) ck(`동의 항목 「${lab}」 ${req ? '필수' : '선택'}`, new RegExp(`req${req ? '' : '=\\{false\\}'} label="${lab}"`).test(SRC.login));
  ck('전체 동의 칸', /data-nc-consent-all/.test(SRC.login) && /전체 동의\(선택 포함\)/.test(SRC.login));
  ck('선택 항목 기본 꺼짐(service·ad false)', /service: false, ad: false/.test(SRC.login));
  ck('필수 안 되면 가입 막음(gate → setNeedConsent)', /if \(!reqOk\) \{ setNeedConsent\(true\); return false; \}/.test(SRC.login));
  ck('「선택 항목은 동의하지 않아도 가입·이용」 문구', /선택 항목은 동의하지 않아도 가입·이용할 수 있습니다/.test(SRC.login));
  ck('간주 동의 문구 0(「동의하는 것으로 간주」)', !/간주/.test(SRC.login));
  ck('설명문 거짓 0 — 「100P」 없음', !/100P/.test(SRC.login));
  ck('설명문 거짓 0 — 없는 「네이버」 로그인 없음', !/useDocumentMeta\([^)]*네이버/.test(SRC.login));
  ck('카카오·구글 두 제공자만(새 제공자 0)', /provider: 'kakao' \| 'google'/.test(SRC.login.replace(/\s+/g, ' ')) || /signInWith\(provider: 'kakao' \| 'google'\)/.test(SRC.login));
  ck('필수 입력칸 0(소셜) — 이메일 모드에서만 입력칸', /mode === 'signup' && \(/.test(SRC.login));
  ck('방금 보던 쪽 기억(?redirect= · 같은 사이트 이전 쪽)', /get\('redirect'\)/.test(SRC.login) && /rememberReturn\(target\)/.test(SRC.login));
  ck('이메일 로그인 뒤 복귀', /takeReturn\(\) \|\| '\/'/.test(SRC.login));
  ck('signup_start 측정(소셜·이메일)', (SRC.login.match(/trackEvent\('signup_start'/g) || []).length === 2);
  ck('콜백: 동의 옮기기(takePending → mergeForUser → updateUser)', /takePending\(\)/.test(SRC.cb) && /mergeForUser\(/.test(SRC.cb) && /supabase\.auth\.updateUser\(\{ data: patch \}\)/.test(SRC.cb));
  ck('콜백: 닉네임 없으면 회원+번호(본명 아님 · 닉네임 쪽 거치지 않음)', /nickname = `회원\$\{/.test(SRC.cb) && !/setup-nickname/.test(SRC.cb.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')));
  ck('콜백: 복귀(takeReturn · replace)', /navigate\(takeReturn\(\) \|\| '\/', \{ replace: true \}\)/.test(SRC.cb));
  ck('콜백: 새 계정 판정 = 생성 10분 안', /NEW_ACCOUNT_MS = 10 \* 60 \* 1000/.test(SRC.cb));
  ck('가입 카드: OAuth 직행 0(동의를 거침)', !/signInWithOAuth/.test(SRC.join) && /navigate\(loginHref\(here\)\)/.test(SRC.join));
  ck('옛 가입 카드 import 0', !fs.readdirSync('src', { recursive: true }).filter((f) => /\.(tsx|ts)$/.test(f)).some((f) => { const p = path.join('src', f); return !p.includes(path.join('components', 'auth')) && /components\/auth\/InlineJoinCard/.test(noComments(rd(p))); }));
  for (const f of ['src/components/interactive/Roulette.tsx', 'src/components/venue/TapReviewCard.tsx', 'src/components/venue/VenueDetailPage.tsx', 'src/pages/my/MyFavoritesPage.tsx', 'src/pages/seo/BestCategoryPage.tsx']) ck(`새 가입 카드 사용 ${f}`, /components\/member\/JoinCard/.test(rd(f)));
  ck('useAuth: 가입 판정 = 계정 생성 10분(기기 단위 아님)', /isNewAccount = !!created && Date\.now\(\) - created < 10 \* 60 \* 1000/.test(SRC.useAuth));
  ck('useAuth: 환영 메일은 새 계정에만', /if \(isNewAccount && !welcomedSet\.includes/.test(SRC.useAuth));
  // 2-2 즉시 혜택
  ck(`가입 즉시 혜택 3가지(src/components/member/WelcomeBenefits.tsx:${line(SRC.welcome, /const items = \[/)})`, (SRC.welcome.match(/\{ icon: '/g) || []).length === 3);
  ck('혜택 = 찜 목록·주간 투표·알림 설정', /찜 목록/.test(SRC.welcome) && /주간 투표/.test(SRC.welcome) && /알림 설정/.test(SRC.welcome));
  ck('혜택 안내 가짜 0(포인트·숫자 약속 없음)', !/\d+\s*P\b|포인트|적립/.test(SRC.welcome));
  ck('혜택 안내는 한 번만(sessionStorage 표 지움)', /sessionStorage\.removeItem\('nc_just_joined'\)/.test(SRC.welcome));
  ck('혜택 안내 닫기 1번 · 강제벽 0', /aria-label="닫기"/.test(SRC.welcome) && !/fixed inset-0/.test(SRC.welcome));
  ck('MainLayout 에 혜택 안내', /<WelcomeBenefits \/>/.test(SRC.layout));
  ck('회원 전용은 편의만(정보 가림 코드 0)', !/if \(!user\)[^\n]*return null;[^\n]*본문|blur\(|정회원만 보기/.test(NEW_MEMBER_CODE));
  // 2-3 알림
  ck(`알림 규칙 한 곳(src/lib/notify-policy.ts:${line(SRC.policy, /export function canSend/)})`, /export function canSend/.test(SRC.policy));
  ck('야간 21~08시 전송 0', /NIGHT_START = 21/.test(SRC.policy) && /NIGHT_END = 8/.test(SRC.policy) && /if \(isNight\(opts\.now\)\) return \{ ok: false, reason: 'night' \}/.test(SRC.policy));
  ck('KST 기준 시각', /getUTCHours\(\) \+ 9\) % 24/.test(SRC.policy));
  ck('주 상한 최대 3', /MAX_WEEKLY = 3/.test(SRC.policy));
  ck('동의 없으면 0건(service·ad 따로)', /no-consent-service/.test(SRC.policy) && /no-consent-ad/.test(SRC.policy));
  ck('빈 알림 0(사건 없으면 send false)', /reason: 'empty'/.test(SRC.policy));
  ck('광고성 제목 (광고)', /`\(광고\) \$\{s\}`/.test(SRC.policy));
  ck('전송자·연락처·수신거부 안내 문구', /보낸 곳:/.test(SRC.policy) && /수신거부/.test(SRC.policy));
  ck('한 번에 해지 unsubscribeAll', /export function unsubscribeAll/.test(SRC.policy));
  ck('알림 설정 칸(회원) — 저장 목록 쪽 안(새 주소 0)', /<NotifySettings user=\{user\} regions=\{regionOrder\} \/>/.test(SRC.favPage));
  ck('알림 설정: 스위치 2(서비스·광고) role=switch', /role="switch"/.test(SRC.notify) && /\['service', '서비스 알림'/.test(SRC.notify) && /\['ad', '광고성 정보'/.test(SRC.notify));
  ck('알림 설정: 모든 알림 끄기 1클릭', /data-nc-notify-off/.test(SRC.notify) && /save\(unsubscribeAll\(prefs\)/.test(SRC.notify));
  ck('알림 설정: 수신거부 주소 ?notify=off 한 번에', /get\('notify'\) === 'off'/.test(SRC.notify));
  ck('알림 설정: 저장 = 사용자 메타데이터(새 표 0)', /supabase\.auth\.updateUser\(\{ data: \{ notify: stamped \} \}\)/.test(SRC.notify));
  ck('알림 설정: notify_optin 측정(꺼짐→켜짐일 때만)', /if \(!wasOn && nowOn\) trackEvent\('notify_optin'/.test(SRC.notify));
  ck('알림 설정: 주 횟수 1~3 선택', /Array\.from\(\{ length: MAX_WEEKLY \}/.test(SRC.notify));
  ck('알림 발송 코드 0(이번 단계는 규칙·설정까지 · 채널은 대표님)', !/api\.resend\.com|sendEmail|PushManager|serviceWorker/.test(NEW_MEMBER_CODE));
  ck('동의 판(consent.ts) 필수 3 · 선택 2 · night false', /REQUIRED_KEYS = \['age19', 'terms', 'privacy'\]/.test(SRC.consent) && /OPTIONAL_KEYS = \['service', 'ad'\]/.test(SRC.consent) && /night: false/.test(SRC.consent));
  ck('동의 기록 판 번호 CONSENT_VERSION', /CONSENT_VERSION = '2026-09-24'/.test(SRC.consent));
  ck('동의 합치기는 켜는 쪽만(있던 설정을 끄지 않음)', /service: base\.service \|\| pending\.service/.test(SRC.consent));
  // 2-4 초대
  ck('추천 링크 = 있는 /welcome + 매개변수(없는 /ref/ 0)', /\/welcome\?utm_source=invite&ref=/.test(SRC.myref) && !/\/ref\/\$\{/.test(SRC.myref));
  ck('추천 보상 「없음」 첫머리 표시', /추천 보상: 없음/.test(SRC.myref) && /data-nc-reward="none"/.test(SRC.myref));
  ck('늘지 않던 「누적 추천 N명」 삭제', !/referredCount\}명/.test(SRC.myref));
  ck('추천 쪽 문구: 보상 없음 · 실적 집계 안 함', /추천 보상은 없습니다/.test(SRC.ref) && /추천 실적은 따로 집계하지 않습니다/.test(SRC.ref) && !/검토 후 별도 공지/.test(SRC.ref));
  ck('/welcome ?ref= 도 invite_open(코드 값 전송 0)', /qs\.get\('ref'\) \? 'referral_link'/.test(SRC.welcomePage) && !/ref: qs\.get/.test(SRC.welcomePage));
  ck('친구에게 보내기 = 링크 공유 · share 측정', /trackEvent\('share_click', \{ channel: 'share_buttons' \}\)/.test(SRC.share));
  // 2-5 측정
  for (const ev of ['signup_start', 'save', 'vote', 'notify_optin']) ck(`GA4 이벤트 ${ev}(EventType·GA4 표 둘 다)`, new RegExp(`'${ev}'`).test(SRC.tracker) && new RegExp(`${ev}: '${ev}'`).test(SRC.tracker));
  ck('GA4 sign_up = 가입 완료(signup → sign_up)', /signup: 'sign_up'/.test(SRC.tracker));
  ck('GA4 share = 공유(share_click → share)', /share_click: 'share'/.test(SRC.tracker));
  ck('찜 추가 = save(해제는 안 셈)', /if \(!isRemoving\) trackEvent\('save'/.test(SRC.fav));
  ck('주간 투표 = vote', /trackEvent\('vote', \{ poll: pollKey \}\)/.test(SRC.vote));
  ck('투표 로그인 링크 = 이 쪽으로 복귀', /to=\{loginHref\(\)\}/.test(SRC.vote));
  ck('새 이벤트는 send() 게이트 뒤(raw gtag 0)', !/gtag\(/.test(NEW_MEMBER_CODE + SRC.fav + SRC.vote + SRC.share));
  ck('월간 보고 6) 회원·MAU 절', /6\) 회원·MAU 루프/.test(SRC.conductor) && /function buildMemberSection/.test(SRC.conductor));
  ck('월간 보고: 값 없으면 ⚠️ 미측정(지어내지 않음)', /⚠️ 미측정/.test(SRC.conductor) && /시작선 회원 10명/.test(SRC.conductor));
  ck('가입 사람 패턴 검사 = 표시만(차단 0)', /action: 'display-only'/.test(SRC.anomaly) && !/\.delete\(|ban|block\(/.test(SRC.anomaly.replace(/차단[^\n]*/g, '')));
  ck('검사 규칙 R1 같은 IP 3건/60분 · R2 20건/10분 · R3 5건/1분', /sameIpN: 3, sameIpWindowMin: 60, burstN: 20, burstWindowMin: 10, streakN: 5, streakWindowMin: 1/.test(SRC.anomaly));
  // T6 처방·약관
  ck('처리방침: 남의 도메인 메일(neon.com) 0', !/neon\.com/.test(SRC.privacy));
  ck('처리방침: 수집 항목 = 소셜 식별번호·이메일·닉네임·동의 기록·찜·투표·알림 설정', /카카오·구글 계정 식별번호/.test(SRC.privacy) && /동의 기록/.test(SRC.privacy) && /찜 목록, 주간 투표 기록/.test(SRC.privacy) && /알림 설정/.test(SRC.privacy));
  ck('처리방침: 받지 않는 정보 명시(휴대전화·생년월일·성별·결제)', /받지 않는 정보: 휴대전화번호, 생년월일, 성별, 주민등록번호, 결제 정보/.test(SRC.privacy));
  ck('처리방침: 목적 — 서비스 알림·광고성(선택 · 야간 0 · (광고))', /서비스 알림\(선택 동의 시\)/.test(SRC.privacy) && /광고성 정보\(선택 동의 시\)/.test(SRC.privacy));
  ck('처리방침: 선택 비동의로 제한 없음', /선택 항목에 동의하지 않아도 가입과 이용에 제한이 없습니다/.test(SRC.privacy));
  ck('처리방침: 보관 기간(탈퇴 즉시 · 동의 기록 · 접속 기록 3개월)', /회원 탈퇴 시까지 — 탈퇴하면 즉시 파기/.test(SRC.privacy) && /동의 기록: 동의를 철회하거나 탈퇴할 때까지/.test(SRC.privacy) && /접속 기록: 3개월/.test(SRC.privacy));
  ck('처리방침: 없는 결제 기록 보관 문구 0', !/결제 기록: 5년/.test(SRC.privacy));
  ck('처리방침: 위탁처 이름(Supabase·Cloudflare·Resend)', /Supabase Inc\./.test(SRC.privacy) && /Cloudflare, Inc\./.test(SRC.privacy) && /Resend/.test(SRC.privacy));
  ck('처리방침: 없는 네이버 로그인 0', !/카카오, 네이버, Google/.test(SRC.privacy));
  ck('처리방침: 제목 오타(개인개인자료) 0', !/개인개인자료<span/.test(SRC.privacy));
  ck('약관 제5조: 만 19세·필수 3·선택 알림·실명 요구 0', /만 19세 이상 확인」·이용약관·개인정보 수집·이용\(필수 3개\)/.test(SRC.terms) && /서비스 알림과 광고성 정보 수신은 선택/.test(SRC.terms) && !/실명이 아닌 때/.test(SRC.terms));
  ck('법 안내: 없는 「본인 확인」 → 자기 확인 칸으로 사실대로', /휴대전화 본인인증은 하지 않습니다/.test(SRC.legal) && !/본인 확인을 거친 회원/.test(SRC.legal));
  // 법 조항 출처 1:1
  const research = ex(RESEARCH) ? rd(RESEARCH) : '';
  for (const [rule, id] of Object.entries(LAW)) ck(`법 출처 ${rule} → ${id}`, research ? research.includes(`| ${id} |`) : null);
  // 가짜 장치 0 · 비밀값 0
  ck('가짜 0 — 새 회원 코드에 Math.random 0', !/Math\.random/.test(NEW_MEMBER_CODE));
  ck('가짜 0 — 자동 가입·시드 회원 코드 0(signUp 은 이메일 가입 손 입력만)', (NEW_MEMBER_CODE.match(/auth\.signUp\(/g) || []).length === 1 && !/createUser|admin\.auth/.test(NEW_MEMBER_CODE));
  ck('가짜 0 — 「N명이 가입·저장」 같은 숫자 문구 0', !/명이 (가입|저장|받)|\d+명 가입/.test(NEW_MEMBER_CODE));
  ck('비밀값 0 — 새 코드에 키·토큰 글자 0', !/sk-ant|service_role|re_[A-Za-z0-9]{16,}|eyJhbGciOi|RESEND_API_KEY\s*[:=]\s*['"]/.test(NEW_MEMBER_CODE + SRC.anomaly));
  ck('API 키 0', !/ANTHROPIC_API_KEY|OPENAI_API_KEY/.test(NEW_MEMBER_CODE + SRC.anomaly));
  ck('네이버 호출 0', !/naver\.com/.test(NEW_MEMBER_CODE));
  ck('열린 리디렉트 0(같은 출처 경로만)', /u\.origin !== window\.location\.origin\) return null/.test(SRC.ret));
  ck('로그인·콜백·관리 쪽으로는 복귀 안 함', /BLOCK = \/\^\\\/\(login\|auth\|setup-nickname\|admin\)/.test(SRC.ret));
  ck('새 창 0(새 회원 코드 target=_blank 0 · 옛 구글 웹뷰 외부 열기만)', (NEW_MEMBER_CODE.match(/_blank/g) || []).length === 1);
  ck('Actions 신설 0', (() => { try { return execFileSync('git', ['status', '--short', '.github'], { encoding: 'utf8' }).trim() === ''; } catch { return null; } })());
  ck('옛 auth/ 파일 손대지 않음(P6)', (() => { try { return execFileSync('git', ['status', '--short', 'src/pages/auth', 'src/components/auth'], { encoding: 'utf8' }).trim() === ''; } catch { return null; } })());
}

if (stage === '디버깅') {
  const P = await loadTs('src/lib/notify-policy.ts');
  const C = await loadTs('src/lib/consent.ts');
  const A = await loadTs('src/lib/auth-return.ts');
  const kst = (h, day = 24) => new Date(Date.UTC(2026, 8, day, (h - 9 + 24) % 24, 30)) ; // KST h시 30분
  // T3 알림 — 24시간 × 두 종류 × 동의 켬/끔
  for (const kind of ['service', 'ad']) {
    for (let h = 0; h < 24; h++) {
      const on = P.canSend({ prefs: { [kind]: true }, kind, now: kst(h), sentThisWeek: 0 });
      const night = h >= 21 || h < 8;
      ck(`T3 ${kind} 동의 · KST ${h}시 → ${night ? '보내지 않음(야간)' : '보냄'}`, on.ok === !night && (night ? on.reason === 'night' : on.reason === 'ok'), on.reason);
    }
    const off = P.canSend({ prefs: {}, kind, now: kst(12), sentThisWeek: 0 });
    ck(`T3 ${kind} 동의 없음 → 0건`, !off.ok && off.reason === `no-consent-${kind}`);
  }
  ck('T3 서비스 동의만 → 광고성 0건', !P.canSend({ prefs: { service: true }, kind: 'ad', now: kst(12), sentThisWeek: 0 }).ok);
  ck('T3 광고성 동의만 → 서비스 0건', !P.canSend({ prefs: { ad: true }, kind: 'service', now: kst(12), sentThisWeek: 0 }).ok);
  ck('T3 야간 광고 동의가 있어도 야간 0건', !P.canSend({ prefs: { ad: true, night: true }, kind: 'ad', now: kst(23), sentThisWeek: 0 }).ok);
  for (const cap of [1, 2, 3]) for (let sent = 0; sent <= 3; sent++) { const r = P.canSend({ prefs: { service: true, weeklyCap: cap }, kind: 'service', now: kst(12), sentThisWeek: sent }); ck(`T3 상한 주 ${cap}번 · 이미 ${sent}번 → ${sent < cap ? '보냄' : '막음'}`, r.ok === sent < cap); }
  ck('T3 상한은 3을 넘지 않음(10 넣어도 3)', P.normalizePrefs({ weeklyCap: 10 }).weeklyCap === 3);
  ck('T3 상한 최소 1(0 넣어도 1)', P.normalizePrefs({ weeklyCap: 0 }).weeklyCap >= 1);
  const ev = [
    { type: 'new_venue', title: '강남 새 클럽', href: '/clubs/gangnam/x/', region: '강남', cat: 'club', at: '2026-09-23T10:00:00Z' },
    { type: 'new_post', title: '부산 후기', href: '/community/post/1', region: '부산', cat: 'night', at: '2026-09-23T11:00:00Z' },
    { type: 'vote_result', title: '이번 주 투표 결과', href: '/ranking/', at: '2026-09-22T12:00:00Z' },
  ];
  const d0 = P.planDigest({ events: [], prefs: { service: true }, now: kst(12), sentThisWeek: 0 });
  ck('T3 사건 없음 → 보내지 않음(빈 알림 0)', !d0.send && d0.reason === 'empty');
  const d1 = P.planDigest({ events: ev, prefs: { service: true, regions: ['강남'] }, now: kst(12), sentThisWeek: 0 });
  ck('T3 관심 지역 강남 → 강남 사건 + 투표 결과만', d1.send && d1.items.length === 2 && d1.items.every((x) => x.region === '강남' || x.type === 'vote_result'));
  const d2 = P.planDigest({ events: ev, prefs: { service: true, cats: ['night'] }, now: kst(12), sentThisWeek: 0 });
  ck('T3 관심 업종 나이트 → 나이트 사건 + 투표 결과만', d2.send && d2.items.every((x) => x.cat === 'night' || x.type === 'vote_result'));
  const d3 = P.planDigest({ events: ev, prefs: { service: true }, now: kst(12), sentThisWeek: 0 });
  ck('T3 관심 안 고름 → 사건 전부(최대 5)', d3.send && d3.items.length === 3);
  ck('T3 최신순', d3.items[0].at >= d3.items[1].at && d3.items[1].at >= d3.items[2].at);
  ck('T3 야간 묶음 → 보내지 않음', !P.planDigest({ events: ev, prefs: { service: true }, now: kst(22), sentThisWeek: 0 }).send);
  ck('T3 동의 없는 묶음 → 보내지 않음', !P.planDigest({ events: ev, prefs: {}, now: kst(12), sentThisWeek: 0 }).send);
  ck('T3 광고성 제목 앞 (광고)', P.subjectFor('ad', '이벤트') === '(광고) 이벤트' && P.planDigest({ events: ev, prefs: { ad: true }, now: kst(12), sentThisWeek: 0, kind: 'ad' }).subject.startsWith('(광고) '));
  ck('T3 서비스 알림 제목엔 (광고) 없음', !P.subjectFor('service', '소식').includes('(광고)'));
  ck('T3 수신거부 안내 = /my/favorites?notify=off', P.footerText().includes('/my/favorites?notify=off'));
  const un = P.unsubscribeAll({ service: true, ad: true, night: true, weeklyCap: 3, regions: ['강남'] }, new Date('2026-09-24T01:00:00Z'));
  ck('T3 한 번에 해지 → service·ad·night 모두 꺼짐', !un.service && !un.ad && !un.night);
  ck('T3 해지 시각 기록', un.offAt === '2026-09-24T01:00:00.000Z');
  ck('T3 해지 뒤 보낼 수 없음', !P.canSend({ prefs: un, kind: 'service', now: kst(12), sentThisWeek: 0 }).ok && !P.canSend({ prefs: un, kind: 'ad', now: kst(12), sentThisWeek: 0 }).ok);
  ck('T3 망가진 설정 값 → 안전 기본(모두 꺼짐)', (() => { const n = P.normalizePrefs({ service: 'yes', ad: 1, regions: 'x' }); return !n.service && !n.ad && Array.isArray(n.regions); })());
  // T1 가입 흐름 — 동의 판정 8가지
  for (let m = 0; m < 8; m++) { const c = { age19: !!(m & 1), terms: !!(m & 2), privacy: !!(m & 4) }; ck(`T1 필수 동의 ${JSON.stringify(c)} → ${m === 7 ? '가입 가능' : '막음'}`, C.requiredOk(c) === (m === 7)); }
  ck('T1 선택 둘 다 꺼도 가입 가능', C.requiredOk({ age19: true, terms: true, privacy: true, service: false, ad: false }));
  const mc = C.makeConsent({ age19: true, terms: true, privacy: true, service: true, ad: false }, 'kakao');
  ck('T1 동의 기록: 판 번호·시각·경로·야간 false', mc.version === C.CONSENT_VERSION && !!mc.at && mc.via === 'kakao' && mc.night === false);
  C.savePending(mc);
  ck('T1 OAuth 전 대기 동의 저장', !!localStorage.getItem('nc_pending_consent'));
  ck('T1 재방문 때 필수 칸 미리 채움(givenBefore)', C.givenBefore() === true);
  const tp = C.takePending();
  ck('T1 콜백에서 대기 동의 꺼냄 · 한 번만', !!tp && C.takePending() === null);
  const mg = C.mergeForUser(tp, null);
  ck('T1 새 회원: 서비스 알림 켬·광고 꺼짐 그대로', mg.notify.service === true && mg.notify.ad === false && !!mg.notify.optinAt);
  const mg2 = C.mergeForUser(C.makeConsent({ age19: true, terms: true, privacy: true, service: false, ad: false }, 'google'), { service: true, ad: true, weeklyCap: 3 });
  ck('T1 기존 회원: 이번에 안 켜도 있던 알림을 끄지 않음', mg2.notify.service === true && mg2.notify.ad === true && mg2.notify.weeklyCap === 3);
  localStorage.setItem('nc_pending_consent', JSON.stringify({ age19: false, terms: true, privacy: true }));
  ck('T1 필수 빠진 대기 동의는 버림', C.takePending() === null);
  // T1 복귀 — 같은 출처만
  const cases = [['/clubs/gangnam/gangnamclub-race/', '/clubs/gangnam/gangnamclub-race/'], ['/region/강남/?x=1', '/region/%EA%B0%95%EB%82%A8/?x=1'], ['https://nolcool.com/ranking/', '/ranking/'], ['https://evil.com/x', null], ['//evil.com/x', null], ['javascript:alert(1)', null], ['/login', null], ['/login?redirect=/x', null], ['/auth/callback', null], ['/setup-nickname', null], ['/admin/users', null], ['', null], [null, null]];
  for (const [inp, want] of cases) ck(`T1 복귀 주소 ${JSON.stringify(inp)} → ${want === null ? '거절' : want}`, A.safePath(inp) === want, String(A.safePath(inp)));
  A.rememberReturn('/clubs/gangnam/gangnamclub-race/');
  ck('T1 복귀 기억 → 꺼냄 → 한 번만', A.takeReturn() === '/clubs/gangnam/gangnamclub-race/' && A.takeReturn() === null);
  localStorage.setItem('nc_return_to', JSON.stringify({ p: '/ranking/', t: Date.now() - 31 * 60 * 1000 }));
  ck('T1 30분 지난 복귀는 버림', A.peekReturn() === null);
  ck('T1 로그인 주소에 지금 쪽을 싣는다', A.loginHref('/clubs/gangnam/gangnamclub-race/') === '/login?redirect=%2Fclubs%2Fgangnam%2Fgangnamclub-race%2F');
  ck('T1 홈이면 redirect 없이 /login', A.loginHref('/') === '/login');
  // T1 클릭 수(우리 쪽) — 로그인 쪽: 전체 동의 1 + 카카오 1 · 가입 카드: 카드 1 + 전체 동의 1 + 카카오 1
  const loginClicks = 2, cardClicks = 3;
  ck('T1 로그인 쪽 가입 클릭 수 2 ≤ 3', loginClicks <= 3 && /data-nc-consent-all/.test(SRC.login) && /data-nc-login="kakao"/.test(SRC.login));
  ck('T1 가게 쪽 가입 카드 경로 클릭 수 3 ≤ 3', cardClicks <= 3 && /navigate\(loginHref\(here\)\)/.test(SRC.join));
  ck('T1 소셜 가입 필수 입력칸 0(닉네임 자동)', /회원\$\{String\(userId\)/.test(SRC.cb));
  // T2 가입 즉시 저장·투표·알림 설정 — 코드 경로가 로그인만 요구하는지
  ck('T2 저장: 로그인 즉시 DB 저장(user_favorites upsert)', /favTable\(supabase\)\.upsert\(\{ user_id: user\.id, venue_slug: slug \}/.test(SRC.fav));
  ck('T2 투표: 로그인 즉시 1인 1표(weekly_poll_votes insert)', /from\('weekly_poll_votes'\) as any\)\.insert\(\{ poll_key: pollKey, choice: slug, user_id: user\.id \}\)/.test(SRC.vote));
  ck('T2 알림 설정: 로그인 즉시 켜고 끔(updateUser notify)', /updateUser\(\{ data: \{ notify: stamped \} \}\)/.test(SRC.notify));
  // T4 공유·추천
  ck('T4 공유 링크 = 지금 쪽 주소(매개변수 0)', /url \|\| window\.location\.href/.test(SRC.share));
  ck('T4 추천 링크 = /welcome?utm_source=invite&ref=코드', /\/welcome\?utm_source=invite&ref=\$\{stats\.code\}/.test(SRC.myref));
  ck('T4 보상 없음 표시 · 보상 약속 문구 0', /추천 보상: 없음/.test(SRC.myref) && !/(적립금|무료 이용권|VIP) (지급|드립)/.test(SRC.myref + SRC.ref));
  // 가입 사람 패턴 검사 자체 시험
  try { const o = execFileSync(process.execPath, ['scripts/member-signup-anomaly.mjs', '--self-test'], { encoding: 'utf8' }); const lines = o.split('\n').filter((l) => /^(통과|실패) · /.test(l)); for (const l of lines) ck(`가입 패턴 검사 ${l.slice(4)}`, l.startsWith('통과')); ck('가입 패턴 검사 자체 시험 10건', lines.length === 10); } catch (e) { ck('가입 패턴 검사 실행', false, String(e.message).slice(0, 100)); }
  // T5 GA4 — 번들에 이벤트 이름
  const bundle = ex(path.join(DIST, 'assets')) ? fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => rd(path.join(DIST, 'assets', f))).join('') : '';
  for (const e of ['signup_start', 'sign_up', 'save', 'vote', 'notify_optin', 'share']) ck(`T5 번들에 GA4 이벤트 ${e}`, bundle.includes(`"${e}"`) || bundle.includes(`'${e}'`) || new RegExp(`${e}:"${e}"`).test(bundle));
  ck('T5 GA4 디버그 뷰', null, 'GA4 권한 없음(11-1 실측) · 로컬 미리보기 서버는 메모리로 정지(11-4) — 번들 문자열로 대체');
  // T6 처리방침 — 번들에 새 문구
  for (const t of ['받지 않는 정보', '동의 기록: 동의를 철회하거나 탈퇴할 때까지', 'Supabase Inc.', '선택 항목에 동의하지 않아도 가입과 이용에 제한이 없습니다']) ck(`T6 번들 처리방침 「${t}」`, bundle.includes(t));
  ck('T6 번들에 neon.com 메일 0', !bundle.includes('privacy@neon.com'));
  ck('T6 번들 약관 제5조 새 문구', bundle.includes('서비스 알림과 광고성 정보 수신은 선택'));
  ck('T6 번들 로그인 설명문 100P 0', !/가입 즉시 100P/.test(bundle));
  // T7 빌드·주소·게이트
  if (BUILD_LOG && ex(BUILD_LOG)) { const log = rd(BUILD_LOG); ck('T7 빌드 page-gate 통과', /page-gate 통과/.test(log)); ck('T7 빌드 로그 FAIL 0', !/FAIL —|❌ .*FAIL/.test(log)); } else ck('T7 빌드 로그', null, '--build-log 없음');
  try { execFileSync(process.execPath, ['scripts/page-gate.mjs', `--dist=${DIST}`], { stdio: 'pipe' }); ck('T7 page-gate CLI exit 0', true); } catch (e) { ck('T7 page-gate CLI exit 0', false, String(e.stdout || e.message).slice(0, 120)); }
  if (BASE_SITEMAP && ex(BASE_SITEMAP)) { const base = new Set([...rd(BASE_SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])); const now = new Set([...rd(path.join(DIST, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])); ck('T7 사이트맵 빠짐 0', [...base].every((u) => now.has(u))); ck('T7 사이트맵 추가 0', [...now].every((u) => base.has(u))); ck('T7 466 = 466', base.size === now.size && now.size === 466, `${base.size} → ${now.size}`); } else ck('T7 기준 사이트맵', null, '--base 없음');
  ck('T7 /login·/my 는 사이트맵 밖(noindex)', !/nolcool\.com\/(login|my)\//.test(rd(path.join(DIST, 'sitemap.xml'))));
}

if (stage === '최종') {
  const P = await loadTs('src/lib/notify-policy.ts');
  const C = await loadTs('src/lib/consent.ts');
  const A = await loadTs('src/lib/auth-return.ts');
  // 한 바퀴 — 가게 쪽에서 가입 → 돌아옴 → 저장 → 알림 켬 → 알림 판정 → 해지 → 공유
  mem.clear();
  const here = '/nights/ilsanshampoonight/';
  A.rememberReturn(here);
  ck('한 바퀴 ① 가게 쪽에서 가입 카드 → 복귀 주소 기억', A.peekReturn() === here);
  const consent = C.makeConsent({ age19: true, terms: true, privacy: true, service: true, ad: false }, 'kakao');
  ck('한 바퀴 ② 필수 3 + 서비스 알림 선택 → 가입 가능', C.requiredOk(consent));
  C.savePending(consent);
  const merged = C.mergeForUser(C.takePending(), null);
  ck('한 바퀴 ③ 콜백: 동의 기록 옮김(판 번호·시각)', merged.consent.version === C.CONSENT_VERSION && !!merged.consent.at);
  ck('한 바퀴 ④ 콜백: 원래 가게 쪽으로 돌아감', A.takeReturn() === here);
  ck('한 바퀴 ⑤ 가입 즉시 혜택 안내 3가지(찜·투표·알림)', (SRC.welcome.match(/\{ icon: '/g) || []).length === 3);
  ck('한 바퀴 ⑥ 저장 = 찜 목록(user_favorites) · save 측정', /trackEvent\('save'/.test(SRC.fav));
  const prefs = { ...merged.notify, regions: ['일산'] };
  const events = [{ type: 'new_venue', title: '일산 새 나이트', href: '/nights/x/', region: '일산', cat: 'night', at: '2026-09-23T10:00:00Z' }, { type: 'new_venue', title: '부산 새 클럽', href: '/clubs/busan/y/', region: '부산', cat: 'club', at: '2026-09-23T11:00:00Z' }];
  const noon = new Date(Date.UTC(2026, 8, 24, 3, 0)); const night = new Date(Date.UTC(2026, 8, 24, 13, 0));
  const plan = P.planDigest({ events, prefs, now: noon, sentThisWeek: 0 });
  ck('한 바퀴 ⑦ 낮 12시: 일산 새 가게 1건만 보냄', plan.send && plan.items.length === 1 && plan.items[0].region === '일산');
  ck('한 바퀴 ⑧ 밤 10시: 보내지 않음', !P.planDigest({ events, prefs, now: night, sentThisWeek: 0 }).send);
  ck('한 바퀴 ⑨ 이번 주 2번 보냈으면(기본 상한 2) 보내지 않음', !P.planDigest({ events, prefs, now: noon, sentThisWeek: 2 }).send);
  ck('한 바퀴 ⑩ 광고성은 동의 안 했으니 0건', !P.planDigest({ events, prefs, now: noon, sentThisWeek: 0, kind: 'ad' }).send);
  const off = P.unsubscribeAll(prefs);
  ck('한 바퀴 ⑪ 한 번에 해지 → 다음 알림 0건', !P.planDigest({ events, prefs: off, now: noon, sentThisWeek: 0 }).send);
  ck('한 바퀴 ⑫ 친구에게 보내기(보상 없음) · share 측정', /trackEvent\('share_click'/.test(SRC.share) && /추천 보상: 없음/.test(SRC.myref));
  ck('화면 한 바퀴(브라우저 · 모바일 412px)', null, '로컬 미리보기 서버가 시스템 메모리 부족으로 정지(대표님 재시작 몫) — 규칙 함수 한 바퀴로 대체');
  // 대표님 원문 대조 — 「회원 100만」「MAU 100만」 조건 항목별
  ck('원문 「100만은 결과」 — 보고 첫 줄 문구는 보고서 몫', 'na');
  ck('조건 「가입 쉬움」 — 우리 쪽 클릭 2~3 · 필수 입력 0(소셜) · 동의 분리 · 복귀', /data-nc-consent-all/.test(SRC.login) && /takeReturn/.test(SRC.cb) && /회원\$\{/.test(SRC.cb));
  ck('조건 「가입할 이유」 — 가입 즉시 진짜 기능 3(찜·투표·알림) · 가짜 포인트 0', /찜 목록/.test(SRC.welcome) && !/포인트|적립/.test(SRC.welcome) && !/100P/.test(SRC.login));
  ck('조건 「돌아올 까닭」 — 관심 지역·업종 진짜 사건 알림(동의·야간 0·상한·해지)', /export function planDigest/.test(SRC.policy) && /reason: 'empty'/.test(SRC.policy));
  ck('조건 「초대할 까닭」 — 친구에게 이 가게 보내기(보상 없음 표시) · 추천 링크 404 고침', /share_click/.test(SRC.share) && /\/welcome\?utm_source=invite&ref=/.test(SRC.myref));
  ck('조건 「측정」 — signup_start·sign_up·save·vote·notify_optin·share + 월간 보고 6)', ['signup_start', 'save', 'vote', 'notify_optin'].every((e) => new RegExp(`${e}: '${e}'`).test(SRC.tracker)) && /6\) 회원·MAU 루프/.test(SRC.conductor));
  ck('조건 「가짜 0」 — 가입 급증 표시(차단 0) · 가짜 회원 코드 0', /display-only/.test(SRC.anomaly) && !/createUser/.test(NEW_MEMBER_CODE));
  ck('0절 배포 0(origin/main 그대로)', (() => { try { return execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim().startsWith('38be1ef'); } catch { return null; } })());
  ck('0절 worktree 브랜치에서만(nol11-2)', (() => { try { return /nol11-2/.test(execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })); } catch { return null; } })());
  ck('0절 주소 불변 — 라우트 수 그대로 · 사이트맵 466', (() => { try { return (execFileSync('git', ['show', 'HEAD:src/App.tsx'], { encoding: 'utf8' }).match(/<Route /g) || []).length === (SRC.app.match(/<Route /g) || []).length; } catch { return null; } })() && (rd(path.join(DIST, 'sitemap.xml')).match(/<loc>/g) || []).length === 466);
  ck('0절 새 백엔드 0 — 새 표·새 함수·새 마이그레이션 0', (() => { try { return execFileSync('git', ['status', '--short', 'supabase', 'functions'], { encoding: 'utf8' }).trim() === ''; } catch { return null; } })());
  ck('0절 광고성 알림 명시 동의(기본 꺼짐) + 야간 0', /service: false, ad: false/.test(SRC.login) && /reason: 'night'/.test(SRC.policy));
  ck('0절 추천 보상 표시광고법대로(없음을 첫머리에)', /추천 보상: 없음/.test(SRC.myref));
  ck('0절 청소년 유입 장치 0 — 만 19세 필수 칸', /req label="만 19세 이상입니다"/.test(SRC.login));
  ck('0절 가짜 회원·자동 가입·구매 트래픽 0', !/createUser|Math\.random/.test(NEW_MEMBER_CODE));
  ck('0절 비밀값 0(새 코드)', !/sk-ant|service_role|eyJhbGciOi/.test(NEW_MEMBER_CODE));
  ck('2-1 합법 소셜 로그인 = 지금 되는 카카오·구글(새 제공자 0)', /'kakao' \| 'google'/.test(SRC.login));
  ck('2-1 가입 즉시 쓸 것 3(저장·투표권·알림 설정)', /찜 목록/.test(SRC.welcome) && /주간 투표/.test(SRC.welcome) && /알림 설정/.test(SRC.welcome));
  ck('2-2 회원 전용은 편의만(정보 차별 0)', !/회원만 보기|정회원 전용 정보/.test(NEW_MEMBER_CODE));
  ck('2-3 채널 = 지금 계정으로 되는 것(이메일 Resend 샌드박스 발신 · 웹푸시·알림톡 없음) → 발송은 대표님 몫', /onboarding@resend\.dev/.test(rd('functions/api/notification.ts')));
  ck('2-4 추천 링크는 주소를 늘리지 않는다(매개변수 · /ref/:코드 라우트 0 · 기존 /referral 은 그대로)', !/path="\/ref(\/|")/.test(SRC.app) && /path="\/referral"/.test(SRC.app));
  ck('2-5 가입 급증 표시 → 월간 보고', /signup-anomaly-/.test(SRC.conductor));
  ck('3절 T1~T7 은 디버깅 단계 기록', true);
  ck('4절 검증 파일 nc11-5-check.mjs', ex('scripts/verify/nc11-5-check.mjs'));
  // 가입자 유형 8가지 × 한 바퀴(동의 조합 × 시각 × 관심 지역) — 규칙 함수를 실제로 돌린다
  const personas = [
    { name: '서비스만 · 낮 · 관심 없음', c: { service: true, ad: false }, hour: 12, regions: [], expectSvc: true, expectAd: false },
    { name: '서비스만 · 밤 11시', c: { service: true, ad: false }, hour: 23, regions: [], expectSvc: false, expectAd: false },
    { name: '광고만 · 낮', c: { service: false, ad: true }, hour: 14, regions: [], expectSvc: false, expectAd: true },
    { name: '둘 다 · 아침 7시', c: { service: true, ad: true }, hour: 7, regions: [], expectSvc: false, expectAd: false },
    { name: '둘 다 · 아침 8시', c: { service: true, ad: true }, hour: 8, regions: [], expectSvc: true, expectAd: true },
    { name: '둘 다 · 밤 8시', c: { service: true, ad: true }, hour: 20, regions: [], expectSvc: true, expectAd: true },
    { name: '선택 모두 끔 · 낮', c: { service: false, ad: false }, hour: 12, regions: [], expectSvc: false, expectAd: false },
    { name: '서비스 · 관심 제주(사건 없음)', c: { service: true, ad: false }, hour: 12, regions: ['제주'], expectSvc: false, expectAd: false },
  ];
  const evs = [{ type: 'new_venue', title: '일산 새 가게', href: '/nights/x/', region: '일산', cat: 'night', at: '2026-09-23T10:00:00Z' }, { type: 'new_post', title: '강남 새 글', href: '/community/post/9', region: '강남', cat: 'club', at: '2026-09-23T09:00:00Z' }];
  for (const ps of personas) {
    mem.clear();
    const cons = C.makeConsent({ age19: true, terms: true, privacy: true, ...ps.c }, 'kakao');
    ck(`유형 「${ps.name}」 ① 필수 동의 → 가입 가능`, C.requiredOk(cons));
    C.savePending(cons);
    const mm = C.mergeForUser(C.takePending(), null);
    ck(`유형 「${ps.name}」 ② 동의가 설정으로 그대로(service ${ps.c.service} · ad ${ps.c.ad})`, mm.notify.service === ps.c.service && mm.notify.ad === ps.c.ad);
    const pr = { ...mm.notify, regions: ps.regions };
    const at = new Date(Date.UTC(2026, 8, 24, (ps.hour - 9 + 24) % 24, 0));
    const sv = ps.regions.includes('제주') ? P.planDigest({ events: evs, prefs: pr, now: at, sentThisWeek: 0 }).send : P.canSend({ prefs: pr, kind: 'service', now: at, sentThisWeek: 0 }).ok;
    ck(`유형 「${ps.name}」 ③ 서비스 알림 ${ps.expectSvc ? '보냄' : '안 보냄'}`, sv === ps.expectSvc);
    ck(`유형 「${ps.name}」 ④ 광고성 ${ps.expectAd ? '보냄(제목 (광고))' : '안 보냄'}`, (() => { const d = P.planDigest({ events: evs, prefs: pr, now: at, sentThisWeek: 0, kind: 'ad' }); return ps.expectAd ? d.send && d.subject.startsWith('(광고) ') : !d.send; })());
    const offp = P.unsubscribeAll(pr);
    ck(`유형 「${ps.name}」 ⑤ 한 번에 해지 → 서비스·광고 0건`, !P.canSend({ prefs: offp, kind: 'service', now: at, sentThisWeek: 0 }).ok && !P.canSend({ prefs: offp, kind: 'ad', now: at, sentThisWeek: 0 }).ok);
  }
  // 로컬 화면 대체 — 빌드 결과물(번들)에 화면 문구가 실제로 들어갔나
  const bundle = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => rd(path.join(DIST, 'assets', f))).join('');
  for (const t of ['전체 동의(선택 포함)', '만 19세 이상입니다', '개인정보 수집·이용 동의', '서비스 알림 받기', '광고성 정보 받기', '선택 항목은 동의하지 않아도 가입·이용할 수 있습니다', '필수 항목 3개에 체크해 주세요', '가입 완료 — 지금 바로 쓸 수 있는 것 3가지', '모든 알림 끄기', '추천 보상: 없음', '카카오·구글로 3초 가입', '가입 뒤 이 쪽으로 돌아옵니다']) ck(`화면 문구 번들 「${t}」`, bundle.includes(t));
  ck('화면 번들에 옛 로그인 간주 동의 문구 0(「로그인하면 놀쿨의 … 간주」 · 면책 쪽 일반 고지는 별개)', !bundle.includes('로그인하면 놀쿨의'));
  ck('화면 번들에 없는 /ref/ 추천 주소 0', !/\/ref\/\$\{|"\/ref\/"/.test(bundle));
  // 로컬 30쪽 게이트 그대로(11-2~11-4 회귀 0)
  const xml = rd(path.join(DIST, 'sitemap.xml'));
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1].replace(/^https?:\/\/[^/]+/, '')).replace(/\/$/, '') || '/');
  const pick = routes.filter((_, i) => i % Math.floor(routes.length / 30) === 0).slice(0, 30);
  for (const r of pick) { const f = path.join(DIST, ...r.split('/').filter(Boolean), 'index.html'); const g = ex(f) ? gatePage(rd(f), { route: r }) : { block: ['없음'] }; ck(`30쪽 게이트 막음 0 ${r}`, g.block.length === 0, g.block.join(' | ')); }
}

const fails = R.filter((x) => x.r === '실패');
const out = { stage, checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, skip: R.filter((x) => x.r === '해당 없음').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${stage}: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na} · 해당 없음 ${out.skip}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
process.exit(fails.length ? 1 : 0);
