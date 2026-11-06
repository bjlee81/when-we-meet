'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Sparkles, Lock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

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
      const res = await fetch('/api/events', {
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

      const data = await res.json();
      if (!res.ok || !data.success) {
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
      setError(err?.message || '네트워크 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-8">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* 상단 광고 슬롯 */}
        <AdBanner slotId="top-home-ad" format="horizontal" />

        {/* 헤더 */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            초간편 친구 약속 조율 서비스
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            When We Meet
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            회원가입 없이 링크 하나로 친구들과 가장 완벽한 약속 날짜를 찾아보세요!
          </p>
        </div>

        {/* 모임 생성 폼 */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold">새 모임 일정 만들기</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                모임 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 연말 송년회, 보드게임 모임, 제주도 여행"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                모임 설명 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 동기 연말모임 (모임 장소는 나중에 확정 가능)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  후보 시작일 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  후보 종료일 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  삭제용 비밀번호 <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 방 삭제 시 필요합니다
                </span>
              </div>
              <input
                type="password"
                placeholder="4자리 이상의 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <span>방 생성 중...</span>
              ) : (
                <>
                  <span>모임 링크 생성하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 안내 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="bg-white/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">초간편 링크 공유</div>
              카톡/SNS로 바로 링크를 공유하여 답변 받기
            </div>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">자동 히트맵 추천</div>
              모두가 모일 수 있는 최적의 날짜 자동 산출
            </div>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">안전한 세션 삭제</div>
              방장 비밀번호로 원할 때 즉시 방 폭파 가능
            </div>
          </div>
        </div>

        {/* 하단 광고 슬롯 */}
        <AdBanner slotId="bottom-home-ad" format="horizontal" />
      </div>

      <footer className="w-full text-center py-4 text-xs text-zinc-600 dark:text-zinc-400">
        © 2026 When We Meet • 빠르고 간편한 친구 모임 조율
      </footer>
    </main>
  );
}
