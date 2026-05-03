// 4주차: 신고 시스템 API
import { createClient } from './supabase';
import { notify } from './notify';

export type ReportReason = 'profanity' | 'spam' | 'false_info' | 'inappropriate' | 'other';
export type ReportTargetType = 'post' | 'comment' | 'user';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

const REASON_LABELS: Record<ReportReason, string> = {
  profanity: '욕설/비방',
  spam: '광고/스팸',
  false_info: '허위 정보',
  inappropriate: '부적절한 내용',
  other: '기타',
};

export function getReasonLabel(reason: ReportReason): string {
  return REASON_LABELS[reason] || reason;
}

export async function submitReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    description: params.description || null,
  });

  if (error) {
    if (error.code === '23505') return { error: '이미 신고한 내용입니다' };
    return { error: error.message };
  }

  notify({
    action: 'report',
    postId: `${params.targetType}:${params.targetId}`,
    reason: `${getReasonLabel(params.reason)}${params.description ? ` — ${params.description}` : ''}`,
    reporterEmail: user.email || undefined,
  });

  return { success: true };
}

export async function fetchReports(status?: string): Promise<Report[]> {
  const supabase = createClient();
  if (!supabase) return [];

  let query = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);

  const { data } = await query;
  return (data || []) as Report[];
}

export async function resolveReport(reportId: string, action: 'resolved' | 'dismissed'): Promise<{ error?: string }> {
  const supabase = createClient();
  if (!supabase) return { error: 'Supabase 연결 실패' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인 필요' };

  const { error } = await supabase.from('reports').update({
    status: action,
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  }).eq('id', reportId);

  if (error) return { error: error.message };
  return {};
}
