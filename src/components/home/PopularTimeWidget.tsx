'use client';

import { useState, useEffect } from 'react';

const timeSlots = [
  { range: '18:00~20:00', label: '저녁 코스', venues: ['일산명월관요정', '강남라운지아르쥬'], tip: '한정식 요정과 라운지가 오픈하는 시간. 접대와 저녁 모임에 최적.' },
  { range: '20:00~22:00', label: '본격 개장', venues: ['수원찬스돔', '청담H2O', '인천아라비안'], tip: '댄스홀이 본격 영업 시작. 일찍 가면 좋은 자리 확보 가능.' },
  { range: '22:00~00:00', label: '피크 타임', venues: ['강남레이스', '클럽NB2', '부산연산동물'], tip: '전 업종 가장 붐비는 시간대. 테이블 사전 예약 권장.' },
  { range: '00:00~02:00', label: '절정', venues: ['강남클럽사운드', '이태원클럽와이키키유토피아'], tip: '클럽 분위기 절정. EDM DJ 메인 세트 시간.' },
  { range: '02:00~04:00', label: '심야', venues: ['홍대클럽M2', '강남호빠로얄'], tip: '열정적인 클러버들의 시간. 호빠도 이 시간대 인기.' },
];

export default function PopularTimeWidget() {
  const [currentHour, setCurrentHour] = useState(22);

  useEffect(() => {
    setCurrentHour(new Date().getHours());
  }, []);

  const currentSlot = timeSlots.find((s) => {
    const [start] = s.range.split('~');
    const h = parseInt(start);
    return currentHour >= h && currentHour < h + 2;
  }) || timeSlots[2]; // default to peak

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="text-xl font-bold text-neon-text mb-2">오늘 인기 시간대</h2>
      <p className="text-sm text-neon-text-muted mb-6">지금 시간 기준 가장 핫한 업소</p>

      <div className="grid gap-3 sm:grid-cols-5">
        {timeSlots.map((slot) => {
          const isCurrent = slot.range === currentSlot.range;
          return (
            <div key={slot.range} className={`rounded-xl border p-4 transition-all ${isCurrent ? 'border-neon-pink bg-neon-pink/5 shadow-lg shadow-neon-pink/10' : 'border-neon-border bg-neon-surface'}`}>
              <p className={`text-xs font-bold mb-1 ${isCurrent ? 'text-neon-pink' : 'text-neon-text-muted'}`}>
                {isCurrent ? '🔴 NOW' : ''} {slot.range}
              </p>
              <p className={`text-sm font-semibold mb-2 ${isCurrent ? 'text-neon-text' : 'text-neon-text-muted'}`}>{slot.label}</p>
              <div className="space-y-1">
                {slot.venues.slice(0, 2).map((v) => (
                  <p key={v} className="text-[10px] text-neon-text-muted truncate">{v}</p>
                ))}
              </div>
              {isCurrent && <p className="mt-2 text-[10px] text-neon-pink/80">{slot.tip}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
