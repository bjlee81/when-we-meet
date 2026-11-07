# Change Document: 20261107_Fix_Votes_Table_Missing_CreatedAt_Column

- **Date:** 2026-11-07
- **User Request:**
  한명이 입력한 후에 다른 사람이 추가로 입력하려니까 'SQLITE_UNKNOWN: SQLite error: table votes has no column named createdAt' 에러 발생.

- **Proposed Changes:**
  1. `src/lib/db.ts`의 `initDb()` 함수에 `votes` 테이블 마이그레이션 구문 추가:
     - `ALTER TABLE votes ADD COLUMN createdAt TEXT;`
     - `ALTER TABLE votes ADD COLUMN maybeDates TEXT DEFAULT '[]';` (잠재적 스키마 누락 방지)
     - 기존 행들의 `createdAt`이 NULL인 경우 현재 시각으로 채워주는 보정 쿼리 실행
  2. `src/__tests__/db.test.ts`에 기존 스키마(createdAt 컬럼이 없는 votes 테이블)에서 `initDb()`를 실행했을 때 컬럼이 자동 마이그레이션되고 정상적으로 투표(신규 INSERT 및 수정 UPDATE)가 작동하는지 검증하는 단위 테스트 추가.

- **Reasoning:**
  - Turso DB 또는 이전 버전에서 생성된 SQLite 데이터베이스의 `votes` 테이블에 `createdAt` 컬럼이 누락되어 있을 수 있습니다.
  - `initDb()`는 `CREATE TABLE IF NOT EXISTS`만 수행하므로 이미 존재하는 테이블의 스키마 변경을 반영하지 못하며, 기존 마이그레이션 try-catch 블록에 `pinHash`와 `deviceToken`만 포함되어 있고 `createdAt`이 누락되어 있었습니다.
  - 이로 인해 신규 투표 생성(`INSERT INTO votes (..., createdAt)`) 및 기존 투표 갱신(`UPDATE votes SET ..., createdAt = ...`) 시 SQLite 오류 `table votes has no column named createdAt`가 발생했습니다.

- **Impact Analysis:**
  - `initDb()`에 마이그레이션 구문이 추가되므로, 기존 데이터 손실 없이 구버전 DB 스키마가 최신 스키마로 안전하게 자동 업데이트됩니다.
  - 새로운 사용자가 투표를 등록하거나 기존 사용자가 투표를 수정할 때 컬럼 누락 에러 없이 정상적으로 저장됩니다.

- **Verification Steps:**
  1. `createdAt` 컬럼이 없는 상태의 가상 DB/테이블 상태를 시뮬레이션하는 단위 테스트 작성 (Red 확인).
  2. `src/lib/db.ts`에 컬럼 추가 마이그레이션 구현 후 테스트 통과 확인 (Green 확인).
  3. 전체 vitest 테스트(`npm test`) 실행 및 Next.js 빌드(`npm run build`) 정상 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Target File:** `src/lib/db.ts`, `src/__tests__/db.test.ts`
- **TDD Verification:**
  - Red: 기존 `votes` 테이블에 `createdAt` 컬럼이 없는 상황 재현 시 `LibsqlError: SQLITE_ERROR: table votes has no column named createdAt` 에러 재현 확인.
  - Green: `initDb()` 내에 `ALTER TABLE votes ADD COLUMN maybeDates TEXT DEFAULT '[]';`, `ALTER TABLE votes ADD COLUMN createdAt TEXT;`, 및 기존 행 빈값 보정 쿼리 추가 후 테스트 통과.
  - Refactor: 전체 Vitest 10개 테스트 모두 성공 및 Next.js 16 프로덕션 빌드 완벽 통과.

