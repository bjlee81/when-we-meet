# 삼성 인터넷 "Failed to fetch" 대응 (재시도 + 친화적 에러)

- **Date:** 2026-11-11
- **User Request:** 2026.11.16~2026.12.23로 일정만들기를 하니까 Failed to fetch 라고 떠 / 삼성브라우저에서 하니까 그러는거같아.
- **Proposed Changes:**
  - `src/lib/fetch-json.ts` 신규: 네트워크 단계 실패(`TypeError: Failed to fetch`)시 최대 2회 재시도(짧은 백오프)하고, 끝내 실패하면 한국어 안내 문구로 변환.
  - `src/__tests__/fetch-json.test.ts` 신규: 재시도/성공/HTTP 오류 비재시도/최종 실패 메시지 검증.
  - `src/app/page.tsx`의 모임 생성 요청에 적용 (`cache: 'no-store'` 포함).
- **Reasoning:** 로컬/프로덕션 빌드에서 동일 입력(`프로젝트 회식`, 11/16~12/23)은 200 성공. 서버가 아닌 브라우저/네트워크 단계 실패로 판단.
- **Impact Analysis:** 생성 API가 멱등하지 않아 요청이 서버에 도달 후 응답만 유실되면 방이 중복 생성될 수 있으나(빈 방은 14일 후 자동 정리), 실패율 감소 이득이 큼. HTTP 오류 응답은 재시도하지 않음.
- **Verification Steps:** vitest 단위 테스트, `npm test`, `npm run build`.
- **Status:** Verified (npm test 53 passed, build OK). 단, 어제 배포 이후 발생한 회귀 원인은 미확정 - 추가 진단 필요

## 추가 변경 (광고 차단기 우회 대응) - 2026-11-11
- 사용자 확인: 삼성 인터넷 광고 차단을 끄면 생성됨 → 필터 규칙이 요청을 차단.
- `fetchJsonWithRetry`가 URL 배열을 받아 재시도마다 다음 후보 URL로 폴백 (테스트 추가).
- 중립 별칭 엔드포인트 추가: `/api/meetups`(POST, `/api/events`와 동일), `/api/site-config`(GET, `/api/admin/settings` GET과 동일).
- 홈 생성 요청은 `['/api/meetups','/api/events']` 순으로 시도, `AdBanner`는 `/api/site-config` 사용 (admin 경로 노출 제거).
- `vitest.config.ts`: `fileParallelism: false` (db.test/feedback.test의 local.db 공유로 인한 간헐 실패 해결).
- 검증: npm test 54 passed(반복 3회 안정), build OK, 별칭 라우트 로컬 호출 200.
- 한계: 실제 삼성 인터넷 차단 규칙은 재현 불가 → 배포 후 사용자 기기 확인 필요.

## 추가 변경 2 (폼 제출 폴백) - 2026-11-11
- 사용자 확인: 새 코드 반영 후에도 fetch(두 경로 + 재시도) 차단됨.
- `src/app/create/route.ts` 신규: HTML 폼 POST → 모임 생성 후 303 리다이렉트(`/event/<id>`), 오류 시 `/?error=...`.
- `NetworkError` 클래스 추가. 홈 폼은 fetch가 NetworkError로 끝나면 `form.submit()`(네이티브 페이지 이동)으로 폴백. `?error=` 쿼리를 읽어 에러 표시.
- 테스트 `create-form.test.ts` 추가. npm test 56 passed, build OK, 로컬 curl 303 확인.
- 한계: 실기기(삼성 인터넷 광고차단) 확인 필요.
