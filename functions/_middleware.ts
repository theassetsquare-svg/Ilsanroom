/**
 * Cloudflare Pages 미들웨어
 * ilsanroom.pages.dev → nolcool.com 301 영구 리다이렉트
 * SEO 점수를 nolcool.com으로 통합
 */

// [일산74-1 · 2026-11-12] 지운 옛 카드 그림 주소는 여기서 바로 404 로 답한다.
//   Cloudflare Pages 는 새로 올린 뒤에도 지운 파일을 데이터센터마다 최대 일주일 내줄 수 있고(공식 문서 「Serving Pages」),
//   캐시를 지워도 그 사본이 다시 나와서 미들웨어에서 막는다. 301 아님 · 쪽 주소는 건드리지 않는다.
//   주소 글자 대신 경로의 SHA-256 앞 16자리만 둔다(지운 카드 이름이 저장소에 다시 남지 않게).
//   목록·시험: naver-watch 의 scripts/verify/ilsan74-1-mw-test.mjs
const REMOVED_OG_SHA16 = new Set<string>([
  'cbfdc17c5954efac', 'e9726de2d41cd41b', '1214aff99c8911bd', '753989bdf851b9cd',
  'a6d8f040ff92cbe6', '54ec7a1dcf9fbe36', '19b68141a641972b', 'b822cfe0911c9c98',
  'e4687b9d70ac2d2a', '7c3ae79363ac1f80', 'fb4d218313317bce', '934295ffa9f37a38',
  '35ae3e00352d6367', '4e167d52c2fae483', '5de4d47df380c7aa', '3a3c3fa6ae01bb04',
  '794f7ffd06034543', '3d98826e84a952b3', 'f7c84b9d40db228d', 'd7e8bb1a01db5a34',
  '732026937776bc5b', '2bbba6abe6a6dcc1', 'e332b479a65a22be', 'fe5f625a0670cb74',
  '341b0f69a2157156', '943dfc88dc094887', 'c8704dc81900ad4e', 'a37f789b05052714',
  'eaed088d82179219', '0a2a72afdc29ae8f', '499fecc678a2a636', 'e2172ee0b7686a83',
  '881864db3ea380f7', '50e2da2937310bc3', '0e7a782c7cc2dd96', 'e4af99b65930dad7',
  '5e69e765d9706ace', '08aa12dd455dc652', 'bede3dca4d657098', 'dab78ee405163d81',
  'bdde3d9b8797d0df', '325b2d106a220717', 'ca86ff4b7c6adc31', '5020c1be9985caa8',
  '96bd5b896e2931aa', '5c3593faf6808b8b', '6878c8d03c58f3f1', '0930c73d00721704',
  '85e2fc5a2897e518', 'd5e5300c7fa13679', 'd9a6e45b6340b3f4', '84769b4e2f6a8e4a',
  '83fe2ccdf96105cc', '63aed2aa90bb8b23', '82445ea9b4c6e6d6', '49733e5836005646',
  '90d446bf867260f5', '6837dbba90c36625', '372454c3dd0c4fa7', '5064009bdfa7c002',
  '04b463a78ff61ead', '692d54634e745e95', 'e80699d10775312a', 'b884327716e79395',
  '06b7625186c4a4e2', '318c205b0133c4b8', '1926f87361f189c4', '7d5aa210deeeac05',
  '107f755162eddad3', '7e78ceaa6ed2964d', 'e2070441693374a6', '0e7c90d95f13347f',
  'b2f830109596738c', 'a1ecb8cf50ed3e7e', '741bf8fd88b76d93', '506c8f2affec2816',
]);

async function sha16(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function isRemovedOg(pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/og/')) return false;
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // 깨진 퍼센트 인코딩은 그대로 견준다
  }
  return REMOVED_OG_SHA16.has(await sha16(path));
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // ilsanroom.pages.dev 접속 시 → nolcool.com으로 301 리다이렉트
  if (url.hostname === 'ilsanroom.pages.dev') {
    const destination = new URL(url.pathname + url.search + url.hash, 'https://nolcool.com');
    return new Response(null, {
      status: 301,
      headers: { Location: destination.toString() },
    });
  }

  // 지운 옛 카드 그림 → 404(엣지에 남은 옛 사본을 내주지 않는다)
  if (await isRemovedOg(url.pathname)) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  return context.next();
};
