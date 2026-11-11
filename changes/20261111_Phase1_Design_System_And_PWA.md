# Change Document: 20261111_Phase1_Design_System_And_PWA

- **Date:** 2026-11-11
- **User Request:**
  - "1부터진행해보자." (Phase 1: 디자인 시스템 고도화 & PWA 기반 구축)
- **Proposed Changes:**
  1. **디자인 토큰 통합 (Modern Soft Minimalism in Tailwind v4):**
     - `src/app/globals.css`: Stitch `DESIGN.md` 명세에 따른 테마 변수(`--color-surface`, `--color-primary`, `--color-secondary`, `--color-tertiary`, `--color-on-surface`, 5단계 히트맵 색상 등) 정의.
     - `src/app/layout.tsx`: `Plus_Jakarta_Sans` 웹폰트(`next/font/google`) 추가 및 영문/숫자 타이포그래피 강화.
  2. **PWA (Progressive Web App) 인프라 구축:**
     - 고해상도 앱 아이콘(`public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`, `public/icons/apple-touch-icon.png`) 생성 및 배치.
     - `src/app/manifest.ts` 구현 (Next.js App Router 공식 규격 manifest 생성기).
     - `src/app/layout.tsx`에 `manifest`, `themeColor: #4f46e5`, `appleWebApp` 메타데이터 등록.
  3. **단위 테스트:**
     - `src/__tests__/pwa.test.ts`: manifest 구조(name, icons, theme_color, start_url 등) 및 메타데이터 무결성 검증.
- **Reasoning:**
  - Phase 2(시간대 투표 그리드), Phase 3(결과 대시보드), Phase 4(중간 장소 찾기) 개발에 앞서 공통 디자인 토큰과 모바일 앱(PWA) 설치 토대를 선제적으로 완성하기 위함입니다.
- **Impact Analysis:**
  - 기존 UI 컴포넌트의 클래스명과 호환되며, 신규 토큰을 통해 Stitch 기획안의 벤토 그리드 및 히트맵 스타일을 즉시 사용할 수 있습니다.
- **Verification Steps:**
  1. Red: `src/__tests__/pwa.test.ts` 실패 확인.
  2. Green: PWA 매니페스트 및 스타일 토큰 적용 후 테스트 통과.
  3. 전체 테스트 (`npm test`) 및 프로덕션 빌드 (`npm run build`) 확인.
- **Status:** Verified

- **Implementation & Verification Results:**
  - `src/app/globals.css`: Stitch `DESIGN.md` 기반 컬러 토큰(`surface`, `primary`, `secondary`, `tertiary`, `heatmap-0`~`4`) 및 간격/타이포그래피 유틸리티 등록.
  - `src/app/layout.tsx`: `Plus_Jakarta_Sans` 웹폰트(`next/font/google`) 등록, PWA viewport(`themeColor: #4f46e5`) 및 appleWebApp/manifest 메타데이터 연동.
  - `src/app/manifest.ts`: App Router 규격 Web App Manifest 생성기 구현.
  - `public/icons/`: 고해상도 소스에서 `icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png` 규격 생성 완료.
  - `src/__tests__/pwa.test.ts`: Manifest 객체 무결성 및 아이콘 규격 검증 완료.
  - 검증: 9개 테스트 스위트, 58개 테스트 전체 통과 (Pass) 및 Next.js Turbopack 빌드(`manifest.webmanifest` 정적 페이지 생성) 확인.
