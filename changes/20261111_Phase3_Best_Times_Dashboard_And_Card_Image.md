# Change Document: 20261111_Phase3_Best_Times_Dashboard_And_Card_Image

- **Date:** 2026-11-11
- **User Request:**
  - "그 다음 진행하자." (Phase 3: Top 3 최적 시간 추천 대시보드 및 확정 안내장 이미지 생성)
- **Proposed Changes:**
  1. **Top 3 추천 순위 알고리즘 (`src/lib/scheduler.ts`):**
     - `findTopRankedDates(heatmap, totalParticipants, limit = 3)`:
       - 점수(score), 만장일치 여부, 참석 인원수, 불참자 수를 종합 평가하여 1위/2위/3위 순위 도출.
       - 각 랭크별 `isUnanimous`(만장일치 여부), `matchRatio`(참석률 %), `unavailableNames`(불참자 목록) 산출.
  2. **확정 안내장 카드 이미지 생성기 (`src/lib/invitation-card.ts`):**
     - HTML5 Canvas 기반의 SNS 공유용 1080x1350 고화질 모임 확정 안내장 카드 렌더러.
     - 모임 제목, 확정 일시, 장소, 참석자 명단이 담긴 세련된 그래픽 합성 및 원클릭 PNG 다운로드 지원.
  3. **Stitch 3단계 결과 대시보드 UI 연동 (`src/app/event/[id]/page.tsx`):**
     - Stitch `3._results_best_times/code.html` 벤토 그리드 적용.
     - 1순위 Best Match 히어로 벤토 카드 + 2/3순위 대안 카드.
     - 참여자별 응답 타임라인 비교 바.
     - 날짜 확정 시 "확정 안내장 이미지 저장" 기능 연동.
  4. **단위 테스트:**
     - `src/__tests__/top-ranks.test.ts`: Top 3 정렬 및 만장일치 판별 검증.
     - `src/__tests__/invitation-card.test.ts`: 안내장 텍스트/포맷터 검증.
- **Reasoning:**
  - 참여자들의 투표 결과를 바탕으로 방장이 최선의 일정을 1초 만에 판단하여 확정할 수 있도록 돕고, 확정된 약속을 카카오톡/인스타그램에 멋지게 공유할 수 있는 감성 초대장 경험을 제공하기 위함입니다.
- **Impact Analysis:**
  - 기존 데이터 및 투표 흐름을 그대로 유지하면서, 결과 분석 탭과 확정 후 공유 편의성이 비약적으로 강화됩니다.
- **Verification Steps:**
  - Red: `top-ranks.test.ts`, `invitation-card.test.ts` 테스트 작성 및 동작 검증.
  - Green: 알고리즘 및 UI 구현 후 단위 테스트 66개 전체 통과 (`npm test`).
  - Next.js Turbopack 프로덕션 빌드 성공 확인 (`npm run build`).
- **Status:** Verified
