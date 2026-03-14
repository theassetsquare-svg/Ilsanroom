'use client';

import dynamic from 'next/dynamic';

const AlcoholCalculator = dynamic(() => import('@/components/interactive/SafetyTools').then((m) => ({ default: m.AlcoholCalculator })), { ssr: false });
const EmergencyContacts = dynamic(() => import('@/components/interactive/SafetyTools').then((m) => ({ default: m.EmergencyContacts })), { ssr: false });
const LastTrainInfo = dynamic(() => import('@/components/interactive/SafetyTools').then((m) => ({ default: m.LastTrainInfo })), { ssr: false });
const QuickDriverCall = dynamic(() => import('@/components/interactive/KillerFeatures').then((m) => ({ default: m.QuickDriverCall })), { ssr: false });
const HangoverFood = dynamic(() => import('@/components/interactive/KillerFeatures').then((m) => ({ default: m.HangoverFood })), { ssr: false });

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">안전 가이드</h1>
        <p className="text-neon-text-muted">안전한 밤 문화를 위한 필수 도구와 정보</p>
      </div>

      {/* 긴급 연락처 */}
      <EmergencyContacts />

      {/* 음주 계산기 */}
      <AlcoholCalculator />

      {/* 막차 정보 */}
      <LastTrainInfo />

      {/* 안전 수칙 */}
      <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
        <h3 className="text-lg font-bold text-neon-text mb-4">안전 수칙</h3>
        <div className="space-y-3 text-sm text-neon-text-muted">
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>음주 후 절대 운전하지 마세요. 대리운전, 택시, 심야버스를 이용하세요.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>소지품(지갑, 핸드폰, 가방)은 항상 본인이 직접 관리하세요.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>함께 온 친구와 연락을 유지하고, 혼자 이동하지 마세요.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>자리를 비운 사이 음료를 다시 마시지 마세요.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>불쾌한 상황이 발생하면 즉시 직원이나 경찰(112)에 도움을 요청하세요.</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="shrink-0 text-neon-green">●</span>
            <p>귀가 전 가족이나 친구에게 현재 위치와 귀가 예정 시간을 알려주세요.</p>
          </div>
        </div>
      </div>
      {/* [T] 대리운전 원클릭 */}
      <QuickDriverCall />

      {/* [AG] 해장 맛집 */}
      <HangoverFood />
    </div>
  );
}
