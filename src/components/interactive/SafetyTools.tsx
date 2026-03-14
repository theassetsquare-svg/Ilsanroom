'use client';

import { useState } from 'react';

export function AlcoholCalculator() {
  const [weight, setWeight] = useState('');
  const [drinks, setDrinks] = useState('');
  const [hours, setHours] = useState('');

  // Widmark formula simplified
  const bac = weight && drinks && hours
    ? Math.max(0, (Number(drinks) * 10 / (Number(weight) * 0.68)) - (0.015 * Number(hours)))
    : 0;
  const bacPercent = (bac * 100).toFixed(3);
  const canDrive = bac < 0.03;

  return (
    <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-4">음주 계산기</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">체중 (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70"
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">음주량 (잔)</label>
          <input type="number" value={drinks} onChange={(e) => setDrinks(e.target.value)} placeholder="3"
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">경과시간 (h)</label>
          <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="2"
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
        </div>
      </div>
      {weight && drinks && (
        <div className={`rounded-xl p-4 text-center ${canDrive ? 'bg-neon-green/10' : 'bg-neon-red/10'}`}>
          <p className="text-sm text-neon-text-muted">추정 혈중알코올농도</p>
          <p className={`text-2xl font-bold ${canDrive ? 'text-neon-green' : 'text-neon-red'}`}>{bacPercent}%</p>
          <p className={`text-xs ${canDrive ? 'text-neon-green' : 'text-neon-red'}`}>
            {canDrive ? '법적 기준 이하 (0.03% 미만)' : '운전 금지! 대리운전 또는 택시를 이용하세요'}
          </p>
        </div>
      )}
      <p className="mt-3 text-[10px] text-neon-text-muted/60">※ 참고용 계산입니다. 정확한 혈중알코올농도는 개인차가 있습니다. 음주 후에는 절대 운전하지 마세요.</p>
    </div>
  );
}

export function EmergencyContacts() {
  const contacts = [
    { name: '경찰 (112)', number: '112', color: 'bg-blue-600' },
    { name: '소방/구급 (119)', number: '119', color: 'bg-neon-red' },
    { name: '여성긴급전화 (1366)', number: '1366', color: 'bg-neon-pink' },
    { name: '음주운전 신고 (112)', number: '112', color: 'bg-neon-gold' },
  ];

  return (
    <div className="rounded-2xl border border-neon-red/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-4">긴급 연락처 SOS</h3>
      <div className="grid grid-cols-2 gap-3">
        {contacts.map((c) => (
          <a
            key={c.number + c.name}
            href={`tel:${c.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 rounded-xl ${c.color}/10 border border-neon-border px-4 py-3 transition hover:bg-neon-surface-2`}
            style={{ minHeight: '44px' }}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${c.color} text-white text-xs font-bold`}>SOS</span>
            <div>
              <p className="text-sm font-medium text-neon-text">{c.name}</p>
              <p className="text-xs text-neon-text-muted">{c.number}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function LastTrainInfo() {
  return (
    <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-4">막차 정보</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neon-text-muted">서울 지하철 막차</span>
          <span className="text-neon-text font-medium">23:30~00:00 (노선별 상이)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neon-text-muted">심야버스 (N버스)</span>
          <span className="text-neon-text font-medium">00:00~04:00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neon-text-muted">택시 할증 시간</span>
          <span className="text-neon-text font-medium">22:00~04:00 (20~40% 할증)</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <a href="https://map.kakao.com/" target="_blank" rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-[#FEE500] py-2 text-center text-xs font-medium text-neutral-900 transition hover:bg-[#FDD700]">카카오맵</a>
        <a href="https://map.naver.com/" target="_blank" rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-neon-green py-2 text-center text-xs font-medium text-white transition hover:bg-neon-green/90">네이버지도</a>
      </div>
    </div>
  );
}
