# Change Document: 20261106_Init_WhenWeMeet_Project

- **Date:** 2026-11-06
- **User Request:** 
  vercel을 이용해서 호스팅할 간단한 웹페이지 작업. 기능은 달력에 친구들끼리 불가능한날짜 또는 가능한 날짜를 표시하면 확인하여 날짜를 조율하는 단순한 기능으로 시작하여 확장하려고해. 달력은 세션을 생성하듯이 신규로 생성/삭제가 가능하고 삭제시에는 미리 정해진 비밀번호를 입력해야해. 단순한 생각이니까 좀더 enhance 해서 mvp 로 가보자.
  새로운 프로젝트 폴더를 구성하고 db 는 최대한 가볍게 가야하니 sqlite 같은 웹에서도 간단히 사용할수 있는걸로 가자. 그리고 광고도 붙일꺼야 나중에.

- **Proposed Changes:**
  1. `/Users/bjlee/2026prj/when-we-meet` 신규 프로젝트 생성 (Next.js 14/15 App Router, TypeScript, Tailwind CSS, Lucide React).
  2. Vercel 서버리스 호환 경량 DB 아키텍처:
     - SQLite 호환 서버리스 솔루션: Turso (libsql / SQLite) 또는 로컬 SQLite(개발용) + 추후 간편 마이그레이션 가능한 Prisma/Drizzle ORM 또는 경량 저장소 인터페이스 구축.
     - 로컬 개발 환경에서는 SQLite (`better-sqlite3` 또는 `sqlite3`/Prisma sqlite), Vercel 배포 시 Turso(libSQL / SQLite for Serverless)로 1줄 전환 가능하도록 추상화.
  3. 핵심 기능 구현:
     - 세션(모임방) 생성: 제목, 설명, 기간(시작일~종료일), 삭제용 비밀번호 해싱/검증.
     - 참여자별 날짜 가능/불가능 체크 및 저장.
     - 취합된 결과 히트맵 뷰 & 최적의 날짜(Best Date) 자동 집계.
     - 비밀번호 확인을 통한 세션 삭제 기능.
     - 나중에 Google AdSense / 카카오 애드핏 배너를 쉽게 넣을 수 있는 광고 슬롯(AdBanner) 컴포넌트 레이아웃 사전 배치.
  4. 테스트 작성:
     - Vitest 기반 세션 생성, 참여자 응답 저장, 일정 취합 로직, 세션 삭제 검증 단위 테스트 작성 (TDD Red -> Green -> Refactor).

- **Reasoning:**
  - Vercel 서버리스 환경은 파일 시스템 쓰기가 세션마다 휘발되므로, 순수 로컬 파일 기반 sqlite는 배포 시 세션이 유지되지 않는 문제가 발생합니다. 따라서 로컬 개발에선 SQLite 파일을 사용하고, Vercel 배포 시 완전 무료 SQLite 클라우드인 Turso(libSQL) 또는 서버리스 SQLite 드라이버로 원활히 연동 가능한 구조로 설계합니다.
  - 광고 배치를 고려한 상/하단 광고 배너 슬롯 레이아웃을 초기 설계에 포함합니다.

- **Impact Analysis:**
  - 완전히 독립된 신규 폴더(`/Users/bjlee/2026prj/when-we-meet`)에서 작업되므로 기존 프로젝트에 영향 없음.
  - Vercel에 GitHub 연동 한 번으로 바로 배포 가능.

- **Verification Steps:**
  1. Vitest를 통한 날짜 계산, 투표 집계, 비밀번호 검증 단위 테스트 통과 확인.
  2. Next.js 빌드 (`npm run build`) 오류 없이 통과 확인.
  3. 로컬 서버 구동 및 방 생성/투표/삭제 E2E 인터랙션 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Project Path:** `/Users/bjlee/2026prj/when-we-meet`
- **Framework & Libraries:** Next.js 16 (App Router), TypeScript, Tailwind CSS, `@libsql/client` (SQLite 호환), bcryptjs, Lucide React, date-fns.
- **TDD Verification:**
  - `src/__tests__/scheduler.test.ts`: 히트맵 집계 및 최적 날짜(Best Date) 알고리즘 단위 테스트 통과 (2 tests)
  - `src/__tests__/db.test.ts`: 모임방 생성, 투표 등록, 비밀번호 검증 기반 세션 삭제 단위 테스트 통과 (3 tests)
- **Production Build:**
  - `npm run build` 성공 (Static / Dynamic Routes 정상 빌드 확인)
- **Monetization Ready:**
  - 상단/하단 광고 배너 슬롯(`AdBanner.tsx`) 완비 (Google AdSense / Kakao AdFit 즉시 교체 가능 구조)

