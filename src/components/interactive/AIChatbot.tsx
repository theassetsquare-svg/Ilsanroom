'use client';

import { useState, useRef, useEffect } from 'react';
import { venues } from '@/data/venues';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  '오늘 강남에서 갈 만한 클럽 추천해줘',
  '일산에서 접대 장소 어디가 좋아?',
  '부산 나이트 추천해줘',
  '혼자 가기 좋은 곳은?',
  '20대가 즐길 수 있는 곳',
];

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');

  // Region match
  const regionMap: Record<string, string[]> = {
    강남: ['gangnam'], 홍대: ['hongdae'], 이태원: ['itaewon'], 일산: ['ilsan'],
    부산: ['busan'], 대구: ['daegu'], 수원: ['suwon'], 인천: ['incheon'],
  };
  for (const [keyword, regions] of Object.entries(regionMap)) {
    if (lower.includes(keyword)) {
      const matches = openVenues.filter((v) => regions.includes(v.region));
      if (matches.length > 0) {
        const top3 = matches.sort((a, b) => b.rating - a.rating).slice(0, 3);
        return `${keyword} 지역 추천 업소입니다:\n${top3.map((v) => `• ${v.nameKo} (${v.category === 'club' ? '클럽' : v.category === 'night' ? '나이트' : v.category === 'lounge' ? '라운지' : v.category === 'room' ? '룸' : v.category === 'yojeong' ? '요정' : '호빠'}) ★${v.rating}`).join('\n')}`;
      }
    }
  }

  // Category match
  if (lower.includes('클럽')) {
    const clubs = openVenues.filter((v) => v.category === 'club').sort((a, b) => b.rating - a.rating).slice(0, 3);
    return `인기 클럽 추천:\n${clubs.map((v) => `• ${v.nameKo} (${v.regionKo}) ★${v.rating}`).join('\n')}`;
  }
  if (lower.includes('나이트')) {
    const nights = openVenues.filter((v) => v.category === 'night').sort((a, b) => b.rating - a.rating).slice(0, 3);
    return `인기 나이트 추천:\n${nights.map((v) => `• ${v.nameKo} (${v.regionKo}) ★${v.rating}`).join('\n')}`;
  }
  if (lower.includes('접대') || lower.includes('요정') || lower.includes('한정식')) {
    return '접대 장소로는 일산명월관요정(신실장 010-3695-4929)을 추천합니다. 한정식 코스와 국악 라이브를 즐길 수 있는 격조 높은 요정입니다.';
  }
  if (lower.includes('룸') || lower.includes('프라이빗')) {
    return '프라이빗 룸으로는 일산룸(신실장 010-3695-4929)을 추천합니다. 비즈니스 미팅과 소규모 회식에 최적입니다.';
  }
  if (lower.includes('혼자') || lower.includes('혼클')) {
    return '혼자 가기 좋은 곳:\n• 라운지: 바 카운터에서 칵테일 즐기기\n• 클럽: 음악에 집중하며 자유롭게\n처음이라면 라운지부터 시작해보세요!';
  }
  if (lower.includes('20대') || lower.includes('젊은')) {
    const young = openVenues.filter((v) => v.category === 'club').sort((a, b) => b.rating - a.rating).slice(0, 3);
    return `20대에게 인기 있는 곳:\n${young.map((v) => `• ${v.nameKo} (${v.regionKo})`).join('\n')}`;
  }

  return '궁금한 지역이나 업종을 말씀해 주세요! 예: "강남 클럽 추천", "일산 접대 장소", "부산 나이트"';
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '안녕하세요! "오늘밤뭐하지?" AI입니다. 어떤 곳을 찾고 계신가요?' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    const botMsg: Message = { role: 'bot', text: getResponse(text) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <div className="rounded-2xl border border-neon-primary/30 bg-neon-surface overflow-hidden">
      <div className="bg-gradient-to-r from-neon-primary to-neon-accent px-5 py-3">
        <h3 className="text-sm font-bold text-white">오늘밤뭐하지? AI</h3>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${
              m.role === 'user' ? 'bg-neon-primary text-white' : 'bg-neon-surface-2 text-neon-text'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="border-t border-neon-border px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)}
            className="shrink-0 rounded-full border border-neon-border bg-neon-bg px-3 py-1 text-xs text-neon-text-muted hover:text-neon-text hover:border-neon-primary/40 transition">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-neon-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="지역, 업종, 분위기를 말씀해주세요"
          className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        />
        <button onClick={() => send(input)}
          className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-neon-primary-light">
          전송
        </button>
      </div>
    </div>
  );
}
