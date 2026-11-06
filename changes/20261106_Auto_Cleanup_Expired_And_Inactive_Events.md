# Change Document: 20261106_Auto_Cleanup_Expired_And_Inactive_Events

- **Date:** 2026-11-06
- **User Request:**
  오랫동안 참여자가 없거나, 결정된 날짜가 지나면 해당 모임을 삭제하고 db 에서도 삭제되도록해야할 것 같아.

- **Proposed Changes:**
  1. **자동 정리(Auto Cleanup) 정책 정의:**
     - **조건 1 (날짜 지난 모임):** 후보 종료일(`endDate`)이 오늘 날짜보다 지난 경우 (예: 종료일 + 7일 경과 시 자동 영구 삭제, 또는 종료일 경과 즉시).
     - **조건 2 (방치된 모임):** 생성일(`createdAt`)로부터 14일 이상 지났는데 참여자(votes)가 0명인 모임 자동 영구 삭제.
  2. **DB 정리 로직 (`cleanupExpiredEvents`):**
     - `src/lib/db.ts`에 자동 정리 함수 구현.
     - 조건에 해당하는 `events` 및 연결된 `votes` 영구 삭제.
  3. **실행 트리거 (Trigger):**
     - **방식 A (온디맨드 자동 정리):** 홈 접속 및 모임 생성/조회 시 주기적 백그라운드 정리 (서버리스 환경에서 크론 설정 없이도 자연스럽게 자동 정리).
     - **방식 B (Vercel Cron Job API):** `src/app/api/cron/cleanup/route.ts` 엔드포인트 및 `vercel.json`에 일 1회 cron 등록 지원.
     - **방식 C (관리자 수동 트리거):** `/admin` 페이지에서 "만료/방치 모임 일괄 정리" 버튼 제공.
  4. **TDD 테스트 작성 및 검증:**
     - 과거 날짜 모임 삭제 테스트.
     - 14일 이상 참여자 없는 방치 모임 삭제 테스트.
     - 활성 모임(참여자 있거나 아직 날짜가 남은 모임)은 안전하게 보존되는지 테스트.
     - Vitest 및 Next.js 빌드 검증.

- **Reasoning:**
  - 서버리스 SQLite의 용량 낭비를 막고, 프라이버시 보호를 위해 약속이 끝났거나 사용되지 않는 불필요한 데이터를 자동으로 정리.

- **Impact Analysis:**
  - 사용자는 신경 쓸 필요 없이 DB가 항상 가볍고 최신 상태로 유지됨.

- **Verification Steps:**
  - Vitest 단위 테스트 통과.
  - 빌드 및 배포 검증.

- **Status:** Pending
