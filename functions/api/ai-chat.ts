/**
 * AI 챗봇 — Claude API를 통한 업소 추천 대화
 * POST /api/ai-chat
 *
 * 환경변수 (Cloudflare 대시보드):
 *   ANTHROPIC_API_KEY — Claude API 키
 *
 * Request:  { message: string, history?: { role: string, content: string }[] }
 * Response: { reply: string, venues?: { slug: string, nameKo: string, category: string, regionKo: string }[] }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

const SYSTEM_PROMPT = `당신은 "밤키"의 AI 추천 도우미입니다.
한국의 클럽, 나이트, 라운지, 룸, 요정, 호빠 업소를 추천해줍니다.

규칙:
- 한국어로 답변하세요.
- 지역, 카테고리, 분위기, 인원, 예산 등을 물어보고 맞춤 추천하세요.
- 가격이나 전화번호는 절대 알려주지 마세요. "업소에 직접 문의하세요"라고 안내하세요.
- 불법적이거나 성적인 내용은 거절하세요.
- 답변은 200자 이내로 간결하게 하세요.
- 업소 추천 시 JSON 형식으로 venues 배열도 함께 반환하세요.

카테고리 설명:
- club: EDM/하우스/테크노 음악, 댄스 플로어
- night: 소셜댄스(지루박/부르스), 라이브 밴드, 부킹
- lounge: 프리미엄 칵테일, VIP 서비스, 조용한 대화
- room: 프라이빗 룸, 노래방, 단체 모임
- yojeong: 한정식 코스, 전통 공연, 격식 높은 접대
- hoppa: 호스트 엔터테인먼트, 대화 중심`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'AI 서비스가 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { message, history = [] } = body;
  if (!message || typeof message !== 'string' || message.length > 500) {
    return Response.json({ error: '메시지를 확인해주세요. (최대 500자)' }, { status: 400 });
  }

  const messages = [
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

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
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return Response.json(
        { error: 'AI 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
    };
    const replyText = data.content?.[0]?.text || '죄송합니다, 응답을 생성하지 못했습니다.';

    return Response.json({ reply: replyText }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return Response.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
};
