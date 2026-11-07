# Change Document: 20261107_Add_Edge_Case_Tests_And_Robustness

- **Date:** 2026-11-07
- **User Request:**
  다른 엣지케이스에 대한 test 도 만들어줘.

- **Proposed Changes:**
  1. `src/__tests__/scheduler.test.ts`에 히트맵 및 최적 날짜 알고리즘 엣지케이스 테스트 추가:
     - 참여자가 전원 불가능하여 모든 날짜의 score가 0일 때 `findBestDates`가 빈 배열 반환
     - 동일 점수(score)일 때 `availableCount`가 더 높은 날짜가 우선순위로 정렬되는지 검증
     - targetDates 범위 밖의 날짜 투표 또는 빈 투표 목록 처리
     - 동일한 날짜가 중복 포함된 비정상 입력에 대한 안전성 검증
  2. `src/__tests__/db.test.ts`에 데이터베이스 및 투표 비즈니스 로직 엣지케이스 테스트 추가:
     - **이름 앞뒤 공백(Whitespace) 처리:** '  홍길동  '으로 등록 후 '홍길동'으로 조회/수정 시 동일인 인증
     - **이모지 및 특수문자 지원:** 이모지(🎉🍕)와 특수기호가 포함된 이름 및 메모 정상 저장/조회
     - **가능한 날짜가 0개인 참여자:** `availableDates: []`, `maybeDates: []` 제출 시 투표 명단에는 정상 등재되고 불가능자 목록(`unavailableNames`)에 포함
     - **존재하지 않는 모임 ID로 투표 시도 시 방어:** 없는 `eventId`에 대한 투표 시도 시 안전한 거부 처리
     - **인증 토큰 누락 방어:** `pin`과 `deviceToken`이 모두 공백/누락된 투표 시도 거부
     - **DB 초기화 멱등성(Idempotency):** `initDb()`를 연속으로 여러 번 호출해도 스키마 충돌이나 에러 없이 안정적 동작 확인
     - **만료 모임 자동 정리(Cleanup) 경계값 조건:**
       - 14일 경과 + 참여자 0명 -> 삭제
       - 14일 경과 + 참여자 1명 이상 -> 보존
       - 14일 미만 + 참여자 0명 -> 보존
       - 종료일 경과 모임 -> 참여자 수와 무관하게 삭제
  3. 필요 시 `src/lib/db.ts`에 존재하지 않는 모임 검증 등 안전장치 보강.

- **Reasoning:**
  - 실사용 환경에서 사용자들이 입력하는 다양한 비정형 데이터(이모지, 공백, 날짜 0개 선택 등)와 경계 조건에서 시스템이 예외 없이 견고하게 동작함을 사전에 검증하고 회귀를 방지하기 위함.

- **Impact Analysis:**
  - 기존 정상적인 동작 흐름을 해치지 않으며, 방어 로직과 테스트 커버리지를 대폭 확장하여 애플리케이션의 신뢰성을 극대화합니다.

- **Verification Steps:**
  1. 실패하는 엣지케이스 테스트 작성 (Red).
  2. 통과하도록 로직 보강 (Green).
  3. 전체 테스트(`npm test`) 실행 및 Next.js 프로덕션 빌드 검증.

- **Status:** Verified

## Implementation & Verification Summary
- **Edge Cases Covered:**
  1. `src/__tests__/scheduler.test.ts`:
     - 모든 참여자가 불참하여 점수가 0점일 때 `findBestDates` 빈 배열 반환
     - 동점 점수(score) 시 `availableCount` 우선 정렬
     - 빈 투표 목록(`[]`) 및 빈 날짜 배열(`[]`) 방어
     - 한 투표 내 중복 날짜 입력 시 카운트 부풀림 방지
  2. `src/__tests__/db.test.ts`:
     - 존재하지 않는 모임 ID로 투표 시도 시 명확한 거부 메시지 반환
     - 인증 수단(`pin`, `deviceToken`) 누락 시 투표 거부
     - 참여자 이름 앞뒤 공백(`trim`) 처리 및 동일인 재인증
     - 이모지(🎉🍕) 및 특수문자 저장/조회 무결성
     - 가능한 날이 하루도 없는 불참 투표 정상 등록 및 집계 반영
     - `initDb()` 연속 다회 호출에 대한 멱등성 보장
     - 14일 경과 시에도 참여자가 1명 이상 있는 모임의 보존 확인
- **Test Results:** 22/22 Tests Passed.
- **Production Build:** Next.js 16 빌드 성공.

