-- ╔══════════════════════════════════════════════════════╗
-- ║ 012 — 시드 클립 10개를 실제 DB 행으로 변환            ║
-- ║                                                       ║
-- ║ 기존: 프론트엔드 SEED_CLIPS 배열 (가짜 ID s1~s10)     ║
-- ║ 문제: 댓글 INSERT 시 22P02 (UUID 타입 mismatch)       ║
-- ║ 해결: 실제 posts 테이블에 UUID로 인서트               ║
-- ║       → 댓글 정상 저장, 새로고침에도 영구 보존        ║
-- ║                                                       ║
-- ║ user_id = NULL (시스템 시드, 닉네임은 content JSON에) ║
-- ║ ON CONFLICT DO NOTHING (멱등)                         ║
-- ╚══════════════════════════════════════════════════════╝

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, comment_count, created_at)
VALUES
  (
    '5eedc11b-0001-4000-8000-000000000001'::uuid, NULL, 'clip',
    '금요일 피크 분위기 미쳤다 ㅋㅋ 역시 강남은 다르네',
    '{"imageUrl":"/venues/gangnamclub-peak-1.jpg","caption":"금요일 피크 분위기 미쳤다 ㅋㅋ 역시 강남은 다르네","venueCategory":"클럽","author":"강남유흥러"}',
    47, 0, false, 0, now() - interval '2 hours'
  ),
  (
    '5eedc11b-0002-4000-8000-000000000002'::uuid, NULL, 'clip',
    '홍대 토요일 밤 현장. 이 에너지 실화냐',
    '{"imageUrl":"/venues/hongdaeclub-pacific-1.jpg","caption":"홍대 토요일 밤 현장. 이 에너지 실화냐","venueCategory":"클럽","author":"홍대불주먹"}',
    38, 0, false, 0, now() - interval '5 hours'
  ),
  (
    '5eedc11b-0003-4000-8000-000000000003'::uuid, NULL, 'clip',
    '아르쥬 양주 세팅 클래스.. 이게 프리미엄이지',
    '{"imageUrl":"/venues/cheongdamclub-arju-1.jpg","caption":"아르쥬 양주 세팅 클래스.. 이게 프리미엄이지","venueCategory":"클럽","author":"분위기장인"}',
    62, 0, false, 0, now() - interval '1 day'
  ),
  (
    '5eedc11b-0004-4000-8000-000000000004'::uuid, NULL, 'clip',
    '수원찬스 부스에서 본 뷰 ㄹㅇ 예술이다',
    '{"imageUrl":"/venues/suwonchancenight-1.jpg","caption":"수원찬스 부스에서 본 뷰 ㄹㅇ 예술이다","venueCategory":"나이트","author":"새벽감성"}',
    29, 0, false, 0, now() - interval '36 hours'
  ),
  (
    '5eedc11b-0005-4000-8000-000000000005'::uuid, NULL, 'clip',
    '일산 명월관 처음 가봤는데 한실 분위기 진짜 다르다',
    '{"imageUrl":"/venues/ilsanmyeongwolgwanyojeong-1.jpg","caption":"일산 명월관 처음 가봤는데 한실 분위기 진짜 다르다","venueCategory":"라운지","author":"룸매니아"}',
    34, 0, false, 0, now() - interval '2 days'
  ),
  (
    '5eedc11b-0006-4000-8000-000000000006'::uuid, NULL, 'clip',
    '유토피아 사운드 시스템 국내 탑인듯 ㅋㅋ',
    '{"imageUrl":"/venues/gangnamclub-utopia-1.jpg","caption":"유토피아 사운드 시스템 국내 탑인듯 ㅋㅋ","venueCategory":"클럽","author":"나이트초보"}',
    55, 0, false, 0, now() - interval '3 days'
  ),
  (
    '5eedc11b-0007-4000-8000-000000000007'::uuid, NULL, 'clip',
    '부산 아시아드 금토 분위기 서울 안부러움',
    '{"imageUrl":"/venues/busanasiadnight-1.jpg","caption":"부산 아시아드 금토 분위기 서울 안부러움","venueCategory":"나이트","author":"부산사나이"}',
    41, 0, false, 0, now() - interval '84 hours'
  ),
  (
    '5eedc11b-0008-4000-8000-000000000008'::uuid, NULL, 'clip',
    '일산 샴푸나이트 밴드 라이브 오늘도 불태웠다',
    '{"imageUrl":"/venues/ilsanshampoonight-1.jpg","caption":"일산 샴푸나이트 밴드 라이브 오늘도 불태웠다","venueCategory":"나이트","author":"일산토박이"}',
    36, 0, false, 0, now() - interval '4 days'
  ),
  (
    '5eedc11b-0009-4000-8000-000000000009'::uuid, NULL, 'clip',
    '대전세븐 7번째 방문인데 매번 새로움 ㄹㅇ',
    '{"imageUrl":"/venues/daejeonsevennight-1.jpg","caption":"대전세븐 7번째 방문인데 매번 새로움 ㄹㅇ","venueCategory":"나이트","author":"대전감성"}',
    28, 0, false, 0, now() - interval '5 days'
  ),
  (
    '5eedc11b-0010-4000-8000-000000000010'::uuid, NULL, 'clip',
    '청담 H2O 물 컨셉 인테리어 보고 반했다',
    '{"imageUrl":"/venues/cheongdamh2onight-1.jpg","caption":"청담 H2O 물 컨셉 인테리어 보고 반했다","venueCategory":"나이트","author":"청담동주민"}',
    51, 0, false, 0, now() - interval '132 hours'
  )
ON CONFLICT (id) DO NOTHING;
