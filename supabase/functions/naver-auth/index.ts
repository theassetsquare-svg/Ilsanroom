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

  if (error) {
    return Response.redirect(`${SITE_URL}/login?error=naver_denied`, 302)
  }

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
    console.log('Token exchange result:', tokenData.access_token ? 'OK' : 'FAILED')

    if (!tokenData.access_token) {
      return Response.redirect(`${SITE_URL}/login?error=naver_token_failed`, 302)
    }

    // 2. 네이버 프로필 가져오기
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()
    console.log('Profile result:', profileData.resultcode)

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

    // 4. 유저 생성 (이미 존재하면 무시)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
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
    console.log('Create user:', createError ? createError.message : 'OK')

    // 5. Magic Link 생성 → 토큰 추출
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Link error:', linkError?.message)
      return Response.redirect(`${SITE_URL}/login?error=naver_session_failed`, 302)
    }

    // 6. 토큰과 이메일을 프론트로 전달 → 프론트에서 verifyOtp로 세션 생성
    const token = linkData.properties.hashed_token
    const params = new URLSearchParams({ token, email, type: 'naver' })
    return Response.redirect(`${SITE_URL}/auth/naver-callback?${params}`, 302)
  } catch (e) {
    console.error('Naver auth error:', e)
    return Response.redirect(`${SITE_URL}/login?error=naver_server_error`, 302)
  }
})
