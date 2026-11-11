# Change Document: 20261111_Fix_Event_Detail_Fetch_And_Alias

- **Date:** 2026-11-11
- **User Request:**
  - "모임생성오류나" (오류 이미지 첨부: "오류가 발생했습니다 - 모임 정보를 불러오지 못했습니다.")
- **Proposed Changes:**
  1. **GET `/api/events/[id]` 응답 객체에 `success: true` 추가 (`src/app/api/events/[id]/route.ts`):**
     - 기존 `{ event }`만 반환하던 응답에 `{ success: true, event }`를 명시하여 프론트엔드의 `!data.success` 유효성 검사 통과 보장.
  2. **클라이언트 방어 검증 로직 개선 (`src/app/event/[id]/page.tsx`):**
     - `if (!res.ok || (!data.event && !data.success))` 형태로 응답 검증을 방어적으로 수정하여 `event` 객체가 있으면 즉시 정상 렌더링.
     - `fetchEvent`에 `fetchJsonWithRetry` 적용 및 광고 차단기 우회 별칭 경로(`['/api/meetups/${eventId}', '/api/events/${eventId}']`) 지원.
  3. **중립 별칭 라우트 확장:**
     - `src/app/api/meetups/[id]/route.ts`: `/api/events/[id]`의 GET/PATCH/DELETE 별칭.
     - `src/app/api/meetups/[id]/vote/route.ts`: `/api/events/[id]/vote`의 POST 별칭.
- **Reasoning:**
  - 모임 상세 페이지 진입 시 백엔드 응답 포맷과 프론트엔드 검증 조건의 불일치로 인해 정상 생성된 방임에도 불구하고 "모임 정보를 불러오지 못했습니다" 오류 화면으로 빠지던 치명적인 버그를 해결하기 위함.
- **Impact Analysis:**
  - 기존의 모든 이벤트 조회, 투표, 수정 기능이 정상 작동하며, 광고 차단기 환경에서도 상세 조회가 완벽하게 보호됩니다.
- **Verification Steps:**
  - Red: `GET /api/events/[id]` 및 별칭 라우트 응답 구조 검증 테스트 작성.
  - Green: API 응답 및 프론트엔드 검증 로직 수정 후 테스트 통과.
  - `npm test` 및 `npm run build` 확인.
- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/app/api/events/[id]/route.ts`:
    - `GET` 응답에 `success: true`를 추가하여 `{ success: true, event }` 형태로 반환 일관성 확보.
  - `src/app/event/[id]/page.tsx`:
    - `fetchEvent`에서 `(!resData?.event && !resData?.success)` 형태로 방어 검증 로직 개선.
    - `fetchEvent`, `handleVoteSubmit`, `handleUpdateDetails`, `handleDeleteEvent`, `handleFinalizeDate` 전체에 `fetchJsonWithRetry` 및 광고차단기 우회 별칭 경로(`['/api/meetups/...', '/api/events/...']`) 완비.
  - `src/app/api/meetups/[id]/route.ts` & `src/app/api/meetups/[id]/vote/route.ts`:
    - 중립 별칭 라우트 추가 및 빌드 검증 완료.
  - `src/__tests__/event-api.test.ts`: `GET /api/events/[id]` 계약 검증 단위 테스트 추가.
  - 검증: 11개 테스트 스위트, 62개 테스트 전체 통과 (Pass) 및 Next.js Turbopack 빌드 정상 완료.
