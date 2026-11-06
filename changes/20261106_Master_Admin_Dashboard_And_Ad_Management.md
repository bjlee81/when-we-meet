# Change Document: 20261106_Master_Admin_Dashboard_And_Ad_Management

- **Date:** 2026-11-06
- **User Request:**
  대시보드에 설정이 어딨어?? 방생성후에 말하는거면 그건 UX 가 안돼. 전체관리자단에서 설정되어야지.

- **Proposed Changes:**
  1. **전체 관리자 대시보드 (`/admin`) 신규 구축:**
     - 서비스 운영자(Master Admin) 전용 페이지.
     - 마스터 관리자 비밀번호 인증(세션/쿠키 기반 또는 간편 마스터 키).
     - **광고 설정 탭/섹션 (전역 설정):**
       - 관리자가 사이트 UI에서 직접 구글 애드센스 코드, 카카오 애드핏 코드, 광고 활성화 여부(ON/OFF)를 입력하고 [저장]하면 즉시 전체 웹사이트의 상/하단 배너에 실시간 반영.
     - **전체 모임방 모니터링 & 관리 탭:**
       - 지금까지 생성된 모든 모임 목록(방 제목, 생성일, 참여자 수, 기간, 상태) 한눈에 조회.
       - 마스터 권한으로 불량/테스트 모임 즉시 강제 삭제 기능.
  2. **전역 사이트 설정(Settings) 테이블 추가:**
     - SQLite에 `settings (key TEXT PRIMARY KEY, value TEXT)` 테이블 생성.
     - `ad_google_client_id`, `ad_google_slot_id`, `ad_kakao_unit_id`, `ad_custom_html`, `ad_enabled` 저장.
  3. **AdBanner 컴포넌트 실시간 동기화:**
     - 클라이언트가 마스터 관리자가 설정한 전역 광고 정보를 API(`/api/settings`)로 받아와 즉시 렌더링.
  4. **TDD 테스트 작성 및 검증:**
     - `settings` CRUD 및 마스터 관리자 인증 API 테스트.
     - Vitest 및 `npm run build` 검증.

- **Reasoning:**
  - 사용자(방장)에게 복잡한 광고 설정이나 환경변수 수정을 맡기는 것은 잘못된 UX이며, 서비스 소유자가 **별도의 전체 관리자 페이지(`/admin`)**에서 광고 코드와 전체 모임방을 한곳에서 총괄 제어하는 것이 올바른 프로덕션 아키텍처입니다.

- **Impact Analysis:**
  - 일반 사용자는 방 생성 및 일정 조율만 심플하게 사용.
  - 서비스 운영자는 `/admin`에서 원클릭으로 광고 교체 및 모임 현황 총괄 관리 가능.

- **Verification Steps:**
  - Vitest 테스트 통과.
  - `/admin` 페이지 빌드 및 API 작동 확인.

- **Status:** Pending
