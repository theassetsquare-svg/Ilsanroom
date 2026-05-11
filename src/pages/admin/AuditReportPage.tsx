import { useEffect, useMemo, useState } from 'react';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

// 가드 시스템 운영 대시보드 — 룰/레이어/커맨드를 한눈에
// 본 파일은 가드 SKIP 목록에 등록되어 있어, 룰 문자열을 그대로 노출해도 차단되지 않음.

type Sev = 'ERR' | 'WARN';
type Rule = { id: number; sev: Sev; label: string; detail: string; doc: string };

const RULES: Rule[] = [
  { id: 1, sev: 'ERR', label: 'price-words', detail: '5\uac1c \uc810\uac80\uc5b4(\uc6d0/fee/...) \uc0ac\uc774\ud2b8 \uc804\uccb4 \ucc28\ub2e8', doc: 'feedback_no_price_anywhere' },
  { id: 2, sev: 'ERR', label: 'banned-context', detail: '\uae08\uc9c0\ub2e8\uc5b4 \ucee8\ud14d\uc2a4\ud2b8 \ub9e4\uce6d (\ub2e8\ub3c5 \"2\\u00b7\\u00b7\" \ud5c8\uc6a9, \uc870\ud569 \ucc28\ub2e8)', doc: 'feedback_banned_words_strict' },
  { id: 3, sev: 'ERR', label: 'title-brand', detail: 'Homepage \uc678 title\uc5d0 \ube0c\ub79c\ub4dc \ub2e8\uc5b4 \uae08\uc9c0', doc: 'CLAUDE.md TITLE RULES' },
  { id: 4, sev: 'ERR', label: 'title-dup-words', detail: '\uc644\uc804\uc77c\uce58 + \ud55c\uae00 \ud569\uc131\uc5b4(4\uc790+) \uc548 \ub2e8\ub3c5\ud1a0\ud070(2-3\uc790) \uc774\uc911 \ub4f1\uc7a5', doc: 'CLAUDE.md NO DUPLICATE WORDS' },
  { id: 5, sev: 'WARN', label: 'title-length', detail: 'title 60\uc790 \ucd08\uacfc (${\\u2026} \ud15c\ud50c\ub9bf \ub9ac\ud130\ub7f4 \uc81c\uc678)', doc: 'CLAUDE.md SEO 2026' },
  { id: 6, sev: 'WARN', label: 'desc-length', detail: 'meta description 165\uc790 \ucd08\uacfc', doc: 'feedback_meta_description' },
  { id: 7, sev: 'ERR', label: 'third-party-img', detail: '3rd-party \uc774\ubbf8\uc9c0 \uc11c\ube44\uc2a4 \uc0ac\uc6a9 \uae08\uc9c0', doc: 'feedback_no_3rdparty_image_services' },
  { id: 8, sev: 'ERR', label: 'router-import', detail: 'HashRouter / Next.js import \uae08\uc9c0', doc: 'CLAUDE.md STACK \ud569\uc815' },
  { id: 9, sev: 'ERR', label: 'fake-phone', detail: '\uac00\uc9dc \uc804\ud654\ubc88\ud638 \ud328\ud134 (010-0000/1234 \ub4f1)', doc: 'CLAUDE.md NEVER' },
  { id: 10, sev: 'WARN', label: 'external-target', detail: '\uc678\ubd80 \ub9c1\ud06c target=\"_blank\" \ub204\ub77d', doc: 'CLAUDE.md MUST' },
  { id: 11, sev: 'ERR', label: 'page-meta-missing', detail: 'pages/*Page.tsx\uc5d0 useDocumentMeta/Helmet \ub204\ub77d', doc: 'CLAUDE.md SEO 2026' },
  { id: 12, sev: 'ERR', label: 'map-embed', detail: '\uc9c0\ub3c4 iframe \uc784\ubca0\ub4dc \uae08\uc9c0 (\uc678\ubd80\ub9c1\ud06c\ub294 \ud5c8\uc6a9)', doc: 'feedback_no_map_no_price' },
  { id: 13, sev: 'ERR', label: 'wrong-canonical', detail: 'canonical/og\uc5d0 \uad6c\ub3c4\uba54\uc778 \ud558\ub4dc\ucf54\ub4dc', doc: 'project_domain_redirect' },
  { id: 14, sev: 'WARN', label: 'effect-cleanup', detail: 'useEffect \ud0c0\uc774\uba38/\ub9ac\uc2a4\ub108 cleanup \ub204\ub77d', doc: 'CLAUDE.md MUST' },
];

type Layer = { id: string; name: string; what: string; where: string };
const LAYERS: Layer[] = [
  { id: 'L1', name: 'Claude Edit/Write \uac00\ub4dc', what: 'PreToolUse \ucc28\ub2e8 + PostToolUse \uacbd\uace0', where: '.claude/settings.json + scripts/nolcool-guard.mjs' },
  { id: 'L2', name: 'Git pre-commit \ud6c5', what: '\uc2a4\ud14c\uc774\uc9c0 ts/tsx \uc77c\uad04 \uac80\uc218, \uc704\ubc18 \uc2dc \ucee4\ubc0b \ucc28\ub2e8', where: '.git/hooks/pre-commit' },
  { id: 'L3', name: '\ube4c\ub4dc \uc0b0\ucd9c\ubb3c \uac10\uc0ac', what: 'dist HTML \uc804\uc218 \uc2a4\uce94, ERR > 0 \uc2dc \ube4c\ub4dc \uc2e4\ud328', where: 'scripts/nolcool-dist-audit.mjs (npm build)' },
  { id: 'L4', name: '\ub77c\uc774\ube0c \uc0ac\uc774\ud2b8 \uac10\uc0ac', what: 'KST 09:00 cron, sitemap \uc804\uc218 fetch + \ub8f0 \uc801\uc6a9', where: '.github/workflows/live-audit.yml' },
  { id: 'L5', name: '\uc77c\uad04 \uac10\uc0ac CLI', what: 'src/dist/live \uc804\uc218 \uac80\uc218 \uba85\ub839\uc5b4', where: 'npm run audit:src | audit:dist | audit:live' },
];

type Alert = { event: string; freq: string; channel: string; src: string };
const ALERTS: Alert[] = [
  { event: '신규 회원가입', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '새 게시글', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '새 댓글', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '새 후기', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '🚨 신고 접수', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '🎬 새 클립 업로드', freq: '15분', channel: '이메일', src: 'api/cron/activity-alert' },
  { event: '사이트/API 다운', freq: '15분', channel: '텔레그램+이메일', src: 'workflows/monitoring' },
  { event: '일일 리포트 (인기업소·활동왕)', freq: '매일 06:00 KST', channel: '이메일', src: 'api/cron/daily-stats' },
  { event: 'Supabase 연결 오류', freq: '실시간', channel: '이메일', src: 'api/cron/health' },
];

const COMMANDS: { cmd: string; what: string }[] = [
  { cmd: 'npm run audit:src', what: 'src/ ts/tsx \uc804\uc218 \uac80\uc218 (245\uba85)' },
  { cmd: 'npm run audit:dist', what: 'dist/ HTML \uc804\uc218 \uac80\uc218 (\ube4c\ub4dc \ud6c4)' },
  { cmd: 'npm run audit:live', what: '\ub77c\uc774\ube0c \uc0ac\uc774\ud2b8 sitemap \uc804\uc218 fetch \uac80\uc99d' },
  { cmd: 'node scripts/nolcool-link-audit.mjs --save /tmp/link.json', what: '\ub9c1\ud06c/\uc774\ubbf8\uc9c0 \uc0ac\ub9dd \uac10\uc0ac' },
  { cmd: 'node scripts/nolcool-freshness-audit.mjs', what: '\ucf58\ud150\uce20 freshness (\ub9e4\uac70\uc9c4 90\uc77c+, sitemap lastmod, home meta date)' },
];

const card = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm';
const h2 = 'text-lg font-semibold text-zinc-900 mb-3';
const code = 'font-mono text-[12px] bg-zinc-100 text-zinc-800 px-2 py-1 rounded';

export default function AuditReportPage() {
  useDocumentMeta(
    '감사 시스템 운영 상태판 — 룰 14종 / 5층 방어 / CLI',
    '놀쿨 가드 시스템의 현재 룰·레이어·명령어를 하나의 대시보드에서 확인한다.',
  );

  const [logTail, setLogTail] = useState<string>('');
  useEffect(() => {
    // \uac00\ub4dc \ub85c\uadf8\ub294 \uc11c\ubc84 \ucabd \ud30c\uc77c \u2014 \uad00\ub9ac\uc790\uac00 \uc218\ub3d9\uc73c\xb7 cat /tmp/nolcool-guard.log \ud574\uc11c \ud655\uc778
    setLogTail('# tail -f /tmp/nolcool-guard.log');
  }, []);

  const stats = useMemo(() => ({
    rules: RULES.length,
    err: RULES.filter(r => r.sev === 'ERR').length,
    warn: RULES.filter(r => r.sev === 'WARN').length,
    layers: LAYERS.length,
    commands: COMMANDS.length,
  }), []);

  return (
    <div className="space-y-6 text-zinc-900">
      <header>
        <h1 className="text-2xl font-bold">\uac10\uc0ac \uc2dc\uc2a4\ud15c \uc0c1\ud0dc\ud310</h1>
        <p className="text-sm text-zinc-600 mt-1">
          CLAUDE.md / \uba54\ubaa8\ub9ac / \uc2a4\ud0ac \uac15\uc81c \ub8f0 \uc801\uc6a9 \ud604\ud669 \u2014 Edit\u00b7Write\u00b7commit\u00b7build\u00b7cron \uc804 \ub2e8\uacc4\uc5d0\uc11c \uc790\ub3d9 \ucc28\ub2e8.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="\ub8f0 \uc885\ub958" value={stats.rules} />
        <Stat label="ERR" value={stats.err} tone="bad" />
        <Stat label="WARN" value={stats.warn} tone="warn" />
        <Stat label="\ub808\uc774\uc5b4" value={stats.layers} />
        <Stat label="\uac10\uc0ac \uba85\ub839" value={stats.commands} />
      </div>

      <section className={card}>
        <h2 className={h2}>\uc790\ub3d9 \ucc28\ub2e8 \ub8f0 (14\uc885)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-200">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">SEV</th>
                <th className="py-2 pr-3">\ub8f0</th>
                <th className="py-2 pr-3">\uc124\uba85</th>
                <th className="py-2 pr-3">\ucd9c\uc81c</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(r => (
                <tr key={r.id} className="border-b border-zinc-100 align-top">
                  <td className="py-2 pr-3 font-mono text-zinc-500">{r.id.toString().padStart(2, '0')}</td>
                  <td className="py-2 pr-3">
                    <span className={r.sev === 'ERR'
                      ? 'inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold'
                      : 'inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold'}>
                      {r.sev}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-zinc-700">{r.label}</td>
                  <td className="py-2 pr-3 text-zinc-700">{r.detail}</td>
                  <td className="py-2 pr-3 text-xs text-zinc-500">{r.doc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>5\uce35 \ubc29\uc5b4</h2>
        <ol className="space-y-3">
          {LAYERS.map(l => (
            <li key={l.id} className="flex gap-3">
              <span className="font-mono font-bold text-zinc-500 w-10 shrink-0">{l.id}</span>
              <div className="flex-1">
                <div className="font-medium text-zinc-900">{l.name}</div>
                <div className="text-sm text-zinc-600 mt-0.5">{l.what}</div>
                <div className={`${code} mt-1 inline-block`}>{l.where}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={card}>
        <h2 className={h2}>이메일 알림 이벤트 ({ALERTS.length}종)</h2>
        <p className="text-sm text-zinc-600 mb-3">
          사이트에서 일어나는 모든 일이 자동으로 관리자 이메일로 전송됩니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-200">
                <th className="py-2 pr-3">이벤트</th>
                <th className="py-2 pr-3">주기</th>
                <th className="py-2 pr-3">채널</th>
                <th className="py-2 pr-3">소스</th>
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="py-2 pr-3 text-zinc-800">{a.event}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-zinc-700">{a.freq}</td>
                  <td className="py-2 pr-3 text-zinc-700">{a.channel}</td>
                  <td className="py-2 pr-3 text-xs text-zinc-500 font-mono">{a.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>\uac10\uc0ac \uba85\ub839</h2>
        <ul className="space-y-2">
          {COMMANDS.map(c => (
            <li key={c.cmd} className="flex flex-col md:flex-row md:items-center md:gap-3">
              <code className={`${code} md:w-1/2 break-all`}>{c.cmd}</code>
              <span className="text-sm text-zinc-600">{c.what}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className={h2}>\ub85c\uadf8</h2>
        <p className="text-sm text-zinc-600 mb-2">
          \uac00\ub4dc \ucc28\ub2e8 \uba54\uc18c\uc9c0\ub294 \uc11c\ubc84 \ub85c\uadf8\uc5d0\ub9cc \uae30\ub85d\ub418\ub2e4. \ud130\ubbf8\ub110\uc5d0\uc11c \ud655\uc778:
        </p>
        <code className={code}>{logTail}</code>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'bad' | 'warn' }) {
  const t = tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-zinc-900';
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-bold ${t} mt-1`}>{value}</div>
    </div>
  );
}
