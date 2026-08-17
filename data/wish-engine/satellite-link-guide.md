# 위성 연합 — 위성 사이트별 본체 앵커 링크 적용 안내 (2026-08-18)

이 터미널( /home/user/ilsanroom )에서 접근 가능한 저장소는 본체(Ilsanroom) 1개뿐이라
위성 사이트 파일은 **수정하지 않았다** (추측 수정 금지 원칙). 아래는 위성 저장소를 여는
터미널에서 그대로 적용하면 되는 목록. 대표 소유 자산 간 링크 = 자급자족 예외 부합.

## 공통 규칙
- 위성 1사이트당 본체 링크 **1개만** (과링크 = 스팸 신호. 푸터/소개 문단 중 1곳).
- 앵커 텍스트 = **정확한 가게이름** (예: "일산명월관요정"). "여기", "바로가기" 금지.
- 외부 링크이므로 `target="_blank" rel="noopener noreferrer"` 필수 (본체 규칙과 동일).
- 삽입 후 해당 위성의 빌드/배포 게이트 통과 확인.

## 위성별 삽입 코드

### 1) 명월관 계열 위성 (일산명월관 단독 홍보 사이트가 있는 경우)
- 위치: 푸터 또는 "오시는 길/소개" 섹션 끝 문단
- 코드:
```html
<a href="https://nolcool.com/yojeong/ilsan/ilsanmyeongwolgwanyojeong/" target="_blank" rel="noopener noreferrer">일산명월관요정</a> 상세 정보·후기
```

### 2) 일산룸 계열 위성
- 위치: 소개 문단 1곳
- 코드:
```html
<a href="https://nolcool.com/rooms/ilsan/ilsanroom/" target="_blank" rel="noopener noreferrer">일산룸</a> 예약 안내·상세
```

### 3) 울산챔피언 계열 위성
- 위치: 소개 문단 1곳
- 코드:
```html
<a href="https://nolcool.com/nights/ulsanchampionnight/" target="_blank" rel="noopener noreferrer">울산챔피언나이트</a> 상세·이용 안내
```

## 검증 (위성 쪽 터미널에서)
1. 배포 후 위성 페이지에서 링크 렌더 확인 (`curl -s <위성URL> | grep nolcool.com`)
2. 본체 GSC "링크" 리포트에 위성 도메인이 잡히는지는 수 주 지연 — 조급해하지 않기.
3. 본체 쪽 추가 작업 0 (수신 링크는 본체 코드 변경 불필요).
