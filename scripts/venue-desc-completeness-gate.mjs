// venue-desc-completeness-gate — venue shortDescription 문장 잘림(미완결) 영구 차단
// 배경: 11지표 SEO 감사는 "가게명 포함"만 보고 문장이 쉼표·연결어미·단어 중간에서
// 끊긴 것을 못 잡는다. 시즌53(16건)·2026-06-13(15건) 반복 재발 → 빌드게이트로 고정.
// 규칙: shortDescription은 종결부호(.?!…) 또는 한국어 문장종결 음절 또는 닫는 괄호로 끝나야 함.
// 명사형 완결(리스트형 등) 예외는 TAIL_OK 화이트리스트로만 허용(저자 의도 명시 강제).
import { readFileSync } from 'fs';

const ENDERS = ['다','요','죠','네','지','야','어','해','음','셈','대','래','소','임','담','징','오'];
const PUNCT = ['.','!','?','…','"','”','』','」'];
const CLOSERS = [')',']','〉','》'];
// 명사·고유명으로 끝나는 의도적 완결 표현(em-dash 나열형 등) — 추가 시 저자가 완결 확인했다는 뜻
const TAIL_OK = ['정석'];

function isComplete(sd) {
  const t = sd.trim();
  if (!t) return false;
  const last = t[t.length - 1];
  if (PUNCT.includes(last) || ENDERS.includes(last) || CLOSERS.includes(last)) return true;
  if (TAIL_OK.some((w) => t.endsWith(w))) return true;
  return false;
}

function scan() {
  const src = readFileSync(new URL('../src/data/venues.ts', import.meta.url), 'utf8');
  const re = /slug:\s*'([^']+)'[\s\S]*?shortDescription:\s*'([^']*)'/g;
  const seen = new Set();
  const bad = [];
  let m;
  while ((m = re.exec(src))) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    if (!isComplete(m[2])) bad.push([slug, m[2].slice(-24)]);
  }
  return { total: seen.size, bad };
}

// 양방향 self-test: 잘린 샘플은 반드시 FAIL, 완결 샘플은 반드시 PASS
function selftest() {
  const trunc = ['이름이 호기심을 자극하는데,', '경기장 같은 열기가 넘치', '운영되는 리조트 클럽이', '시선을 사로잡', '영업시간이 넉넉한'];
  const ok = ['새벽까지 텐션이 안 떨어진다.', '성지로 회자된다', '도보 5분이라 접근성이 좋아요', '빌드업이 정석', '한참 남는다!'];
  const f1 = trunc.filter(isComplete); // 잘림인데 통과로 본 것 = 탐지기 결함
  const f2 = ok.filter((s) => !isComplete(s)); // 완결인데 잘림으로 본 것 = 오탐
  if (f1.length || f2.length) {
    console.error('❌ self-test 실패');
    if (f1.length) console.error('   잘림 미탐:', f1);
    if (f2.length) console.error('   완결 오탐:', f2);
    process.exit(1);
  }
  console.log('✅ self-test PASS — 잘림 5/5 탐지, 완결 5/5 통과');
}

console.log('📝 venue shortDescription 완결성 게이트');
selftest();
const { total, bad } = scan();
if (bad.length) {
  console.error(`❌ FAIL — shortDescription 미완결 ${bad.length}건 (총 ${total})`);
  for (const [slug, tail] of bad) console.error(`   - ${slug} | ...${tail}`);
  console.error('   → 쉼표·연결어미·단어 중간 잘림을 완결 문장으로. 명사형 완결이면 TAIL_OK에 추가.');
  process.exit(1);
}
console.log(`✅ PASS — venue ${total}개 shortDescription 전부 완결 문장`);
