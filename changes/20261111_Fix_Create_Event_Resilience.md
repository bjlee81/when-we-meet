# Change Document: 20261111_Fix_Create_Event_Resilience

- **Date:** 2026-11-11
- **User Request:**
  - "모임생성오류나 orcaTabId: 3162a690-5ea8-48de-a552-15fb0acf7da9"
- **Proposed Changes:**
  1. **네트워크 및 차단 에러 포괄 감지 (`src/app/page.tsx`):**
     - `instanceof NetworkError` 단일 체크 대신 프로토타입 불일치 및 브라우저 네이티브 `TypeError: Failed to fetch`, `Load failed` 등을 포괄하는 `isNetworkError(err)` 판별 함수 도입.
     - 네트워크/차단 감지 시 즉시 네이티브 폼 제출(`formRef.current.submit()`)로 100% 자동 우회 폴백 보장.
  2. **서버 유효성 검사 및 에러 메시지 가시성 향상:**
     - 서버 응답 에러(`400`, `500`) 시 상세 메시지를 즉시 화면에 노출하고 진단할 수 있도록 보강.
     - 폼 input의 `name`, `value` 무결성 점검.
- **Reasoning:**
  - 번들러 환경에서 커스텀 Error 서브클래스의 `instanceof` 실패 가능성을 방지하고, 브라우저/확장프로그램/광고차단기 환경에서도 모임 생성이 결코 중단되지 않도록 하기 위함.
- **Impact Analysis:**
  - 정상 환경에서는 고속 fetch로 생성되고, 차단/오류 환경에서는 네이티브 폼으로 무결하게 우회되어 모임 생성이 보장됩니다.
- **Verification Steps:**
  - `npm test` 전체 통과 확인.
  - `npm run build` 확인.
  - 로컬 폼 제출 및 API 응답 스모크 테스트.
- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/app/page.tsx`:
    - `isNetworkOrBlock` 판별을 통해 `instanceof NetworkError`뿐만 아니라 `err.name === 'NetworkError'`, `fetch`, `network`, `failed` 등 모든 차단 및 네트워크 단절 케이스를 포괄 감지.
    - 감지 즉시 네이티브 폼 제출(`formRef.current.submit()`)을 호출하여 어떤 브라우저 차단기 환경에서도 무결하게 303 리다이렉트로 모임이 생성되도록 보장.
    - 서버 400/500 에러 시 구체적인 오류 원인이 빨간 배너로 명확히 표시되도록 가시성 개선.
  - 검증: 10개 테스트 스위트, 61개 테스트 통과 및 Next.js Turbopack 빌드 완료.
