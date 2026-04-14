/**
 * Cloudflare Pages 미들웨어
 * ilsanroom.pages.dev → nolcool.com 301 영구 리다이렉트
 * SEO 점수를 nolcool.com으로 통합
 */
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

  return context.next();
};
