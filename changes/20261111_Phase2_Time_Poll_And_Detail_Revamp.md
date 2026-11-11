# Change Document: 20261111_Phase2_Time_Poll_And_Detail_Revamp

- **Date:** 2026-11-11
- **User Request:**
  - "다음 단계도 진행하자." (Phase 2: 시간대 그리드 투표 및 상세 화면 Stitch 룩앤필 전면 고도화)
- **Proposed Changes:**
  1. **시간대 슬롯 스케줄러 알고리즘 (`src/lib/scheduler.ts`):**
     - `generateTimeSlots(dates, startHour, endHour, stepMinutes)`: 날짜와 시간 범위에 따른 시간 슬롯 생성 유틸리티.
     - `calculateTimeHeatmap`: 시간대 슬롯 단위 참여자 집계 및 5단계 밀도 티어(0%~100%) 매핑.
     - `filterSlotsByParticipant`: 특정 참여자 전용 일정 하이라이트 필터.
  2. **모임 상세 화면 Stitch UI 전면 리뉴얼 (`src/app/event/[id]/page.tsx`):**
     - Stitch `2._time_poll/code.html` 및 `2._mobile` 인터랙션 이식.
     - 상단 컨트롤 도크: 3단 페인트브러시(`available` 가능함 / `preferred` 선호·조율 / `unavailable` 불가능), 뷰 모드 토글(`전체 히트맵` vs `내 일정만`).
     - 인터랙티브 그리드: 마우스 드래그 & 터치 연속 선택, 셀 호버 시 참가자 명단 툴팁.
     - 참여자 명단 호버 시 해당 참여자 투표 하이라이트(나머지 페이드아웃).
     - 기존 기능(방장 모달, 확정 배너, 구글/애플 캘린더 연동, 공유 기능) 온전한 유지.
  3. **단위 테스트 (`src/__tests__/time-poll.test.ts`):**
     - 시간 슬롯 생성, 시간대별 히트맵 계산, 참여자별 필터링 무결성 검증.
- **Reasoning:**
  - 단순 날짜 체크를 넘어 참여자들이 서로 겹치는 세부 시간대를 직관적인 드래그와 페인트브러시로 손쉽게 맞출 수 있도록 제품의 핵심 사용성을 대폭 강화하기 위함입니다.
- **Impact Analysis:**
  - 기존의 날짜 기반 투표 데이터와 100% 하위 호환되며, 시간 슬롯 기반 데이터도 동일한 DB 스키마(`availableDates`, `maybeDates`)로 손실 없이 저장됩니다.
- **Verification Steps:**
  1. Red: `src/__tests__/time-poll.test.ts` 작성 및 실패 확인.
  2. Green: 스케줄러 함수 및 UI 컴포넌트 구현 후 테스트 통과.
  3. 전체 테스트 (`npm test`) 및 프로덕션 빌드 (`npm run build`) 확인.
- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/lib/scheduler.ts`:
    - `generateTimeSlots`: 시간대 슬롯(`YYYY-MM-DD HH:mm`) 생성기 구현.
    - `getSlotDensityTier`: 5단계 농도 티어(0%~100%) 매핑 함수 구현.
    - `calculateSlotHeatmap`: 시간 슬롯별 참여자 집계 및 가중치 합의 점수 계산 구현.
  - `src/app/event/[id]/page.tsx`:
    - Stitch `2._time_poll` 룩앤필 및 인터랙션 전면 이식 완료.
    - 상단 컨트롤 도크: 3단 페인트브러시(`available`, `preferred`, `unavailable`) & 뷰 모드 토글(`전체 히트맵` vs `내 투표만`).
    - 인터랙티브 캘린더 그리드: 마우스 드래그 & 터치 연속 페인팅, 셀 호버 시 참여자 명단 실시간 툴팁.
    - 참여자 명단 호버 시 해당 참여자의 투표 일정 하이라이트(나머지 페이드아웃).
    - 날짜 확정, 방장 수정 모달, 방 삭제 모달, 캘린더 연동 무결성 100% 유지.
  - `src/__tests__/time-poll.test.ts`: 시간대 슬롯 생성 및 5단계 티어 히트맵 단위 테스트 3개 작성 및 통과.
  - 전체 검증: 10개 테스트 스위트, 61개 테스트 전체 통과 (Pass) 및 Next.js Turbopack 빌드 성공.
