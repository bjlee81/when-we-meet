# Change Document: 20261106_Weekly_Calendar_View_And_Ad_Integration

- **Date:** 2026-11-06
- **User Request:**
  날짜별 가능 여부 선택을 주단위로 표현하는게 더 좋을 것 같아. 월요일부터로. 그리고 수정 방지 PIN 은 빼고, 광고도 진행하자.

- **Proposed Changes:**
  1. **주단위 캘린더 뷰 (월요일 시작: Mon ~ Sun):**
     - 후보 날짜들의 범위를 월요일 시작 주 단위(7열 그리드: 월, 화, 수, 목, 금, 토, 일)로 정렬하여 표시.
     - 후보 기간 이전/이후의 빈 요일 패딩 처리.
     - 내 날짜 선택 캘린더 및 취합 히트맵 캘린더 둘 다 월요일 시작 7열 주간 달력 형태로 개편.
     - 주말(토, 일) 컬러 구분.
  2. **수정 방지 PIN 제거 및 브라우저 기기 인증 단순화:**
     - UI에서 PIN 입력 필드 완전 제거.
     - 브라우저 고유 기기 토큰(`deviceToken`)만으로 100% 자동 본인 인증 처리 (이름만 입력하면 내 기기는 자동 수정, 타 기기는 도용 방어).
  3. **광고(Ad) 컴포넌트 실제 연동 및 가이드 강화:**
     - `AdBanner.tsx`를 실제 광고 태그(Google AdSense / Kakao AdFit)를 삽입할 수 있는 스크립트 로더 및 목업/실제 광고 전환 구조로 업그레이드.
     - Google AdSense 클라이언트 ID 및 카카오 애드핏 연동 환경 변수 지원.
  4. **단위 테스트 및 빌드 검증:**
     - PIN 없는 브라우저 기기 토큰 인증 및 주간 달력 생성 유틸리티 Vitest 테스트 추가.
     - `npm test` 및 `npm run build` 통과 확인.

- **Reasoning:**
  - 사용자에게 가장 익숙한 주간 달력(월~일) UI를 제공하여 한눈에 일정을 파악하기 쉽게 개선.
  - 번거로운 PIN 입력을 없애고 브라우저 자동 식별로만 작동시켜 사용성을 극대화.
  - 광고 배너를 실제 수익화 가능한 형태로 구체화.

- **Impact Analysis:**
  - UI가 깔끔한 주 단위 달력 테이블로 변경되어 일정 조율이 직관적임.
  - 모바일에서도 가로 스크롤 없이 7열이 예쁘게 표시되도록 모바일 최적화 CSS 적용.

- **Verification Steps:**
  - Vitest 테스트 통과.
  - 빌드 오류 없음 확인.
  - 주간 그리드 월요일 시작 정상 동작 확인.

- **Status:** Verified

## Verification Results
1. **주단위(월요일 시작) 7열 캘린더:**
   - `src/lib/scheduler.ts`의 `generateWeeklyCalendarGrid` 함수로 월~일 7열 정렬 및 월요일 시작 전/일요일 종료 후 빈칸 패딩 처리.
   - Vitest 단위 테스트 통과 (`generates weekly calendar grid starting on Monday with proper padding`).
   - 내 투표 선택 캘린더와 전체 취합 히트맵 캘린더 모두 7열 주간 달력 뷰 적용. 토요일(파랑), 일요일(빨강) 시각적 구분.
2. **수정 방지 PIN 제거 및 브라우저 기기 인증 자동화:**
   - 복잡한 PIN 입력 필드를 UI에서 완전히 제거.
   - 브라우저 고유 기기 토큰(`wwm_device_token`)만으로 백그라운드에서 투표 작성자를 자동 인식하여 "내 기기 인증됨" 뱃지 제공.
3. **광고(Ad) 진행 및 연동 스크립트:**
   - `src/app/layout.tsx`에 Google AdSense 및 Kakao AdFit SDK 로더 연동.
   - `src/components/AdBanner.tsx`에 실제 `kakao_ad_area` 및 `adsbygoogle` 태그 렌더링 지원 (환경 변수 `NEXT_PUBLIC_ADFIT_UNIT_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_SLOT_ID`).
4. **빌드 & 테스트 검증:**
   - `npm test` 6개 케이스 전체 통과.
   - `npm run build` 성공.

