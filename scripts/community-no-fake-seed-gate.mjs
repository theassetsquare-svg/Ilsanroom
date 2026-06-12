#!/usr/bin/env node
/**
 * [화이트햇/F] 커뮤니티 가짜 시드 재유입 차단 게이트
 *
 * 커뮤니티는 100% 진짜 회원 글만 노출한다. DB가 비면 "정직한 빈 상태"를 보여줄 뿐,
 * 하드코딩한 가짜 글·가짜 닉네임·가짜 클립으로 사이트를 살아보이게 위장하지 않는다.
 * (가짜 활동 = #1 금지 + Google 활동조작 페널티 + 방문자 기만)
 *
 * 이 게이트는 한번 제거한 가짜 시드 패턴이 코드에 다시 들어오면 빌드를 막는다.
 *
 * 차단 패턴:
 *  1) getSeedNickname / fake-users 모듈 참조 (가짜 페르소나 닉네임 주입)
 *  2) community-data 모듈 참조 (죽은 가짜 글 풀)
 *  3) 커뮤니티/클립 페이지의 seedPosts / getSeedPosts / SEED_CLIPS 선언
 *     (DB-empty 폴백으로 가짜 글을 렌더하던 패턴)
 *
 * 양방향 검증: 정상 PASS + 위 패턴 주입 시 FAIL.
 */
import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const read = (p) => fs.readFileSync(p, 'utf8');

// 검사 대상: 커뮤니티 페이지 + 클립 페이지
const TARGET_DIRS = ['src/pages/community'];
const TARGET_FILES = ['src/pages/GalleryPage.tsx'];

const files = [...TARGET_FILES];
for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.tsx') || f.endsWith('.ts')) files.push(path.join(dir, f));
  }
}

// 차단 패턴 (라벨 → 정규식)
const BANNED = [
  ['getSeedNickname (가짜 페르소나 닉네임)', /getSeedNickname/],
  ['fake-users 모듈 참조', /['"]@\/lib\/fake-users['"]/],
  ['community-data 모듈 참조', /['"]@\/lib\/community-data['"]/],
  ['seedPosts 선언 (가짜 글 폴백)', /\b(const|let)\s+seedPosts\b/],
  ['getSeedPosts 선언 (가짜 글 폴백)', /\bfunction\s+getSeedPosts\b/],
  ['SEED_CLIPS 선언 (가짜 클립 폴백)', /\bSEED_CLIPS\b/],
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const src = read(file);
  for (const [label, re] of BANNED) {
    if (re.test(src)) {
      errors.push(`${file}: ${label} 발견 — 커뮤니티는 진짜 회원 글만 노출 (가짜 시드 금지)`);
    }
  }
}

// 죽은 가짜 시드 파일이 되살아나지 않았는지
for (const dead of ['src/lib/fake-users.ts', 'src/lib/community-data.ts']) {
  if (fs.existsSync(dead)) {
    errors.push(`${dead}: 삭제한 가짜 시드 파일이 다시 생성됨 — 커뮤니티 가짜 글 풀 부활 금지`);
  }
}

if (errors.length) {
  console.error(`\n❌ [화이트햇/F] 커뮤니티 가짜 시드 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n커뮤니티에 가짜 글/닉네임/클립이 재유입됨. DB가 비면 정직한 빈 상태만 허용. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [화이트햇/F] 커뮤니티 가짜 시드 게이트 PASS — ${files.length}개 파일 가짜 글·닉네임·클립 0 / 죽은 시드 파일 부활 0`);
