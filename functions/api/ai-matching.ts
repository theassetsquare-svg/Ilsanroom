/**
 * AI 업소 매칭 — 사용자 조건 기반 맞춤 추천
 * POST /api/ai-matching
 *
 * 환경변수 (Cloudflare 대시보드):
 *   ANTHROPIC_API_KEY — Claude API 키
 *
 * Request: {
 *   region?: string,       // "강남", "홍대", "일산" 등
 *   category?: string,     // "club", "night", "lounge", "room", "yojeong", "hoppa"
 *   mood?: string,         // "조용한", "신나는", "격식있는" 등
 *   groupSize?: number,    // 인원 수
 *   budget?: string,       // "저렴한", "보통", "고급"
 *   occasion?: string,     // "비즈니스", "생일", "데이트", "친구모임"
 *   preferences?: string   // 추가 요구사항 자유 텍스트
 * }
 *
 * Response: {
 *   matches: { rank: number, slug: string, nameKo: string, reason: string, score: number }[],
 *   summary: string
 * }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface MatchRequest {
  region?: string;
  category?: string;
  mood?: string;
  groupSize?: number;
  budget?: string;
  occasion?: string;
  preferences?: string;
}

const SYSTEM_PROMPT = `당신은 한국 야간 문화 장소 매칭 AI입니다.
사용자의 조건을 분석하여 가장 적합한 장소를 추천하세요.

반드시 아래 JSON 형식으로만 답변하세요:
{
  "matches": [
    { "rank": 1, "slug": "venue-slug", "nameKo": "업소명", "reason": "추천 이유 1-2문장", "score": 95 },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ],
  "summary": "전체 추천 요약 1-2문장"
}

규칙:
- 최대 5개까지 추천
- score는 0-100 (적합도)
- reason은 구체적이고 사용자 조건과 연결
- 가격이나 전화번호는 절대 포함하지 마세요
- slug는 영문 소문자+하이픈 형식`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'AI 매칭 서비스가 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  let body: MatchRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const conditions: string[] = [];
  if (body.region) conditions.push(`지역: ${body.region}`);
  if (body.category) conditions.push(`카테고리: ${body.category}`);
  if (body.mood) conditions.push(`분위기: ${body.mood}`);
  if (body.groupSize) conditions.push(`인원: ${body.groupSize}명`);
  if (body.budget) conditions.push(`예산: ${body.budget}`);
  if (body.occasion) conditions.push(`목적: ${body.occasion}`);
  if (body.preferences) conditions.push(`추가 요청: ${body.preferences}`);

  if (conditions.length === 0) {
    return Response.json({ error: '최소 1개 이상의 조건을 입력해주세요.' }, { status: 400 });
  }

  const userMessage = `다음 조건에 맞는 장소를 추천해주세요:\n${conditions.join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return Response.json(
        { error: 'AI 매칭 응답을 가져오지 못했습니다.' },
        { status: 502 }
      );
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
    };
    const text = data.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: 'AI 응답 파싱에 실패했습니다.', raw: text },
        { status: 502 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('AI matching error:', err);
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
};
