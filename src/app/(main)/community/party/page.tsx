'use client';

import { useState } from 'react';
import Link from "next/link";

// metadata moved to layout or handled differently for client component

const sampleParties = [
  {
    id: 1,
    title: "이번 토요일 강남 클럽 같이 가실 분!",
    author: "파티메이커",
    date: "2026-03-15",
    region: "강남",
    currentMembers: 3,
    maxMembers: 6,
    ageRange: "20대 중반~30대 초반",
    status: "모집중",
    comments: 12,
  },
  {
    id: 2,
    title: "홍대 클럽 투어 멤버 구합니다 (3/21)",
    author: "홍대가이드",
    date: "2026-03-21",
    region: "홍대",
    currentMembers: 4,
    maxMembers: 8,
    ageRange: "20대",
    status: "모집중",
    comments: 8,
  },
  {
    id: 3,
    title: "해운대 주말 파티 동행 모집",
    author: "부산파티",
    date: "2026-03-22",
    region: "해운대",
    currentMembers: 2,
    maxMembers: 5,
    ageRange: "20대~30대",
    status: "모집중",
    comments: 6,
  },
  {
    id: 4,
    title: "이태원 라운지 바 호핑 같이 하실 분",
    author: "이태원러버",
    date: "2026-03-16",
    region: "이태원",
    currentMembers: 5,
    maxMembers: 5,
    ageRange: "20대 후반~30대",
    status: "마감",
    comments: 15,
  },
  {
    id: 5,
    title: "청담 나이트 첫 방문 같이 가요",
    author: "나이트입문",
    date: "2026-03-29",
    region: "청담",
    currentMembers: 2,
    maxMembers: 4,
    ageRange: "30대",
    status: "모집중",
    comments: 4,
  },
];

function NbbangCalc() {
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState('');
  const perPerson = total && people && Number(people) > 0 ? Math.ceil(Number(total) / Number(people)) : 0;

  return (
    <div className="mb-8 rounded-2xl border border-neon-accent/30 bg-neon-surface p-5">
      <h3 className="mb-3 text-sm font-bold text-neon-accent">N빵 계산기</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">총 금액 (원)</label>
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="500000"
            className="w-32 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent" />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">인원 수</label>
          <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="4"
            className="w-20 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent" />
        </div>
        <div className="text-sm">
          {perPerson > 0 && (
            <span className="font-bold text-neon-accent">1인당 {perPerson.toLocaleString()}원</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartyRecruitPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">파티 모집</h1>
            <p className="mt-2 text-neon-text-muted">함께 즐길 파티 멤버를 찾아보세요</p>
          </div>
          <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
            모집글 작성
          </button>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-auto">
          {["전체", "강남", "홍대", "이태원", "청담", "해운대"].map((tab) => (
            <button
              key={tab}
              className="shrink-0 rounded-lg bg-neon-surface px-4 py-2 text-sm text-neon-text-muted transition hover:bg-neon-surface-2 hover:text-neon-text first:bg-neon-primary first:text-neon-text"
            >
              {tab}
            </button>
          ))}
        </div>

        <NbbangCalc />

        <div className="space-y-4">
          {sampleParties.map((party) => (
            <div
              key={party.id}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-border"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        party.status === "모집중"
                          ? "bg-neon-green/10 text-neon-green"
                          : "bg-neon-surface-2 text-neon-text-muted"
                      }`}
                    >
                      {party.status}
                    </span>
                    <span className="rounded-full bg-neon-primary-light/10 px-2 py-0.5 text-xs text-neon-primary-light">
                      {party.region}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{party.title}</h3>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-neon-text-muted">
                <span>📅 {party.date}</span>
                <span>👥 {party.currentMembers}/{party.maxMembers}명</span>
                <span>🎂 {party.ageRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {Array.from({ length: party.currentMembers }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-900 bg-neon-surface-2 text-xs"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neon-text-muted">💬 {party.comments}</span>
                  {party.status === "모집중" && (
                    <button className="rounded-lg bg-neon-primary/20 px-4 py-1.5 text-xs font-medium text-neon-primary-light transition hover:bg-neon-primary/30">
                      참여 신청
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
