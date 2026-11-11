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
