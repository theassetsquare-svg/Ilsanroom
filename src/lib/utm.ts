// UTM parameter generator for community share links

interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

export function addUTMParams(url: string, params: UTMParams): string {
  const urlObj = new URL(url, 'https://ilsanroom.pages.dev');
  urlObj.searchParams.set('utm_source', params.source);
  urlObj.searchParams.set('utm_medium', params.medium);
  urlObj.searchParams.set('utm_campaign', params.campaign);
  if (params.content) urlObj.searchParams.set('utm_content', params.content);
  if (params.term) urlObj.searchParams.set('utm_term', params.term);
  return urlObj.toString();
}

export function generateShareLink(postId: string, board: string, platform: 'kakao' | 'twitter' | 'facebook' | 'link'): string {
  const baseUrl = `https://ilsanroom.pages.dev/community/${board}/${postId}`;
  return addUTMParams(baseUrl, {
    source: platform,
    medium: 'social',
    campaign: 'community_share',
    content: `${board}_${postId}`,
  });
}

export function generateReferralLink(userId: string): string {
  return addUTMParams('https://ilsanroom.pages.dev/signup', {
    source: 'referral',
    medium: 'user',
    campaign: 'referral_program',
    content: userId,
  });
}
