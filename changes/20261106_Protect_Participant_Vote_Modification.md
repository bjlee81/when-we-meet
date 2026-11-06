# Change Document: 20261106_Protect_Participant_Vote_Modification

- **Date:** 2026-11-06
- **User Request:** 한명이 투표를 하면 다른 사람이 그 이름으로 수정할 수가 있어서 좀 아쉽네
- **Proposed Changes:**
  1. 투표 보안 강화: 참여자가 처음 투표를 등록할 때 4자리 간단 PIN(비밀번호)을 입력하도록 개선 (또는 본인 브라우저 자동 인증 토큰 병행).
  2. DB 테이블 `votes` 스키마에 `pinHash` 컬럼 추가.
  3. 로컬 브라우저(`localStorage`)에는 본인의 투표 인증 정보(PIN 또는 참여자 고유 토큰)를 저장하여 본인 기기에서는 번거로움 없이 자동 수정 가능하게 UX 배려.
  4. 다른 기기나 다른 사람이 해당 이름으로 수정하려고 할 때는 기존에 설정한 PIN 번호를 입력해야만 수정이 가능하도록 검증 로직 구현. 틀릴 경우 수정 거부.
  5. Vitest 단위 테스트 추가 (TDD Red -> Green -> Refactor):
     - 최초 투표 시 PIN 등록
     - 올바른 PIN으로 투표 수정 성공
     - 틀린 PIN으로 투표 수정 실패 (에러 반환)
  6. UI/UX:
     - 투표 폼에 "수정용 4자리 비밀번호 (PIN)" 입력 필드 추가
     - 기존 참여자 이름 클릭 시 "기존 작성자 인증(PIN 입력)" 모달/인라인 필드 제공
- **Reasoning:**
  - 회원가입 없이 익명으로 진행되는 가벼움을 유지하면서도, 타인이 악의적이거나 실수로 다른 친구의 투표를 덮어쓰거나 변경하는 문제를 완벽히 차단.
- **Impact Analysis:**
  - `votes` 테이블에 `pinHash` 추가 (`ALTER TABLE` 또는 `CREATE TABLE IF NOT EXISTS`).
  - 투표 API (`/api/events/[id]/vote`) 요청/응답 스펙에 PIN 검증 추가.
- **Verification Steps:**
  1. Vitest 단위 테스트 작성 및 통과 확인 (PIN 검증 성공/실패).
  2. `npm run build` 검증.
  3. 다른 PIN을 입력했을 때 에러가 반환되는지 확인.
- **Status:** Verified

## Verification Results
- **TDD Test Added:** `src/__tests__/db.test.ts`
  - 최초 투표 시 PIN 해싱 등록 검증 통과
  - 타인이 동일한 이름으로 잘못된 PIN을 입력하여 덮어쓰기 시도 시 403 차단 및 에러 메시지 반환 검증 통과
  - 본인이 올바른 PIN을 입력했을 때만 정상 업데이트 검증 통과
- **UI & UX:**
  - 투표 폼에 "수정 방지용 비밀번호 (PIN)" 필드 추가
  - 본인 브라우저(`localStorage`)에는 입력했던 닉네임과 PIN이 자동 보존되어 재방문 시 번거로운 재입력 없이 바로 수정 가능
- **Build Verification:**
  - `npm run build` 통과
  - `npm test` 5개 케이스 통과

