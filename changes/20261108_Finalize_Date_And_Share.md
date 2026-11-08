# Change Document: 20261108_Finalize_Date_And_Share

- **Date:** 2026-11-08
- **User Request:**
  우선순위 높음의 1,2 진행하자. 단 TDD 기반으로 진행해서 오류가 최소화 되도록
  (1: 날짜 확정 기능, 2: 공유 기능(카카오톡/링크 복사))

- **Proposed Changes:**
  1. **날짜 확정 (DB/API)** — `src/lib/db.ts`
     - `events.finalDate TEXT` (nullable) 컬럼 추가: `CREATE TABLE` 정의 + `ALTER TABLE` 마이그레이션 (운영 DB 호환, 실패 무시).
     - `EventData.finalDate?: string | null`, `getEventById`가 반환.
     - 신규 `finalizeEventDate(eventId, password, finalDate | null)`:
       방장 비밀번호 검증 → `finalDate`가 `event.dates`에 포함되는지 검증 → 저장(+`updatedAt` 갱신). `null`이면 확정 해제.
     - `submitVote`: 확정된 모임이면 투표 등록/수정 거부 (확정 해제 시 다시 허용).
     - `src/app/api/events/[id]/route.ts` PATCH: `finalDate` 필드 처리 (`undefined`=변경없음, `null`/빈문자열=해제).
  2. **날짜 확정 (UI)** — `src/app/event/[id]/page.tsx`
     - 확정 시 "✅ 확정된 날짜" 배너 표시, 투표 폼 잠금 안내.
     - 방장이 비밀번호로 날짜를 확정/해제하는 모달 (추천 날짜가 있으면 기본 선택).
  3. **공유 기능** — 신규 `src/lib/share.ts` (순수 함수, 테스트 용이)
     - `buildShareMessage({title, finalDate, location}, url)`: 공유 제목/본문/URL 생성 (확정 여부에 따라 문구 분기).
     - 페이지의 공유 버튼: `navigator.share`(모바일 공유 시트 → 카카오톡 포함) 사용, 미지원/취소 외 실패 시 링크 복사 폴백. 별도 카카오 SDK 키 불필요.

- **Reasoning:**
  - 현재는 조율만 가능하고 결론(확정)을 공유할 방법이 없음. 확정/잠금으로 혼선을 방지.
  - 공유는 카카오톡 사용 비중이 높아 모바일 공유 시트를 기본으로, 키/도메인 등록이 필요한 카카오 SDK는 제외해 장애 요소 최소화.
  - 운영 DB 스키마 불일치로 오류가 반복된 이력이 있어, 컬럼은 nullable + 마이그레이션 + 구스키마 재현 테스트로 방어.

- **Impact Analysis:**
  - 기존 데이터는 `finalDate = NULL`이므로 동작 변화 없음(미확정).
  - 확정된 모임은 투표 등록/수정이 거부됨(의도된 동작). 방장이 해제하면 복구.
  - 기존 `events` 스키마에 컬럼이 없어도 `initDb()`가 자동 추가.

- **Verification Steps:**
  1. Red: `db.test.ts`(확정/잠금/해제/검증/마이그레이션), `share.test.ts` 실패 확인.
  2. Green: 구현 후 전체 테스트 통과.
  3. Refactor 후 `npm test`, `npm run build`.

- **Status:** Verified

## Implementation & Verification Summary
- **Files:** `src/lib/db.ts`, `src/lib/share.ts`(신규), `src/app/api/events/[id]/route.ts`, `src/app/event/[id]/page.tsx`, `src/__tests__/db.test.ts`, `src/__tests__/share.test.ts`(신규)
- **TDD:** Red(finalizeEventDate 미존재, share 모듈 미존재로 실패) → Green(구현 후 37/37 통과) → 전체 테스트/빌드 통과.
- **테스트 범위:** 확정 기본값 null, 잘못된 비밀번호/후보 외 날짜/없는 모임 거부, 확정·변경·해제, 확정 시 신규 투표·수정 차단 및 해제 후 복구, finalDate 컬럼 없는 구스키마 마이그레이션, 공유 문구(미확정/확정/장소 유무/null·빈 값/잘못된 날짜/제목 공백).
- **API 스모크 테스트(next start):** 잘못된 PW 400, 후보 외 날짜 400, 확정 성공, 확정 후 투표 거부, GET에 finalDate 노출, 해제 후 투표 재개, 장소 수정 기존 동작 유지, 페이지 200.
- **공유:** 별도 카카오 SDK 없이 `navigator.share`(모바일 공유 시트에서 카카오톡 선택) + 미지원 시 링크 복사 폴백. UI 동작은 수동 확인 필요(브라우저 공유 시트).

