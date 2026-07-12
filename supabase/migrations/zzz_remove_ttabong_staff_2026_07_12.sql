-- 2026-07-12 사장님 지시: 부산물나이트·부산연산동물나이트 "따봉" 닉네임 + 전화번호(010-7942-9076) 전부 삭제
-- 대상: venues staff 필드/본문 텍스트 + 시드 커뮤니티 posts 본문. WHERE 한정(safe-update 게이트 준수).

-- 1) staff 필드 제거
UPDATE venues
SET staff_nickname = NULL,
    staff_phone = NULL
WHERE slug IN ('busanmulnight', 'busanyeonsandongmulnight');

-- 2) venues 본문 텍스트 내 따봉 문장/구절 제거 (시드 원문 기준 targeted replace)
UPDATE venues
SET description = replace(replace(
      description,
      '따봉이라는 닉네임의 담당자가 엄지를 치켜세우며 맞이해주는 스타일로 유명하다. 처음 오는 손님도 그 환대 한 방에 긴장이 풀린다. ', ''),
      '따봉이라는 닉네임 담당자가 엄지 치켜세우며 맞이해주는 스타일로 진짜 유명하지. 우리가 처음 갔을 때 그 환대 한 방에 긴장이 풀렸네. ', ''),
    short_description = replace(
      short_description,
      '따봉이라는 닉네임의 담당자가 엄지를 치켜세우며 맞이해주는 곳이다',
      '밴드가 오르는 순간 분위기가 확 달라지는 라이브 무대다'),
    liquor_info = replace(liquor_info, '따봉 담당자가 추천하는 시그니처', '시그니처'),
    room_info = replace(replace(
      room_info,
      '따봉 담당자에게 미리 인원과 용도를 알려주면 테이블 세팅과 안주 구성을 맞춤으로 준비해준다.',
      '입장 전에 인원과 용도를 알려두면 테이블 세팅과 안주 구성이 맞춤으로 준비된다.'),
      ' 따봉 담당자가 룸 예약을 직접 관리한다.', '')
WHERE slug IN ('busanmulnight', 'busanyeonsandongmulnight');

-- 3) 남은 잔재 안전망 (features/본문 어디든 "따봉 담당자"/"따봉 실장"/"따봉" 토큰 제거)
UPDATE venues
SET description = replace(replace(replace(description, '따봉 담당자', '담당자'), '따봉 실장', '실장'), '따봉', '담당자'),
    features = (
      SELECT COALESCE(array_agg(CASE WHEN f LIKE '%따봉%' THEN replace(replace(f, '따봉 담당자', '담당자'), '따봉 실장', '실장') ELSE f END ORDER BY ord), '{}')
      FROM unnest(features) WITH ORDINALITY AS t(f, ord)
    )
WHERE slug IN ('busanmulnight', 'busanyeonsandongmulnight')
  AND (description LIKE '%따봉%' OR array_to_string(features, ',') LIKE '%따봉%');

-- 4) 시드 커뮤니티 글 본문 내 따봉 문장 제거
UPDATE posts
SET content = replace(content, ' 따봉 실장한테 자리 안내받았는데 센스있더라.', '')
WHERE venue_slug IN ('busanmulnight', 'busanyeonsandongmulnight')
  AND content LIKE '%따봉%';

UPDATE posts
SET content = replace(replace(replace(content, '따봉 실장', '실장'), '따봉 담당자', '담당자'), '010-7942-9076', '')
WHERE venue_slug IN ('busanmulnight', 'busanyeonsandongmulnight')
  AND (content LIKE '%따봉%' OR content LIKE '%010-7942-9076%');
