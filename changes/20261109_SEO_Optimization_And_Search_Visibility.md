# Change Document: 20261109_SEO_Optimization_And_Search_Visibility

- **Date:** 2026-11-09
- **User Request:**
  "사람들이 웹에서 검색해서 진입할 수 있을까? 내가 만든 사이트에? -> 진행해보자." (검색엔진 최적화 및 검색 유입을 위한 SEO 세팅)

- **Proposed Changes:**
  1. `src/app/robots.ts` 신규 생성:
     - Next.js 공식 `MetadataRoute.Robots` 구현.
     - 검색엔진 봇(`*`)에 대해 메인 페이지(`/`) 크롤링 허용(`Allow: /`).
     - 관리자 페이지(`/admin`) 및 내부 API(`/api/`) 비공개 차단(`Disallow: ['/admin', '/api/']`).
     - 사이트맵 경로(`sitemap.xml`) 등록.
  2. `src/app/sitemap.ts` 신규 생성:
     - Next.js 공식 `MetadataRoute.Sitemap` 구현.
     - 메인 랜딩 페이지 경로, `changeFrequency: 'daily'`, `priority: 1.0` 설정.
  3. `src/app/layout.tsx` 메타데이터 고도화:
     - `metadataBase` 설정 (절대경로 OpenGraph/Sitemap 참조 기준).
     - 제목 템플릿(`%s | When We Meet`) 및 풍부한 키워드(`약속 날짜 조율`, `모임 날짜 투표`, `when2meet 한국어`, `일정 조율 사이트` 등) 등록.
     - `openGraph` 및 `twitter` 소셜 미리보기 카드 태그 구성 (카카오톡, 슬랙, 페이스북 링크 공유 시 브랜드 프리뷰 노출).
     - 네이버 서치어드바이저 및 구글 서치 콘솔 소유권 확인 메타태그 환경변수 슬롯 제공.
  4. `src/app/opengraph-image.tsx` 추가:
     - Next.js `ImageResponse`를 활용한 1200x630 규격의 동적 오픈그래프 미리보기 썸네일 자동 생성.
  5. `src/__tests__/seo.test.ts` 단위 테스트 작성 (TDD Red -> Green):
     - `robots()` 설정 검증 (크롤링 규칙, sitemap 포함).
     - `sitemap()` URL 구조 및 우선순위 검증.
     - 루트 메타데이터의 핵심 키워드 및 OpenGraph 필수 필드 검증.

- **Reasoning:**
  - 구글 및 네이버 검색 봇이 사이트를 정확하게 식별하고 색인(인덱싱)할 수 있도록 표준 규격(robots.txt, sitemap.xml)을 제공합니다.
  - 카카오톡 단톡방이나 SNS에 링크를 공유했을 때 신뢰도 높은 미리보기 카드가 나타나도록 하여 클릭률과 자연 유입(바이럴)을 극대화합니다.

- **Impact Analysis:**
  - 기존 투표 및 모임 관리 비즈니스 로직에는 영향이 없으며, 메타데이터와 검색 크롤러 지원 파일만 확장됩니다.
  - Vercel 배포 시 자동으로 `/robots.txt`와 `/sitemap.xml`이 제공됩니다.

- **Verification Steps:**
  1. Red: `src/__tests__/seo.test.ts` 작성 및 실패 확인.
  2. Green: `robots.ts`, `sitemap.ts`, `layout.tsx`, `opengraph-image.tsx` 구현 후 테스트 통과.
  3. 프로덕션 빌드(`npm run build`)를 통해 `/robots.txt`와 `/sitemap.xml` 정적 라우트 정상 생성 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Files Created/Modified:**
  - `src/app/robots.ts`: Next.js 표준 MetadataRoute.Robots 구현 (`/robots.txt` 엔드포인트 자동 생성, admin 및 API 크롤링 차단, sitemap 링크 등록).
  - `src/app/sitemap.ts`: Next.js 표준 MetadataRoute.Sitemap 구현 (`/sitemap.xml` 엔드포인트 자동 생성).
  - `src/app/layout.tsx`: 메타데이터 대폭 확장 (제목 템플릿, 풍부한 검색 키워드, OpenGraph, Twitter Card, 서치콘솔 검증 슬롯).
  - `src/app/opengraph-image.tsx`: 카카오톡/SNS 공유 시 1200x630 규격의 맞춤형 브랜드 썸네일 동적 생성.
  - `src/__tests__/seo.test.ts`: 단위 테스트 작성 및 통과 (robots 규칙, sitemap 생성, layout 메타데이터 검증).
- **Test Results:** 44/44 Tests Passed.
- **Production Build:** Next.js 16 빌드 성공 (`/robots.txt`, `/sitemap.xml`, `/opengraph-image` 정적 라우트 완비).

