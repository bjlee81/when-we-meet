# Change Document: 20261109_Add_User_Feedback_System

- **Date:** 2026-11-09
- **User Request:**
  "개발자에게 의견보내기 같은 기능을 넣으면 어때? -> 응 tdd 로 진행해줘."

- **Proposed Changes:**
  1. `src/lib/db.ts`:
     - `feedbacks` 테이블 스키마 추가 (`id`, `category`, `content`, `contact`, `createdAt`, `updatedAt`).
     - `initDb()` 내에 `feedbacks` 테이블 자동 생성 및 구버전 스키마 호환 마이그레이션 추가.
     - `createFeedback(input)`: 사용자 피드백 신규 등록 (내용 공백 검증).
     - `getAllFeedbacksForAdmin()`: 최신 등록순으로 전체 피드백 목록 반환.
     - `adminDeleteFeedback(id)`: 피드백 삭제.
  2. `src/__tests__/feedback.test.ts` 단위 테스트 작성 (TDD Red -> Green):
     - 피드백 저장 및 필수 필드 검증 (빈 내용 제출 시 오류 반환).
     - 관리자용 목록 조회 및 역순 정렬 확인.
     - 개별 피드백 삭제 기능 검증.
  3. API 라우트 추가:
     - `POST /api/feedback`: 사용자의 의견 제출 처리.
     - `GET /api/admin/feedbacks`, `DELETE /api/admin/feedbacks`: 관리자 전용 피드백 조회 및 삭제.
  4. 프론트엔드 UI 컴포넌트 추가:
     - `src/components/FeedbackButton.tsx`: 화면 우측 하단 플로팅 "💡 의견 보내기" 버튼 및 모달 폼.
     - 카테고리(기능 제안/버그 제보/응원/기타), 본문, 이메일/연락처(선택) 입력 및 제출 처리.
     - `src/app/layout.tsx`에 전역 배치.
     - `src/app/admin/page.tsx`에 "💡 사용자 의견" 탭 추가하여 관리자가 직접 열람/삭제 관리.

- **Reasoning:**
  - 초기 웹서비스에서 사용자의 피드백을 실시간으로 수집하여 버그를 조기 파악하고 실사용자의 요구사항을 빠르게 반영하기 위함입니다.
  - 외부 유료 API나 서드파티 서비스 의존 없이 SQLite/Turso DB에 저장하고 `/admin` 대시보드에서 안전하게 관리합니다.

- **Impact Analysis:**
  - 기존 모임 일정 조율 및 투표 기능에는 영향을 주지 않으며, 신규 테이블(`feedbacks`)과 컴포넌트가 추가됩니다.
  - 비회원 사용자 누구나 손쉽게 의견을 남길 수 있습니다.

- **Verification Steps:**
  1. Red: `src/__tests__/feedback.test.ts` 작성 및 실패 확인.
  2. Green: DB CRUD 및 API 구현 후 테스트 통과 확인.
  3. UI 연동 및 전체 테스트(`npm test`), Next.js 프로덕션 빌드(`npm run build`) 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Files Created/Modified:**
  - `src/lib/db.ts`: `feedbacks` 테이블 스키마 및 `createFeedback`, `getAllFeedbacksForAdmin`, `adminDeleteFeedback` 함수 구현.
  - `src/__tests__/feedback.test.ts`: 단위 테스트 4개 작성 및 통과 (피드백 저장, 빈 내용 방어, 카테고리 보정, 관리자 조회/삭제).
  - `src/app/api/feedback/route.ts`: 일반 사용자용 피드백 전송 API.
  - `src/app/api/admin/feedbacks/route.ts`: 관리자용 피드백 목록 조회 및 삭제 API.
  - `src/components/FeedbackButton.tsx`: 화면 우측 하단 플로팅 "💡 의견 보내기" 버튼 및 카테고리별 팝업 모달.
  - `src/app/layout.tsx`: 전역 레이아웃에 `FeedbackButton` 배치.
  - `src/app/admin/page.tsx`: "💡 사용자 의견" 관리 탭 추가 (카테고리 뱃지, 작성 시각, 연락처, 본문, 삭제 관리).
- **Test Results:** 48/48 Tests Passed.
- **Production Build:** Next.js 16 빌드 성공 (`/api/feedback`, `/api/admin/feedbacks` 라우트 완비).

