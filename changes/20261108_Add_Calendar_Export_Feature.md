# Change Document: 20261108_Add_Calendar_Export_Feature

- **Date:** 2026-11-08
- **User Request:**
  "내 캘린더에 담기 (Google Calendar / Apple 캘린더 등록)" 기능 추가

- **Proposed Changes:**
  1. `src/lib/calendar.ts` 신규 유틸리티 모듈 생성:
     - `generateGoogleCalendarUrl(eventInfo)`: Google Calendar 일정 등록 딥링크 URL 생성 (제목, 날짜, 장소, 설명, 원본 모임 링크 포함).
     - `generateIcsContent(eventInfo)`: RFC 5545 표준 iCalendar (.ics) 파일 포맷 문자열 생성 (Apple Calendar, Outlook, 안드로이드 기본 캘린더 호환).
     - 종일 일정(All-day event) 표준에 맞춰 시작일(DTSTART) 및 종료일(DTEND=다음날) 포맷팅 처리.
  2. `src/__tests__/calendar.test.ts` 단위 테스트 작성 (TDD Red -> Green):
     - 구글 캘린더 URL 파라미터 인코딩, 날짜 계산(`YYYYMMDD/YYYYMMDD`), 장소/설명 포함 여부 검증.
     - ICS 문자열 필수 블록(VCALENDAR, VEVENT, DTSTART, DTEND, SUMMARY, LOCATION 등) 및 특수문자 이스케이프 검증.
  3. `src/app/event/[id]/page.tsx` UI 연동:
     - 모임 날짜가 확정(`event.finalDate`)되었을 때 상단 확정 배너 내 "캘린더에 저장" 액션 버튼 그룹 추가:
       - **Google 캘린더**: 클릭 시 구글 캘린더 새 탭에서 일정 추가 화면 즉시 호출.
       - **Apple / 스마트폰 캘린더 (.ics)**: 클릭 시 `.ics` 파일 다운로드 (모바일에서는 누르면 바로 기본 캘린더 앱에 등록 화면 팝업).
     - 확정된 날짜 및 장소 정보가 자동으로 캘린더 필드에 반영되도록 연결.

- **Reasoning:**
  - 날짜가 확정된 후 참여자들이 일정을 잊지 않고 개인 캘린더에 1초 만에 저장할 수 있도록 편의성을 극대화합니다.
  - 회원가입이나 Google API OAuth 인증 없이도 표준 딥링크와 .ics 파일 생성을 통해 100% 클라이언트 사이드에서 즉시 동작하여 장애 요소 없이 가볍고 빠릅니다.

- **Impact Analysis:**
  - 확정된 일정에 한하여 UI에 다운로드/링크 버튼이 제공되며, 기존 데이터 및 미확정 모임의 동작에는 전혀 영향을 주지 않습니다.

- **Verification Steps:**
  1. Red: `src/__tests__/calendar.test.ts` 작성 및 실패 확인.
  2. Green: `src/lib/calendar.ts` 구현 후 단위 테스트 통과.
  3. UI 연결 및 `npm test`, `npm run build` 검증.
  4. Orca 브라우저에서 확정된 모임의 캘린더 다운로드/링크 동작 확인.

- **Status:** Verified

## Implementation & Verification Summary
- **Files:** `src/lib/calendar.ts`(신규), `src/__tests__/calendar.test.ts`(신규), `src/app/event/[id]/page.tsx`
- **TDD:**
  - Red: `generateGoogleCalendarUrl`, `generateIcsContent` 미구현 상태에서 단위 테스트 작성 및 실패 확인.
  - Green: RFC 5545 표준 iCalendar 및 Google Calendar 템플릿 딥링크 생성 로직 구현 후 단위 테스트(4/4) 통과.
  - Integration: 전체 41개 단위 테스트 및 Next.js 16 프로덕션 빌드 성공.
- **주요 기능:**
  1. **Google Calendar 바로 등록**: 모임 확정 시 Google Calendar 딥링크를 생성하여 새 탭에서 종일 일정 등록 창 즉시 연결.
  2. **Apple / Outlook / 기본 캘린더 (.ics 파일 다운로드)**: RFC 5545 표준 사양에 따라 모임 제목, 장소, 설명, 확정 날짜, 조율 웹페이지 URL을 포함한 `.ics` 파일 즉시 다운로드 제공.

