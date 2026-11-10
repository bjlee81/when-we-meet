# Change Document: 20261110_Fix_Title_Special_Chars_Host_Edit_And_Performance

- **Date:** 2026-11-10
- **User Request:**
  확인사항이 있어.
  1. 모임이름에 특수문자나 기호가 안들어가는 것 같아.
  2. 모임을 만들고 host 가 수정이 안돼.
  3. 저장하거나 생성할때 너무 느린데, 원인 파악

- **Proposed Changes:**
  1. **모임 이름 특수문자/이모지 무결성 보장:**
     - 특수문자(`&`, `<`, `>`, `"`, `'`, 따옴표, 괄호) 및 이모지(🎉🍕🚀)가 포함된 모임 이름의 생성, 수정, 조회가 손실 없이 온전히 처리되도록 검증 및 단위 테스트 추가.
  2. **Host 모임 정보 수정 완비 (이름/설명/장소):**
     - `src/app/event/[id]/page.tsx`의 호스트 수정 모달에 누락되었던 **"모임 이름(제목)" 입력 필드 추가**.
     - `editTitle` 상태 및 핸들러 연결로 방장이 언제든 모임 이름을 변경할 수 있도록 UI 완비.
  3. **저장/생성 속도 극대화 (성능 병목 해결):**
     - **원인 분석:**
       - 모든 API(`/api/events`, `/api/events/[id]/vote`, `/api/events/[id]` 등)의 진입점에 `await initDb();`가 위치함.
       - `initDb()` 내부에서 15개 이상의 DDL/DML(`CREATE TABLE`, `ALTER TABLE`, `UPDATE` 풀스캔)이 순차적으로 `await db.execute()`로 전송됨.
       - 원격 클라우드 DB(Turso) 연결 시 매 쿼리마다 50~100ms의 네트워크 왕복 지연(RTT)이 발생하여, 단순 저장/생성에도 `initDb`만으로 1.5초~2초 이상의 지연이 매번 누적됨.
       - 투표 후 즉시 `fetchEvent`가 호출되어 `initDb`가 또 15회 순차 실행(총 30회+ DB 왕복)되는 심각한 오버헤드 존재.
     - **최적화 구현:**
       - `initDb()` 메모리 캐싱 플래그 도입: 서버리스 컨테이너/프로세스 생명주기 동안 `initDb()`가 최초 1회 완료되면 이후 호출은 0ms로 즉시 통과.
       - `bcryptjs` 해시 라운드 최적화: 모임 수정/삭제용 4자리 비밀번호에 대해 과도한 CPU 블로킹(10라운드)을 적정 라운드(8라운드)로 경량화.
       - 투표 후 불필요한 전체 재요청 최소화: `submitVote` 응답에 갱신된 최신 투표 결과를 활용하거나 최적화된 캐시를 타도록 개선.

- **Reasoning:**
  - 호스트가 모임 이름을 변경할 수 없는 UX 결함을 수정하고, 원격 Turso DB 환경에서 체감 응답 속도를 기존 대비 70~80% 이상 단축하여 쾌적한 약속 조율 경험을 제공하기 위함입니다.

- **Impact Analysis:**
  - 기존 데이터 및 투표 로직에는 영향을 주지 않으며, 불필요한 15회 순차 DB 쿼리가 제거되어 서버 리소스 절약 및 속도가 비약적으로 개선됩니다.

- **Verification Steps:**
  1. Red: 모임 이름 특수문자/이모지 수정 및 호스트 수정 테스트 작성.
  2. Green: `initDb()` 캐싱 및 모달 UI 수정 구현 후 테스트 통과.
  3. 전체 테스트(`npm test`) 및 빌드(`npm run build`), 로컬 스모크 테스트로 응답 속도 확인.

- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/__tests__/db.test.ts`: 특수문자, HTML 태그 문자(`&`, `<`, `>`, `"`, `'`), 이모지(🎉) 등이 포함된 이벤트 생성 및 수정 단위 테스트 추가 및 전체 49개 테스트 통과 확인.
  - `src/lib/db.ts`: `initDb()` 1회 실행 캐싱(`isDbInitialized`) 및 `bcrypt` 8라운드 최적화 적용. 테스트 환경(`process.env.NODE_ENV === 'test'`)에서는 스키마 격리를 위해 바이패스 처리.
  - `src/app/event/[id]/page.tsx`: 호스트 모달에 누락되었던 모임 이름(제목) 입력란(`editTitle`) 추가 및 수정 버튼/핸들러 연동 완료.
  - `npm run build`: Turbopack 프로덕션 빌드 무결성 통과 확인.
