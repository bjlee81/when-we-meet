# When We Meet (모여봐) - 일정 조율 웹 서비스 MVP

친구들과 간편하게 가능한 날짜와 불가능한 날짜를 표시하여 모임 일정을 빠르게 확정할 수 있는 웹 서비스입니다. Vercel 호스팅에 최적화되어 있습니다.

## ✨ 주요 기능 (MVP)

1. **로그인 없는 초간편 모임방 생성**
   - 모임 이름, 설명, 날짜 범위(시작일~종료일) 설정
   - 관리자(방장) 삭제용 비밀번호 설정
2. **참여자 응답 & 투표**
   - 닉네임만 입력하고 바로 참여
   - 날짜별 3단계 토글: **가능 (🟢 초록)** / **애매함 (🟡 노랑)** / **불가능 (⚪ 회색)**
   - 재방문 시 본인 닉네임 선택하면 기존 투표 자동 복원 및 수정 가능
3. **스마트 히트맵 & Best Date 자동 추천**
   - 참여율이 높을수록 진해지는 인터랙티브 컬러 히트맵
   - 전체 참여자 중 가장 많이 참석 가능한 **최적의 날짜(Best Date) 자동 추천 배너**
   - 날짜를 누르면 누가 가능하고 불가능한지 즉시 확인
4. **비밀번호 기반 모임방 영구 삭제**
   - 생성 시 지정한 비밀번호를 통해 안전하게 세션 삭제
5. **수익화를 고려한 광고 슬롯 (AdBanner)**
   - Google AdSense 및 카카오 애드핏 배너를 쉽게 넣을 수 있는 반응형 광고 컴포넌트 사전 배치

---

## 🛠 기술 스택

- **Frontend & Fullstack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons, date-fns
- **Database:** SQLite / Turso libSQL (`@libsql/client`)
  - 로컬 환경: `local.db` SQLite 파일로 즉시 구동 (별도 DB 설치 불필요)
  - Vercel 배포 시: Turso 무료 libSQL 연결 지원 (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
- **Testing:** Vitest (TDD 방식으로 검증된 일정 집계 알고리즘 & DB 로직)

---

## 🚀 로컬 실행 방법

```bash
cd /Users/bjlee/2026prj/when-we-meet

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 🧪 테스트 실행 (Vitest)

```bash
npm test
```

---

## ☁️ Vercel 배포 방법

1. GitHub 레포지토리에 이 폴더를 Push합니다:
   ```bash
   git add .
   git commit -m "feat: WhenWeMeet MVP complete"
   git push origin main
   ```
2. [Vercel](https://vercel.com) 대시보드에서 `Add New...` -> `Project` 선택 후 저장소 Import.
3. (선택사항) Turso Cloud(무료 SQLite)를 사용하는 경우 Vercel 환경 변수 등록:
   - `TURSO_DATABASE_URL`: `libsql://your-db.turso.io`
   - `TURSO_AUTH_TOKEN`: `your-turso-token`
4. Deploy 클릭 시 1분 내 자동 배포 완료!
