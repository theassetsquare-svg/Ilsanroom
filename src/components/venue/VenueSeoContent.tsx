import type { Venue, VenueCategory } from '@/types';

// ── Deterministic hash from venue id for consistent randomness ──
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, index = 0): T {
  return arr[(seed + index) % arr.length];
}

function pickN<T>(arr: T[], seed: number, count: number): T[] {
  const shuffled = [...arr].sort((a, b) => {
    const ha = hash(a as unknown as string + String(seed));
    const hb = hash(b as unknown as string + String(seed));
    return ha - hb;
  });
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ── Region-specific flavour text ──
const regionVibes: Record<string, string[]> = {
  ilsan: [
    '호수공원에서 불어오는 바람이 아직 옷깃에 남아 있을 무렵',
    '라페스타 거리의 불빛이 하나둘 켜지는 저녁 무렵',
    '정발산 너머로 해가 내려앉은 뒤',
    '신도시 대로변의 가로수가 그림자를 길게 늘이는 시간',
  ],
  gangnam: [
    '강남대로의 네온이 빗방울처럼 쏟아지는 밤',
    '테헤란로의 빌딩 숲 사이로 바람이 비집고 들어오는 저녁',
    '교보타워 앞 횡단보도를 건넌 직후의 설렘',
    '압구정 로데오 뒷골목에서 시작되는 진짜 밤',
  ],
  cheongdam: [
    '갤러리아 백화점 옆 골목이 조용해지는 시간',
    '청담사거리의 명품 간판들이 조명으로 바뀌는 순간',
    '도산공원 벤치를 지나쳐 걸음을 재촉할 때',
  ],
  sinlim: [
    '신림역 로터리의 소음이 묘하게 반가운 밤',
    '관악산 자락 아래 불빛이 촘촘히 박힌 동네',
    '녹두거리의 허기진 냄새를 지나치며 걸을 때',
  ],
  'busan-haeundae': [
    '해운대 백사장에서 파도 소리가 잦아드는 밤',
    '마린시티 야경이 유리창에 번지는 시간',
    '동백섬 산책로를 걷다 발길을 돌릴 무렵',
  ],
  daejeon: [
    '둔산동 거리의 은행나무가 가로등 아래 빛나는 저녁',
    '유성온천의 수증기가 옅어지는 밤',
    '대전역 광장을 가로질러 걸음을 옮길 때',
  ],
  suwon: [
    '화성 성곽 위로 달이 뜨는 밤',
    '수원역 앞 로데오 거리가 들썩이는 저녁',
    '영통의 직장인들이 넥타이를 풀기 시작하는 시간',
  ],
  incheon: [
    '송도 센트럴파크 너머로 바다 냄새가 밀려오는 밤',
    '부평 지하상가의 불이 꺼지고 진짜 밤이 시작될 때',
    '차이나타운 홍등이 안개에 번지는 저녁',
  ],
  daegu: [
    '동성로의 발걸음이 빨라지는 밤',
    '팔공산에서 내려온 바람이 시내를 훑고 지나간 뒤',
  ],
  jeonju: [
    '한옥마을 기와 위로 별이 쏟아지는 밤',
    '전주천 다리를 건너며 느끼는 묘한 기대감',
  ],
};

// Fallback for unknown regions
const defaultRegionVibes = [
  '거리의 가로등이 하나씩 켜지는 저녁',
  '하루의 긴장이 어깨에서 스르르 내려앉는 시간',
  '도심의 소음이 먼 파도처럼 들리는 밤',
];

// ── Category-specific narrative blocks ──
interface NarrativeKit {
  openers: string[];
  midSections: ((v: Venue, seed: number) => string)[];
  closers: string[];
  vibeWords: string[];
}

const categoryNarratives: Record<VenueCategory, NarrativeKit> = {
  club: {
    openers: [
      '문이 열리는 순간 심장이 먼저 반응한다. 저음이 바닥을 타고 올라와 발바닥을 두드린다. 그건 음악이 아니라 초대장이다.',
      '계단을 내려가는 동안 세상이 바뀐다. 위에서는 평범했던 거리가, 아래에서는 전혀 다른 시간대로 접어든다. 조명이 숨을 쉬듯 명멸하고, 낯선 비트가 몸의 리듬을 바꿔놓는다.',
      '누군가는 클럽을 소음이라 부른다. 그 사람은 아직 제대로 된 사운드를 만나보지 못한 거다. 좋은 스피커에서 나오는 베이스는 소음이 아니라 맥박이다.',
    ],
    midSections: [
      (v, _s) => {
        const feat = v.features.length > 0 ? v.features[0] : '사운드 시스템';
        return `이곳의 ${feat}은(는) 그냥 장비가 아니다. DJ가 트랙을 전환할 때마다 공기의 밀도가 달라지는 걸 느낄 수 있다. 처음 온 사람도 두세 곡 지나면 자연스럽게 몸이 움직인다. 억지로 흥을 만들 필요가 없다. 음악이 알아서 끌고 간다.`;
      },
      (v, _s) => {
        const atm = v.atmosphere.length > 0 ? v.atmosphere[0] : '열기 가득한';
        return `플로어 한가운데 서면 ${atm} 공기가 피부에 닿는다. 땀과 향수와 드라이아이스가 섞인 특유의 냄새. 그게 싫은 사람도 있겠지만, 한번 빠지면 그게 그리워서 다시 오게 된다. 중독이라기보다는 습관에 가깝다. 나쁘지 않은 습관.`;
      },
      (v, _s) => {
        return `바 카운터에서 잠깐 쉬며 플로어를 바라보는 것도 이곳만의 즐거움이다. 조명 아래 실루엣들이 하나의 파도처럼 움직이는 광경은 꽤 볼만하다. 혼자 왔든 여럿이 왔든 상관없다. 여기서는 모두가 같은 비트 위에 있으니까.`;
      },
    ],
    closers: [
      '새벽 공기를 마시며 나올 때, 귀에서 울리는 잔향이 아까운 밤이었다고 말해준다.',
      '택시를 잡으며 뒤를 돌아보면, 아직 불이 켜져 있는 그 문이 다음주에도 거기 있을 거라는 게 안심이 된다.',
    ],
    vibeWords: ['비트', '플로어', '사운드', '새벽', '리듬'],
  },

  night: {
    openers: [
      '나이트라는 단어에 누군가는 고개를 갸웃하고, 누군가는 입꼬리를 올린다. 후자의 사람이라면 이 글을 계속 읽어도 좋다.',
      '댄스플로어에 처음 발을 내딛는 순간의 어색함. 그건 5분이면 사라진다. 음악이 몸을 흔들어 주니까.',
      '좋은 나이트는 음악으로 기억되지 않는다. 그날 밤 나눈 눈빛, 우연히 맞잡은 손, 노래가 끝나도 멈추지 않았던 발걸음으로 기억된다.',
    ],
    midSections: [
      (v, _s) => {
        const feat = v.features.length > 0 ? v.features[0] : '라이브 밴드';
        return `${feat}이(가) 이곳의 중심을 잡아준다. 밴드가 첫 곡을 시작하면 테이블에 앉아있던 사람들이 슬슬 자리에서 일어난다. 억지가 아니다. 몸이 먼저 아는 거다. 두 곡, 세 곡 지나면 홀 전체가 하나의 리듬으로 움직인다. 그 순간이 이 곳에 오는 이유다.`;
      },
      (v, _s) => {
        const age = v.ageGroup || '30대 후반에서 50대';
        return `여기 오는 사람들은 대체로 ${age}쯤 된다. 서로 나이를 묻지 않는 분위기가 좋다. 춤을 잘 추든 못 추든 누구도 신경 쓰지 않는다. 그냥 음악에 몸을 맡기면 된다. 그게 이 공간의 불문율이다.`;
      },
      (v, _s) => {
        return `조명이 바뀔 때마다 홀의 표정도 달라진다. 느린 곡이 나오면 은은해지고, 빠른 곡이 걸리면 색이 바뀌며 공간 전체가 들썩인다. 좋은 나이트의 조건은 음악, 사람, 그리고 빛의 조화다. 셋 중 하나라도 빠지면 분위기가 반쪽이 된다.`;
      },
    ],
    closers: [
      '밖으로 나오면 새벽 바람이 달아오른 볼을 식혀준다. 오늘 밤이 좋았다면 다음에도 올 이유는 충분하다.',
      '마지막 곡이 끝나도 여운은 쉽게 가시지 않는다. 그게 좋은 밤의 증거다.',
    ],
    vibeWords: ['댄스', '밴드', '홀', '리듬', '조명'],
  },

  lounge: {
    openers: [
      '소리가 낮아지는 곳에서 대화는 깊어진다. 라운지란 결국 그런 공간이다. 음악은 배경이고, 사람이 주인공이 되는 자리.',
      '조명이 낮은 공간에 앉으면 목소리도 자연스럽게 낮아진다. 그 톤에서 나오는 이야기들은 대개 진심에 가깝다.',
      '좋은 라운지는 시계를 잊게 만든다. 한잔이 두잔이 되고, 한 시간이 세 시간이 되어도 아깝다는 생각이 들지 않는 곳.',
    ],
    midSections: [
      (v, _s) => {
        const feat = v.features.length > 0 ? v.features[0] : '인테리어';
        return `이곳의 ${feat}은(는) 과시가 아니라 배려다. 앉았을 때 시선이 편한 높이, 대화할 때 방해되지 않는 음악 볼륨, 잔을 내려놓을 때 손이 자연스럽게 가는 테이블 위치. 이런 디테일을 아는 곳이 생각보다 드물다.`;
      },
      (v, _s) => {
        return `칵테일 한 잔을 앞에 두고 창밖을 바라보는 시간. 혼자여도 외롭지 않고, 둘이어도 복잡하지 않은 공간. 바텐더가 건네는 짧은 인사가 이상하게 따뜻하다. 이 동네에서 이런 온도를 가진 곳이 몇이나 될까.`;
      },
    ],
    closers: [
      '문을 열고 나서면 밤공기가 선명하다. 방금 전까지의 시간이 꿈처럼 느껴지는, 그런 라운지다.',
      '다음에 올 때는 누구를 데려올까 고민하게 되는 곳. 아무나 데려오고 싶지 않다는 게 칭찬이다.',
    ],
    vibeWords: ['위스키', '칵테일', '조명', '대화', '여유'],
  },

  room: {
    openers: [
      '문을 닫으면 세상이 차단된다. 그 안에서는 내 사람들과 나만의 시간이 흐른다. 좋은 룸이란 결국 그 차단의 질을 말한다.',
      '프라이빗이라는 단어가 남용되는 시대에, 진짜 프라이빗한 공간은 의외로 적다. 문 닫아도 옆방 소리가 들리면 그건 프라이빗이 아니다.',
      '모임의 성격은 장소가 절반을 결정한다. 어수선한 곳에서는 진지한 이야기가 나오지 않고, 답답한 곳에서는 웃음이 나오지 않는다.',
    ],
    midSections: [
      (v, _s) => {
        const feat = v.features.length > 0 ? v.features[0] : '방음 시설';
        return `${feat}에 대해 이야기하지 않을 수 없다. 옆에서 어떤 소리가 나든 이쪽은 고요하다. 그 고요함 속에서 건배 소리가, 웃음소리가, 속삭임이 또렷하게 살아난다. 소리가 새지 않는다는 건 비밀이 지켜진다는 뜻이기도 하다.`;
      },
      (v, _s) => {
        return `조명 밝기를 손끝으로 조절할 수 있다. 비즈니스 미팅이면 밝게, 기념일이면 은은하게. 같은 방이 전혀 다른 분위기를 만들어낸다. 이런 유연함이 단골이 끊이지 않는 이유 중 하나다.`;
      },
      (v, _s) => {
        const size = v.features.find(f => f.includes('인')) || '4인부터 12인까지';
        return `방 크기는 ${size} 정도가 가장 잘 맞는다. 너무 크면 허전하고, 너무 작으면 답답하다. 예약할 때 인원수를 정확히 말해주면 딱 맞는 방을 잡아준다. 이 간단한 소통 하나가 그날 밤의 만족도를 좌우한다.`;
      },
    ],
    closers: [
      '돌아가는 길에 오늘 자리가 좋았다는 연락이 온다면, 장소 선택을 잘한 거다.',
      '다음 모임 장소를 고민하지 않아도 된다는 건 꽤 큰 안도감이다. 여기가 그런 곳이다.',
    ],
    vibeWords: ['프라이빗', '방음', '모임', '격식', '조명'],
  },

  yojeong: {
    openers: [
      '나무 문을 밀고 들어서면 시간이 느려진다. 마루 위의 공기가 다르고, 벽 너머의 정원에서 풀벌레 소리가 스민다. 요정이라는 공간은 속도를 거부한다.',
      '한옥의 처마 끝에서 빗물이 떨어지는 소리를 들어본 적 있는가. 그런 고요를 아는 사람이라면, 이 공간이 왜 필요한지 설명하지 않아도 안다.',
      '기와 위로 달이 뜬다. 방 안에서는 가야금 선율이 흐르고, 상 위에는 정갈한 한상이 놓여 있다. 이건 식사가 아니라 경험이다.',
    ],
    midSections: [
      (v, _s) => {
        const feat = v.features.find(f => f.includes('한정식') || f.includes('코스')) || '한정식 코스';
        return `${feat}가 상에 오르는 과정 자체가 하나의 의식 같다. 젓가락을 들기 전에 눈으로 먼저 먹는다. 그릇의 색감, 음식의 배치, 반찬 하나하나의 정성. 대충 만든 것은 하나도 없다. 이런 상차림 앞에서 허투루 먹는 사람을 본 적이 없다.`;
      },
      (v, _s) => {
        const music = v.features.find(f => f.includes('국악') || f.includes('가야금')) || '국악 선율';
        return `${music}이 은은하게 깔리면 대화의 톤이 달라진다. 목소리가 낮아지고, 말의 무게가 달라진다. 접대 자리에서 이 분위기를 경험한 상대방이 감탄하지 않은 적이 없다고, 단골들은 말한다.`;
      },
    ],
    closers: [
      '신발을 다시 신고 문 밖으로 나서면, 방금 전까지 있던 곳이 다른 시대처럼 느껴진다. 그 간극이 좋다.',
      '이런 공간이 아직 남아 있다는 것 자체가 위안이다. 빠르게만 돌아가는 세상에서, 느림의 값어치를 아는 곳.',
    ],
    vibeWords: ['한옥', '국악', '한정식', '정갈', '고요'],
  },

  hoppa: {
    openers: [
      '웃음이 필요한 밤이 있다. 진짜 웃음. 예의상 짓는 미소 말고, 배꼽 잡고 터지는 그런 웃음. 그게 목적이라면 방향을 잘 잡은 거다.',
      '혼자 마시는 술은 쓰다. 누군가 잔을 채워주고, 이야기를 들어주고, 가끔 바보 같은 농담으로 웃겨주는 밤. 그런 밤이 필요할 때가 있다.',
      '문을 열면 환한 인사가 먼저 온다. 그 인사가 진짜인지 아닌지는 30분만 있어보면 안다. 좋은 곳은 그 진심이 끝까지 유지된다.',
    ],
    midSections: [
      (v, _s) => {
        return `여기 사람들은 눈치가 빠르다. 기분이 좋을 때는 같이 신나게 놀아주고, 조용히 마시고 싶을 때는 적당한 거리를 유지해준다. 이 간격 조절이 생각보다 어려운 건데, 경험이 쌓인 곳은 그게 자연스럽다.`;
      },
      (v, _s) => {
        return `분위기가 무르익으면 노래가 나온다. 좋아하는 곡을 부르면 다 같이 따라 부르고, 모르는 곡이어도 박수를 쳐준다. 이런 소소한 호응이 밤을 따뜻하게 만든다. 혼자 온 손님이 단골이 되는 건 대개 이 순간 때문이다.`;
      },
    ],
    closers: [
      '나올 때 "또 오세요"가 아니라 "조심히 가세요"라고 말해주는 곳. 그 한마디가 다음에 또 오게 만든다.',
      '택시 안에서 웃음이 새어나온다면, 오늘 밤은 성공이다.',
    ],
    vibeWords: ['웃음', '대화', '호응', '인사', '단골'],
  },
};

// ── Staff-related narrative ──
function staffParagraph(v: Venue, seed: number): string {
  if (!v.staffNickname) return '';
  const templates = [
    `${v.staffNickname}이(가) 이 곳을 움직이는 사람이다. 전화 한 통이면 자리가 잡히고, 도착하면 준비가 끝나 있다. 과한 친절이 아니라 정확한 응대. 뭘 물어봐도 애매하게 넘기지 않고 솔직하게 답해준다. 그래서 다시 찾게 된다.`,
    `여기서 ${v.staffNickname}을(를) 모르면 처음 온 거다. 단골들 사이에서는 이름만 대면 통한다. 예약 전화를 받을 때부터 남다르다. 인원수, 모임 성격, 선호하는 자리까지 한 번에 파악해서 당일에 불필요한 대화가 없다.`,
    `${v.staffNickname}의 얼굴을 보면 안심이 된다. 이 사람이 잡아준 자리에서 실패한 적이 없다는 단골들의 말이 과장이 아니다. 조용한 성격이지만 필요한 순간에는 정확하게 나타난다. 그 감각이 경험에서 온다는 걸 느낀다.`,
  ];
  return templates[seed % templates.length];
}

// ── Station/Access narrative ──
function accessParagraph(v: Venue, seed: number): string {
  const station = v.nearbyStation;
  const park = v.parking;

  if (!station && !park) {
    return '대중교통이 닿는 거리에 있으니 이동 걱정은 접어두어도 된다.';
  }

  const parts: string[] = [];
  if (station) {
    const stationTemplates = [
      `${station}에서 내리면 멀지 않다. 걸으면서 기대감이 올라오는 적당한 거리.`,
      `${station}이 가까워서 귀갓길 걱정이 없다. 늦은 시간까지 즐기고도 안전하게 돌아갈 수 있다는 건 꽤 중요한 조건이다.`,
    ];
    parts.push(stationTemplates[seed % stationTemplates.length]);
  }
  if (park) {
    parts.push(`주차는 ${park}. 차를 가져와도 되지만, 마시는 자리라면 대중교통을 권한다.`);
  }
  return parts.join(' ');
}

// ── Best time narrative ──
function bestTimeParagraph(v: Venue, seed: number): string {
  const time = v.bestTime;
  if (!time) {
    const defaults = [
      '금요일과 토요일 저녁이 가장 활기차고, 평일은 여유롭게 자리를 잡을 수 있다. 둘 다 나름의 매력이 있다.',
      '주말 저녁이면 사람이 몰린다. 그 북적임이 좋다면 주말을, 한가로움이 좋다면 평일을 노려보자.',
    ];
    return defaults[seed % defaults.length];
  }
  return `이곳이 가장 빛나는 시간은 ${time}이다. 그 시간대에 맞춰서 가면 후회하지 않을 거다. 타이밍 하나로 같은 공간이 전혀 달라질 수 있다.`;
}

// ── Feature weaving (avoids banned words) ──
function featureNarrative(features: string[], seed: number): string {
  if (features.length === 0) return '';
  const selected = pickN(features, seed, Math.min(3, features.length));
  const connectors = [
    (f: string) => `${f}이(가) 눈에 먼저 들어온다. 공간의 첫인상을 결정짓는 요소다.`,
    (f: string) => `${f}은(는) 기대 이상이었다. 실제로 경험해보면 말로 설명하기 어려운 차이가 있다.`,
    (f: string) => `${f}에 대해서는 가보면 고개를 끄덕이게 된다. 신경을 쓴 흔적이 곳곳에 보인다.`,
  ];
  return selected.map((f, i) => connectors[(seed + i) % connectors.length](f)).join(' ');
}

// ── Atmosphere weaving ──
function atmosphereNarrative(atmosphere: string[], seed: number): string {
  if (atmosphere.length === 0) return '';
  const selected = pickN(atmosphere, seed, Math.min(2, atmosphere.length));
  return `분위기를 한마디로 줄이면 "${selected.join(', ')}"이다. 말로 쓰면 진부하게 들릴 수 있는데, 직접 느껴보면 와닿는다. 공간이 주는 무드라는 게 원래 그렇다. 사진으로는 절반도 전달되지 않는다.`;
}

// ── Dress code mini-paragraph ──
function dressCodeNote(v: Venue, seed: number): string {
  if (!v.dressCode) return '';
  const templates = [
    `옷차림은 ${v.dressCode} 정도면 된다. 너무 격식을 차릴 필요도, 너무 편하게 올 필요도 없다. 적당함의 기준은 "이 사람이 여기 오려고 신경 썼구나" 정도면 충분하다.`,
    `드레스코드 이야기를 하자면, ${v.dressCode}이 기본이다. 거창하게 생각할 것 없다. 깔끔하면 된다.`,
  ];
  return templates[seed % templates.length];
}

// ── Honest observation (adds authenticity) ──
function honestNote(v: Venue, seed: number): string {
  const notes = [
    '솔직히 처음 가면 입구를 찾는 데 살짝 헤맬 수 있다. 건물 번호를 잘 보고 가자.',
    '모든 곳이 그렇듯, 주말 예약은 서둘러야 한다. 좋은 자리는 빨리 찬다.',
    '완벽한 곳은 없다. 여기도 마찬가지다. 하지만 단점보다 장점이 훨씬 많은 곳이라는 건 확실하다.',
    '한 가지 아쉬운 점을 굳이 꼽자면, 인기 있는 시간대에는 대기가 있을 수 있다는 것이다. 하지만 기다린 만큼의 값어치는 한다.',
    '처음 가는 사람에게 팁을 주자면, 미리 전화해서 상황을 물어보는 게 가장 현명하다. 그 한 통이 그날 밤의 퀄리티를 바꿔놓는다.',
  ];
  return notes[seed % notes.length];
}

// ── Main component ──
export default function VenueSeoContent({ venue }: { venue: Venue }) {
  const seed = hash(venue.id + venue.slug + venue.name);
  const kit = categoryNarratives[venue.category];
  const regionKey = venue.region;
  const vibes = regionVibes[regionKey] || defaultRegionVibes;

  // Select region vibe for opening
  const regionVibe = pick(vibes, seed);

  // Build the venue name reference (used 2-3 times only)
  const vName = venue.nameKo;

  // ── Paragraph 1: Scene opener with venue name in first 100 chars ──
  const opener = pick(kit.openers, seed);
  const p1 = `${regionVibe}, ${vName}의 문 앞에 선다. ${opener}`;

  // ── Paragraph 2: Category-specific mid section ──
  const midFn1 = pick(kit.midSections, seed, 0);
  const p2 = midFn1(venue, seed);

  // ── Paragraph 3: Features ──
  const p3 = featureNarrative(venue.features, seed);

  // ── Paragraph 4: Second category mid or atmosphere ──
  let p4 = '';
  if (kit.midSections.length > 1) {
    const midFn2 = pick(kit.midSections, seed, 1);
    p4 = midFn2(venue, seed);
  }
  if (venue.atmosphere.length > 0) {
    p4 += (p4 ? ' ' : '') + atmosphereNarrative(venue.atmosphere, seed);
  }

  // ── Paragraph 5: Staff ──
  const p5 = staffParagraph(venue, seed);

  // ── Paragraph 6: Access ──
  const p6 = accessParagraph(venue, seed);

  // ── Paragraph 7: Best time + dress code ──
  const p7 = bestTimeParagraph(venue, seed) + (dressCodeNote(venue, seed) ? ' ' + dressCodeNote(venue, seed) : '');

  // ── Paragraph 8: Honest note ──
  const p8 = honestNote(venue, seed);

  // ── Paragraph 9: Closer with second venue name mention ──
  const closer = pick(kit.closers, seed);
  const p9 = `${vName}. ${closer}`;

  // Collect non-empty paragraphs
  const paragraphs = [p1, p2, p3, p4, p5, p6, p7, p8, p9].filter(Boolean);

  // Ensure 1000+ characters by adding reflection paragraphs as needed
  const bonusPool = [
    `밤이라는 시간은 낮과 다른 규칙으로 움직인다. 낮에는 효율을 따지고 계산을 하지만, 밤에는 감각이 앞선다. 좋은 공간은 그 감각을 깨워주는 곳이다. 여기가 기억에 남는 건 단순히 시설이 좋아서가 아니다. 그 안에서 보낸 시간의 질감이 남달랐기 때문이다. 누군가와 함께한 웃음, 혼자만의 생각, 잔을 기울이며 나눈 이야기. 그런 것들이 쌓여서 하나의 장소가 "내 곳"이 된다. 다시 가고 싶다는 마음이 드는 건 그래서다.`,
    `사람마다 밤을 보내는 방식이 다르다. 누군가는 시끄러운 곳에서 에너지를 얻고, 누군가는 조용한 곳에서 충전한다. 중요한 건 자기에게 맞는 곳을 찾는 일이다. 그 탐색의 과정이 귀찮다면, 검증된 곳부터 가보는 게 요령이다. 여기는 적어도 "가볼 만했다"는 말이 나오는 곳이다. 그 이상은 직접 확인하는 수밖에 없다. 기대를 살짝 낮추고 가면 오히려 더 만족하게 되는 법이다.`,
    `공간에 대한 판단은 결국 주관적이다. 같은 곳을 가도 어떤 사람은 만족하고 어떤 사람은 아쉬워한다. 하지만 오래 살아남는 곳에는 이유가 있다. 단골이 쌓이고, 입소문이 돌고, 처음 온 사람이 다시 오겠다고 말하는 곳. 그런 곳은 무언가를 제대로 하고 있다는 뜻이다. 글로 전하는 데는 한계가 있으니, 한번 가보기를 권한다. 발걸음이 답을 알려줄 것이다.`,
    `어떤 장소는 사진으로 봐도 감이 온다. 하지만 대부분의 장소는 직접 가봐야 안다. 문을 열고 들어서는 순간의 공기, 첫 번째 인사의 톤, 자리에 앉았을 때의 시야. 이런 것들은 화면으로 전달되지 않는다. 그래서 후기보다 경험이 앞선다. 누군가의 글을 읽고 여기까지 왔다면, 이제 남은 건 직접 확인하는 일뿐이다. 기대해도 좋다.`,
    `밤이 깊어지면 사람의 얼굴도 달라진다. 낮에는 보이지 않던 표정이 나오고, 평소에 하지 않던 말이 나온다. 좋은 공간은 그런 순간을 자연스럽게 만들어준다. 억지로 분위기를 띄우지 않아도, 공간 자체가 사람을 편하게 풀어주는 곳. 그런 곳을 만나면 아끼게 된다. 쉽게 알려주고 싶지 않은, 나만의 장소가 되는 것이다.`,
  ];
  let insertIdx = paragraphs.length - 1;
  let bonusIdx = 0;
  while (paragraphs.join('').length < 1000 && bonusIdx < bonusPool.length) {
    paragraphs.splice(insertIdx, 0, bonusPool[(seed + bonusIdx) % bonusPool.length]);
    insertIdx++;
    bonusIdx++;
  }

  return (
    <section className="mt-8 space-y-4 text-gray-300 text-[15px] leading-relaxed">
      {paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </section>
  );
}
