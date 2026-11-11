'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Zap, 
  Check 
} from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { fetchJsonWithRetry, NetworkError } from '@/lib/fetch-json';

const DURATION_OPTIONS = [
  { id: '1', label: '1시간', sub: '가벼운 티타임' },
  { id: '2', label: '2시간', sub: '일반 식사/미팅' },
  { id: '3', label: '3시간', sub: '생파 & 저녁식사' },
  { id: 'half', label: '반나절', sub: '약 5~6시간' },
  { id: 'all', label: '종일', sub: '주말 나들이' },
];

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('2');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) setError(urlError);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  // 후보 일수 계산
  const candidateDays = (() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('모임 제목을 입력해주세요.');
      return;
    }
    if (!password) {
      setError('삭제 관리용 비밀번호를 설정해주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('종료일은 시작일보다 이후여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await fetchJsonWithRetry(['/api/meetups', '/api/events'], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startDate,
          endDate,
          password,
        }),
      });

      if (!ok || !data.success) {
        throw new Error(data.error || '모임 생성 실패');
      }

      // 모바일 브라우저 호환성을 위한 이동
      if (data && data.event && data.event.id) {
        window.location.href = `/event/${data.event.id}`;
      } else {
        throw new Error('생성된 모임 정보를 확인할 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Create error:', err);
      if (err instanceof NetworkError && formRef.current) {
        // fetch/XHR 이 차단된 환경: 일반 폼 제출(페이지 이동)로 폴백
        formRef.current.submit();
        return;
      }
      setError(err?.message || '네트워크 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-surface text-on-surface flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden font-sans">
      {/* 앰비언트 백그라운드 글로우 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-container/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6">
        {/* 상단 광고 슬롯 */}
        <AdBanner slotId="top-home-ad" format="horizontal" />

        {/* 헤더 섹션 */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high/80 border border-outline-variant/40 text-primary text-xs font-semibold tracking-wide shadow-xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>회원가입 없이 링크 하나로 끝나는 약속 조율</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface">
            우리 언제 만나
            <span className="block text-primary text-2xl sm:text-3xl font-bold mt-1">
              When We Meet
            </span>
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            모두가 가능한 약속 날짜와 시간, 공평한 중간 장소까지 한 번에 맞춰보세요!
          </p>
        </div>

        {/* 메인 벤토 카드 (모임 생성 폼) */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-surface-container-high space-y-6">
          <div className="flex items-center justify-between border-b border-surface-container pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">새 모임 일정 만들기</h2>
                <p className="text-xs text-on-surface-variant">친구들을 초대할 모임 정보를 입력해주세요</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-semibold">
              무료 • 간편 공유
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-secondary bg-secondary-fixed/50 p-3.5 rounded-xl border border-secondary/20">
              <ShieldAlert className="w-4 h-4 shrink-0 text-secondary" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form 
            ref={formRef} 
            method="POST" 
            action="/create" 
            onSubmit={handleCreate} 
            className="space-y-5"
          >
            {/* 모임 제목 */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                모임 이름 <span className="text-secondary">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 🎂 지민이 생일 파티 & 봄맞이 모임, 연말 송년회"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary text-sm transition-all"
              />
            </div>

            {/* 모임 설명 / 메모 */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                모임 설명 / 메모 <span className="text-on-surface-variant font-normal text-[11px]">(선택)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 다 같이 오랜만에 모여서 맛있는 저녁 먹어요! 가능한 날짜 편하게 체크해 주세요."
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary text-sm transition-all resize-none"
              />
            </div>

            {/* 예상 소요 시간 칩 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  예상 소요 시간
                </label>
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 최적 시간 자동 분석
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = duration === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDuration(opt.id)}
                      className={`p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-primary-container text-on-primary border-primary-container shadow-md shadow-primary/20 scale-[1.02]'
                          : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-center gap-1">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate ${
                        isSelected ? 'text-on-primary-container' : 'text-on-surface-variant'
                      }`}>
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 후보 일정 범위 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  후보 날짜 범위 <span className="text-secondary">*</span>
                </label>
                {candidateDays > 0 && (
                  <span className="text-[11px] font-bold text-tertiary bg-tertiary-container/15 px-2 py-0.5 rounded-md">
                    총 {candidateDays}일간 후보 일정
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-on-surface-variant font-medium mb-1">시작일</span>
                  <input
                    type="date"
                    name="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

                <div>
                  <span className="block text-[11px] text-on-surface-variant font-medium mb-1">종료일</span>
                  <input
                    type="date"
                    name="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 삭제/방장용 비밀번호 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  방장 관리 비밀번호 <span className="text-secondary">*</span>
                </label>
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 정보 수정/삭제 시 필요
                </span>
              </div>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="4자리 이상의 비밀번호 입력"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary text-sm transition-all"
              />
            </div>

            {/* 메인 생성 CTA 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 bg-primary hover:bg-primary-container active:scale-[0.99] text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base cursor-pointer"
            >
              {loading ? (
                <span>모임 링크 만드는 중...</span>
              ) : (
                <>
                  <span>모임 링크 생성하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 하단 3가지 가치 제안 벤토 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-surface-container-lowest/70 backdrop-blur-md p-4 rounded-xl border border-surface-container-high shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-on-surface">로그인 ZERO</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              복잡한 회원가입 없이 링크 하나로 친구들 누구나 3초 만에 참여해요.
            </p>
          </div>

          <div className="bg-surface-container-lowest/70 backdrop-blur-md p-4 rounded-xl border border-surface-container-high shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-on-surface">스마트 매칭</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              모두의 가능 시간을 겹쳐 가장 많은 친구가 모이는 최적 일정을 찾아줘요.
            </p>
          </div>

          <div className="bg-surface-container-lowest/70 backdrop-blur-md p-4 rounded-xl border border-surface-container-high shadow-xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-on-surface">중간 장소 추천</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              모두에게 이동 시간이 공평한 최적의 중간 모임 장소와 맛집을 추천해요.
            </p>
          </div>
        </div>

        {/* 하단 광고 슬롯 */}
        <AdBanner slotId="bottom-home-ad" format="horizontal" />

        {/* 푸터 */}
        <footer className="text-center text-xs text-outline pt-4 pb-8 space-y-1">
          <p>© 2026 When We Meet. All rights reserved.</p>
          <p className="text-[11px]">가장 편안하고 즐거운 약속 조율의 시작</p>
        </footer>
      </div>
    </main>
  );
}
