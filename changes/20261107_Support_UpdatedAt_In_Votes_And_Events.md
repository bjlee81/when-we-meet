# Change Document: 20261107_Support_UpdatedAt_In_Votes_And_Events

- **Date:** 2026-11-07
- **User Request:**
  `SQLITE_CONSTRAINT: SQLite error: NOT NULL constraint failed: votes.updatedAt`

- **Proposed Changes:**
  1. `src/lib/db.ts`:
     - `initDb()`:
       - `events` 및 `votes` 테이블의 `CREATE TABLE IF NOT EXISTS` 스키마에 `updatedAt TEXT` 컬럼 추가.
       - 마이그레이션 구문 추가:
         `ALTER TABLE votes ADD COLUMN updatedAt TEXT;`
         `ALTER TABLE events ADD COLUMN updatedAt TEXT;`
       - 기존 레코드 중 `updatedAt`이 NULL인 경우 `createdAt` 또는 현재 시각으로 채워주는 보정 쿼리 실행.
     - `submitVote()`:
       - 신규 INSERT 시 `updatedAt` 컬럼에 `now` 값 전달 (`INSERT INTO votes (..., createdAt, updatedAt) VALUES (..., ?, ?)`).
       - 기존 투표 UPDATE 시 `updatedAt` 컬럼 갱신 (`UPDATE votes SET availableDates = ?, maybeDates = ?, updatedAt = ? WHERE id = ?`).
     - `createEvent()`:
       - 신규 생성 시 `updatedAt` 컬럼에 `createdAt`과 동일한 `now` 값 전달.
     - `updateEventDetails()`:
       - 모임 수정 시 `updatedAt` 컬럼 갱신.
  2. `src/__tests__/db.test.ts`:
     - `votes` 테이블에 `updatedAt TEXT NOT NULL` 제약조건이 존재하는 구버전/타 ORM 스키마 환경을 시뮬레이션하여 신규 투표 생성 및 수정이 제약조건 위반 없이 성공하는지 검증하는 단위 테스트 추가.

- **Reasoning:**
  - 사용자 환경의 SQLite/Turso DB에 `votes.updatedAt` 컬럼이 `NOT NULL` 제약조건으로 정의되어 있어, 현재 코드에서 `updatedAt` 컬럼을 명시하지 않고 INSERT를 실행할 때 `SQLITE_CONSTRAINT: NOT NULL constraint failed: votes.updatedAt` 에러가 발생합니다.
  - 이를 해결하기 위해 `votes` 및 `events` 테이블에 `updatedAt` 컬럼을 정식 지원하고 모든 INSERT 및 UPDATE 쿼리에서 최신 타임스탬프를 기록하도록 보강합니다.

- **Impact Analysis:**
  - `updatedAt` 컬럼이 이미 존재하는 기존 DB(NOT NULL 제약조건 포함) 및 컬럼이 없던 신규/로컬 DB 모두에서 마이그레이션 충돌 없이 완벽히 호환됩니다.
  - 데이터 생성/수정 추적 가능성이 개선됩니다.

- **Verification Steps:**
  1. `votes.updatedAt TEXT NOT NULL` 제약조건이 걸린 테이블에서 `submitVote`를 수행하는 테스트 작성 (Red 확인).
  2. 코드 수정 후 테스트 통과 (Green 확인).
  3. 전체 단위 테스트(`npm test`) 및 프로덕션 빌드(`npm run build`) 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Target Files:** `src/lib/db.ts`, `src/__tests__/db.test.ts`
- **TDD Verification:**
  - Red: `votes` 테이블에 `updatedAt TEXT NOT NULL` 제약조건이 존재하는 환경에서 `submitVote()` 실행 시 `SQLITE_CONSTRAINT: NOT NULL constraint failed: votes.updatedAt` 에러 발생 확인.
  - Green:
    1. `initDb()` 스키마 정의 및 `ALTER TABLE` 마이그레이션에 `updatedAt` 컬럼 추가 및 기존 빈 값 보정.
    2. `createEvent()` 신규 모임 생성 시 `updatedAt` 등록.
    3. `submitVote()` 신규 투표 INSERT 및 기존 투표 UPDATE 시 `updatedAt` 최신 시각 기록.
    4. `updateEventDetails()` 모임 정보 변경 시 `updatedAt` 최신 시각 기록.
  - Refactor: 전체 Vitest 23개 테스트 통과 및 Next.js 16 프로덕션 빌드 성공.

