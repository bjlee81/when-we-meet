# Change Document: 20261111_Stitch_UI_Revamp_Home

- **Date:** 2026-11-11
- **User Request:**
  - "룩앤필이 그대론데 뭐가 바뀐거지?" (디자인 토큰 선언에 그치지 않고 실제 눈에 보이는 홈 화면을 Stitch 기획안 디자인으로 전면 리뉴얼 요청)
- **Proposed Changes:**
  - `src/app/page.tsx` 전면 리뉴얼:
    1. **Stitch Modern Soft Minimalism 적용:** 앰비언트 글로우 배경(`bg-surface`), 글래스모피즘 헤더, 벤토 카드 레이아웃.
    2. **예상 소요 시간 칩(Duration Selector) UI 컴포넌트 추가:** 1시간(티타임) / 2시간(식사) / 3시간(생파·모임) / 반나절 / 종일 선택 인터랙션.
    3. **입력 폼 컴포넌트 고도화:** Stitch 규격(`bg-surface-container-low`, `focus:ring-primary`, `rounded-xl`, 친근한 플레이스홀더).
    4. **하단 서비스 안내 벤토 그리드(3 Feature Cards):** 회원가입 없는 간편함, 실시간 일정 매칭, 중간 장소 추천 안내.
    5. **안정성 유지:** 이전 작업에서 검증된 `fetchJsonWithRetry` 및 네이티브 폼 POST 폴백(`/create`) 완벽 유지.
- **Reasoning:**
  - 토큰 및 폰트 인프라 구축에 이어 사용자가 체감할 수 있는 실제 화면의 비주얼과 룩앤필을 Stitch 프로토타입 수준으로 업그레이드하기 위함입니다.
- **Impact Analysis:**
  - 기존 백엔드 API 및 폼 폴백 로직과 100% 호환되며, 시각적 심미성과 모바일/데스크톱 반응형 룩앤필이 대폭 향상됩니다.
- **Verification Steps:**
  - 전체 단위 테스트(`npm test`) 통과 확인.
  - Next.js 프로덕션 빌드(`npm run build`) 확인.
  - 로컬 브라우저 렌더링 확인.
- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/app/page.tsx`: Stitch 기획안(`1._create_info` & `1._mobile`) 룩앤필로 전면 리뉴얼 완료.
    - 앰비언트 글로우 배경 및 글래스모피즘 헤더/서브배지.
    - 예상 소요 시간 칩(1시간, 2시간, 3시간, 반나절, 종일) 인터랙션 추가.
    - Stitch 규격 컬러(`primary`, `surface-container-*`, `secondary`, `tertiary`) 기반 폼 디자인.
    - 하단 가치 제안 벤토 그리드(로그인 ZERO, 스마트 매칭, 중간 장소 추천) 추가.
    - 폼 제출 폴백(`formRef.current.submit()`) 및 `fetchJsonWithRetry` 무결성 유지.
  - 검증: 9개 테스트 파일, 58개 테스트 전체 통과 (Pass) 및 Next.js Turbopack 빌드 정상 완료.
