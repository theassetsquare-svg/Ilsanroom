# 네이버 로그인 설정 가이드

## 1단계: 네이버 개발자 센터 등록

1. https://developers.naver.com 접속
2. Application → 애플리케이션 등록
3. 앱 이름: `놀쿨`
4. 사용 API: `네아로(네이버 아이디로 로그인)`
5. 제공 정보 선택: `이름`, `이메일`, `프로필 사진`
6. 서비스 URL: `https://nolcool.com`
7. Callback URL: `https://rkqnblbajhnehmxfnvri.supabase.co/auth/v1/callback`
8. Client ID와 Client Secret 복사

## 2단계: Supabase 설정

Supabase Dashboard → Authentication → Providers → Custom OAuth

```
Provider: Naver
Client ID: (위에서 복사)
Client Secret: (위에서 복사)
Authorization URL: https://nid.naver.com/oauth2.0/authorize
Token URL: https://nid.naver.com/oauth2.0/token
User Info URL: https://openapi.naver.com/v1/nid/me
Scopes: profile email
```

## 3단계: 프론트엔드 코드 업데이트

`src/pages/auth/LoginPage.tsx`에서:

```tsx
// 1. signInWith 함수에 naver 추가
function signInWith(provider: 'kakao' | 'google' | 'naver') {
  // ... 기존 코드
}

// 2. 네이버 버튼의 onClick을 실제 로그인으로 변경
<button onClick={() => handleLogin('naver')}>
  네이버로 시작하기
</button>
```

## 4단계: AuthCallbackPage 확인

기존 callback 페이지가 모든 provider를 처리하므로 추가 작업 불필요.
