/**
 * CSP 위반 리포트 수신 — csp_reports 테이블에 유니크 위반만 누적
 * POST /api/csp-report
 *
 * 두 포맷 모두 처리:
 *   · report-to (모던): Content-Type application/reports+json → 배열 [{type,body}]
 *   · report-uri (레거시): Content-Type application/csp-report → {"csp-report":{...}}
 *
 * Report-Only 전용 수집처. 페이지 렌더링과 완전 분리 → 사이트 영향 0.
 * blocked_host/document_path만 저장(쿼리스트링·PII 미저장).
 *
 * 환경변수: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY (web-vitals와 동일, 이미 설정됨)
 */
interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface CspBody {
  'effective-directive'?: string;
  'violated-directive'?: string;
  effectiveDirective?: string;
  'blocked-uri'?: string;
  blockedURL?: string;
  'document-uri'?: string;
  documentURL?: string;
}

function hostOf(u: string): string {
  try { return new URL(u).host || u; } catch { return u; }
}
function pathOf(u: string): string {
  try { return new URL(u).pathname || u; } catch { return u; }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let raw: unknown;
  try { raw = await context.request.json(); } catch { return new Response(null, { status: 204 }); }

  const list = Array.isArray(raw) ? raw : [raw];
  const now = new Date().toISOString();
  const rows: Array<Record<string, string>> = [];

  for (const item of list) {
    const r = item as { body?: CspBody; 'csp-report'?: CspBody } & CspBody;
    const b: CspBody = r?.body ?? r?.['csp-report'] ?? (r as CspBody) ?? {};
    const directive = String(b['effective-directive'] || b['violated-directive'] || b.effectiveDirective || '').slice(0, 64);
    const blocked = String(b['blocked-uri'] || b.blockedURL || '');
    const doc = String(b['document-uri'] || b.documentURL || '');
    const blocked_host = hostOf(blocked).slice(0, 128);
    const document_path = pathOf(doc).slice(0, 128);
    if (!directive && !blocked_host) continue;
    rows.push({ effective_directive: directive, blocked_host, document_path, last_seen: now });
  }

  if (rows.length) {
    try {
      await fetch(
        `${context.env.VITE_SUPABASE_URL}/rest/v1/csp_reports?on_conflict=effective_directive,blocked_host,document_path`,
        {
          method: 'POST',
          headers: {
            apikey: context.env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify(rows),
        },
      );
    } catch {
      /* 수집 실패는 응답/사이트에 영향 없음 */
    }
  }

  return new Response(null, { status: 204 });
};
