export async function onRequest(context) {
  return new Response("안녕하세요! 놀쿨 API 정상 작동 중!", {
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
  });
}
