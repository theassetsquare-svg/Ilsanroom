-- 2026-06-05: 위험단어(밤문화/유흥/노래방/룸살롱/룸싸롱/초이스) DB 일괄 정화(REPLACE)
-- 근거: CLAUDE.md NEVER(불법 연관·페널티 단어) + 위험단어 전수 교체 작업.
-- src/data/venues.ts·prerender SSR는 이미 정화 완료(라이브 크롤러 프록시 0건).
-- 그러나 라이브 venue/community는 useVenues·community-api로 DB 행을 직접 렌더 →
-- 002_seed_venues / full_venues_setup / seed_community_* 시드가 남긴 구버전 본문에
-- 위험단어 잔존(노래방 시스템·초이스 등). 광고주 실제 리스팅·커뮤니티 글이므로
-- DELETE 대신 REPLACE로 단어만 교체해 콘텐츠·세션을 보존한다.
--
-- 매핑(소스 정화와 동일): 유흥가→번화가 · 유흥→나이트라이프 · 밤문화→나이트라이프
--                          노래방→가라오케 · 룸살롱/룸싸롱→프라이빗룸 · 초이스→셀렉션
--                          (올초이스→올셀렉션은 초이스→셀렉션으로 자동 처리)
-- NULL-safe · 멱등(재실행 시 매칭 0건 no-op) · 알 수 없는 컬럼까지 동적 커버.

DO $$
DECLARE
  tbl   text;
  col   text;
  tables text[] := ARRAY[
    'venues', 'posts', 'comments',
    'seed_comment_pool', 'seed_post_pool', 'magazine_articles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      CONTINUE;
    END IF;
    FOR col IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND data_type IN ('text', 'character varying')
    LOOP
      EXECUTE format(
        'UPDATE public.%1$I SET %2$I = '
        || 'replace(replace(replace(replace(replace(replace(replace('
        || '%2$I, ''유흥가'', ''번화가''), ''유흥'', ''나이트라이프''), '
        || '''밤문화'', ''나이트라이프''), ''노래방'', ''가라오케''), '
        || '''룸살롱'', ''프라이빗룸''), ''룸싸롱'', ''프라이빗룸''), '
        || '''초이스'', ''셀렉션'') '
        || 'WHERE %2$I IS NOT NULL AND %2$I ~ ''유흥|밤문화|노래방|룸살롱|룸싸롱|초이스''',
        tbl, col
      );
    END LOOP;
  END LOOP;
END $$;

-- 검증 카운트 (마이그레이션 로그용)
DO $$
DECLARE
  v_cnt INTEGER := 0;
  p_cnt INTEGER := 0;
  c_cnt INTEGER := 0;
BEGIN
  IF to_regclass('public.venues') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_cnt FROM venues
      WHERE (COALESCE(description,'') || COALESCE(short_description,'') ||
             COALESCE(room_info,'') || COALESCE(booth_info,'') ||
             COALESCE(liquor_info,'') || COALESCE(array_to_string(atmosphere,' '),''))
            ~ '유흥|밤문화|노래방|룸살롱|룸싸롱|초이스';
  END IF;
  IF to_regclass('public.posts') IS NOT NULL THEN
    SELECT COUNT(*) INTO p_cnt FROM posts
      WHERE (COALESCE(title,'') || COALESCE(content,'')) ~ '유흥|밤문화|노래방|룸살롱|룸싸롱|초이스';
  END IF;
  IF to_regclass('public.comments') IS NOT NULL THEN
    SELECT COUNT(*) INTO c_cnt FROM comments
      WHERE COALESCE(content,'') ~ '유흥|밤문화|노래방|룸살롱|룸싸롱|초이스';
  END IF;
  RAISE NOTICE '[dangerous_word_sanitize] remaining venues: %, posts: %, comments: %', v_cnt, p_cnt, c_cnt;
END $$;
