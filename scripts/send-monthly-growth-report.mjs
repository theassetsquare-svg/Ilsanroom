/**
 * 월간 성장 사이클 리포트 메일 (매달 1일 수동 사이클 마감 발송).
 * 수동 실행 전용 — monthly-growth-report.yml workflow_dispatch.
 * 읽기전용 발송 스크립트: 사이트/데이터 변경 0, Resend 메일 1통만.
 * 내용은 매월 사이클 실행 시 이 파일을 갱신한다.
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음'); process.exit(1); }

const td = 'border:1px solid #E5E7EB;padding:6px 8px;font-size:12px';
const th = td + ';background:#F9FAFB;font-weight:bold';
const h3 = 'margin:22px 0 8px;color:#111827;font-size:15px';
const p = 'font-size:13px;line-height:1.7;color:#374151;margin:6px 0';

const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px">
<h2 style="color:#7C3AED">놀쿨 월간 성장 사이클 리포트 — 2026년 7월분 (해결 완료 보고)</h2>
<p style="color:#666;font-size:12px">지난 28일 실측 데이터 기반 · 커밋 913a6c42 배포·라이브 검증 완료 · 사이트 피해 0(읽기전용 측정+카피 3곳 수정만)</p>

<h3 style="${h3}">① 리텐션(다시 찾아오는 손님 비율) 추이</h3>
<p style="${p}">· 재방문 비중 <b>5.4%</b> — 100명 오면 5~6명이 다시 옴.<br>
· 주간 코호트(같은 주에 처음 온 사람들을 묶어서 추적): 첫 주 1.3% → 2주차 이후 <b>약 0.7%에서 평탄화</b>(더 안 떨어지고 유지) — 얇지만 진짜 단골층이 생기고 있음.<br>
· 최근 7일 경고등: 끝까지읽기 10.3%(▼7.6%p 하락) · 이탈률(한 페이지만 보고 나감) 51.0%(▲7.6%p 악화) → 이번 달 레버 3번(완독 장치)이 이걸 겨냥.</p>

<h3 style="${h3}">② 6개 카테고리 성적표 (지난 28일)</h3>
<table style="border-collapse:collapse;width:100%">
<tr><td style="${th}">카테고리</td><td style="${th}">검색 클릭/노출/순위</td><td style="${th}">허브 세션·이탈·체류</td><td style="${th}">진단</td></tr>
<tr><td style="${td}">나이트</td><td style="${td}">647클릭 / 15,183노출 / 9.1위</td><td style="${td}">110 · 10% · 38초 · 재방문 3.6배</td><td style="${td}">★ 최강 (기준점)</td></tr>
<tr><td style="${td}">클럽</td><td style="${td}">27클릭 / 1,855노출 / 10.9위 · CTR(클릭률) 1.5%</td><td style="${td}">83 · 36.1% · 27초</td><td style="${td}">★ 최대 격차 → 이번 달 집중</td></tr>
<tr><td style="${td}">룸</td><td style="${td}">82클릭 / 1,011노출 / 9.0위</td><td style="${td}">48 · 4.2% · 13초</td><td style="${td}">양호 (일산룸 상세 70초)</td></tr>
<tr><td style="${td}">요정</td><td style="${td}">61클릭 / 1,084노출 / 10.3위</td><td style="${td}">46 · 4.3% · 26초</td><td style="${td}">명월관 노출 1,029인데 클릭률 4.4% → 레버 2번</td></tr>
<tr><td style="${td}">호빠</td><td style="${td}">47클릭 / 637노출 / 14.6위</td><td style="${td}">51 · 11.8% · 25초</td><td style="${td}">순위 최하 — 지난주 이름변형(alias) 보강분 측정 대기</td></tr>
<tr><td style="${td}">라운지</td><td style="${td}">5클릭 / 176노출 / 11.4위</td><td style="${td}">40 · 2.5% · 15초</td><td style="${td}">검색 수요 자체가 최소</td></tr>
</table>

<h3 style="${h3}">③ 이번 달 격차 메우기 레버 3개 (전부 배포·라이브 확인 완료)</h3>
<p style="${p}"><b>레버 1 — 클럽 허브에 '나이트 승자 요소' 이식.</b> 나이트 페이지가 잘 되는 이유(실제 가게 이름을 동네별로 나열한 문단)를 클럽 목록 페이지에 똑같이 적용. 실존 업소명만 사용, 창작 0. 키워드 밀도 2.24%(허용 범위 안).<br>
<b>레버 2 — 노출은 많은데 클릭 안 되는 2곳 설명문 수술.</b> 일산명월관(노출 1,029)과 부산연산동물나이트의 검색결과 설명문(desc)이 키워드를 억지로 3번씩 반복하는 스터핑(구겨넣기) 문장이라 클릭이 안 됐음 → 자연스러운 문장으로 재작성. 자동 감시 프로그램(watch)의 기준도 같은 커밋에서 동기화해 거짓 경보 0 — 배포 후 두 감시 모두 통과 확인.<br>
<b>레버 3 — 끝까지 읽게 만드는 장치 2개.</b> 화면 위 보라색 읽기 진행바 + 매거진 글마다 목차(순서표) 자동 생성(글 속 제목에서만 뽑음, 새 문장 창작 0). 라이브에서 목차 9개 버튼·콘솔 에러 0 확인.</p>

<h3 style="${h3}">④ 다음 달 1일 판정 기준 (기존 자동 측정이 그대로 잡아줌, 새 크롤 0)</h3>
<p style="${p}">· 클럽 클릭률 1.5% → 상승했는가<br>
· 클럽 허브 이탈률 36.1% → 내려갔는가<br>
· 일산명월관 클릭률 4.4% → 상승했는가<br>
· 끝까지읽기 10.3% → 회복했는가 / 매거진 체류시간 → 올랐는가</p>

<h3 style="${h3}">⑤ 기여 0 제거 후보 (지금은 보고만, 삭제 0 — 대표님 확인 후 진행)</h3>
<p style="${p}">1. 코드 속 안 쓰는 부품 2개(WritePostModal·HomeCommunityHub) — 어디서도 불러쓰지 않는 죽은 코드로 확정.<br>
2. /tonight 페이지 — 28일간 33세션·조회 5회.<br>
3. /lounge/hoppa/ — 29세션·조회 0회.<br>
4. /best/clubs — 들어오자마자 93.3%가 1초 만에 나감(단, 봇 착시 가능성 있어 병기). 참고: /community/free·/magazine의 '100% 이탈'은 직접 열어본 결과 페이지 정상 → 착시로 분류, 손대지 않음.</p>

<p style="color:#9CA3AF;font-size:11px;margin-top:24px">월간 성장 사이클 수동 실행 — send-monthly-growth-report.mjs · 정상 시 침묵, 이 메일은 해결 완료 보고 1통</p>
</div>`;

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'NOLCOOL auto <onboarding@resend.dev>',
    to: [TO],
    subject: '[놀쿨][✅] 7월 월간 성장 사이클 완료 — 레버 3개 배포 + 6카테고리 성적표 + 다음 달 판정 기준',
    html,
  }),
});
console.log('이메일 HTTP', r.status);
if (r.status !== 200) { console.error(await r.text()); process.exit(1); }
