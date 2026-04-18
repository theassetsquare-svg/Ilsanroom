import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = 'https://nolcool.com'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // 네이버에서 에러 반환 시
  if (error) {
    return Response.redirect(`${SITE_URL}/login?error=naver_denied`, 302)
  }

  // code 없으면 잘못된 요청
  if (!code) {
    return Response.redirect(`${SITE_URL}/login?error=naver_no_code`, 302)
  }

  try {
    // 1. 네이버 토큰 교환
    const tokenRes = await fetch(
      'https://nid.naver.com/oauth2.0/token?' +
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          code,
          state: state || '',
        }),
    )
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return Response.redirect(`${SITE_URL}/login?error=naver_token_failed`, 302)
    }

    // 2. 네이버 프로필 가져오기
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()

    if (profileData.resultcode !== '00') {
      return Response.redirect(`${SITE_URL}/login?error=naver_profile_failed`, 302)
    }

    const naverUser = profileData.response
    const email = naverUser.email || `naver_${naverUser.id}@naver.nolcool.app`
    const nickname = naverUser.nickname || naverUser.name || '네이버유저'
    const avatarUrl = naverUser.profile_image || ''

    // 3. Supabase Admin 클라이언트
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. 유저 생성 시도 (이미 존재하면 무시)
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        naver_id: naverUser.id,
        nickname,
        avatar_url: avatarUrl,
        provider: 'naver',
        full_name: naverUser.name || nickname,
      },
    })
    // createUser 실패(이미 존재)해도 OK — 다음 단계에서 처리

    // 5. Magic Link 생성 → 세션 자동 생성
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${SITE_URL}/auth/callback` },
      })

    if (linkError || !linkData?.properties?.action_link) {
      return Response.redirect(`${SITE_URL}/login?error=naver_session_failed`, 302)
    }

    // 6. Magic Link로 리다이렉트 → Supabase가 세션 생성 → /auth/callback으로 이동
    return Response.redirect(linkData.properties.action_link, 302)
  } catch (e) {
    console.error('Naver auth error:', e)
    return Response.redirect(`${SITE_URL}/login?error=naver_server_error`, 302)
  }
})
