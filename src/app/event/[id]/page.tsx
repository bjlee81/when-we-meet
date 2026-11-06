'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Share2, 
  Calendar as CalendarIcon, 
  Trash2, 
  Check, 
  HelpCircle, 
  X, 
  Sparkles, 
  Lock, 
  AlertCircle,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { calculateHeatmap, findBestDates, ParticipantVote, DateSummary } from '@/lib/scheduler';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  dates: string[];
  createdAt: string;
  votes: ParticipantVote[];
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 투표 폼 상태
  const [myParticipantName, setMyParticipantName] = useState('');
  const [pin, setPin] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [isMyDevice, setIsMyDevice] = useState(false);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedMaybe, setSelectedMaybe] = useState<string[]>([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState('');

  // 모달 및 알림 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [copied, setCopied] = useState(false);

  // 선택된 날짜 상세 팝업 상태
  const [activeDateSummary, setActiveDateSummary] = useState<DateSummary | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '이벤트를 불러올 수 없습니다.');
      }
      setEvent(data.event);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();

    // 1. 브라우저 고유 기기 식별 토큰 발급 및 로드
    let token = localStorage.getItem('wwm_device_token');
    if (!token) {
      token = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('wwm_device_token', token);
    }
    setDeviceToken(token);

    // 2. 이 방에서 이 브라우저로 참여했던 이름 복원
    const savedName = localStorage.getItem(`wwm_user_${eventId}`);
    const savedPin = localStorage.getItem(`wwm_pin_${eventId}`);
    if (savedName) {
      setMyParticipantName(savedName);
      setIsMyDevice(true);
    }
    if (savedPin) setPin(savedPin);
  }, [eventId]);

  // 참여자 이름 선택/입력 시 기존 투표 자동 로딩
  useEffect(() => {
    if (!event || !myParticipantName.trim()) return;
    const existing = event.votes.find(
      (v) => v.participantName.toLowerCase() === myParticipantName.trim().toLowerCase()
    );
    if (existing) {
      setSelectedAvailable(existing.availableDates);
      setSelectedMaybe(existing.maybeDates || []);

      // 이 브라우저에 저장된 이름과 일치하는지 확인
      const savedName = localStorage.getItem(`wwm_user_${eventId}`);
      setIsMyDevice(savedName === myParticipantName.trim());
    } else {
      setIsMyDevice(false);
    }
  }, [myParticipantName, event, eventId]);

  const toggleDateStatus = (dateStr: string) => {
    // 순환: 미선택 -> 가능(Available) -> 애매함(Maybe) -> 미선택
    if (selectedAvailable.includes(dateStr)) {
      setSelectedAvailable((prev) => prev.filter((d) => d !== dateStr));
      setSelectedMaybe((prev) => [...prev, dateStr]);
    } else if (selectedMaybe.includes(dateStr)) {
      setSelectedMaybe((prev) => prev.filter((d) => d !== dateStr));
    } else {
      setSelectedAvailable((prev) => [...prev, dateStr]);
    }
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoteError('');

    if (!myParticipantName.trim()) {
      setVoteError('참여자 이름을 입력해주세요.');
      return;
    }

    setSubmittingVote(true);
    try {
      const res = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: myParticipantName.trim(),
          deviceToken,
          pin: pin ? pin.trim() : undefined,
          availableDates: selectedAvailable,
          maybeDates: selectedMaybe,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 본인 브라우저에 등록 정보 저장
      localStorage.setItem(`wwm_user_${eventId}`, myParticipantName.trim());
      if (pin) localStorage.setItem(`wwm_pin_${eventId}`, pin.trim());
      setIsMyDevice(true);

      await fetchEvent();
      alert('일정이 성공적으로 저장되었습니다!');
    } catch (err: any) {
      setVoteError(err.message);
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleDeleteEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '삭제 실패');
      }

      alert('모임 일정이 성공적으로 삭제되었습니다.');
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-500">일정을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950 text-center">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">오류가 발생했습니다</h2>
          <p className="text-sm text-zinc-500">{error || '존재하지 않거나 삭제된 일정입니다.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            새 모임 만들기로 이동
          </button>
        </div>
      </div>
    );
  }

  const heatmap = calculateHeatmap(event.dates, event.votes);
  const bestDates = findBestDates(heatmap);
  const totalParticipants = event.votes.length;

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* 상단 광고 슬롯 */}
        <AdBanner slotId="top-event-ad" format="horizontal" />

        {/* 상단 네비게이션 & 액션 */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            홈으로
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '링크 복사됨!' : '친구에게 공유'}</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>방 삭제</span>
            </button>
          </div>
        </div>

        {/* 모임 헤더 카드 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {event.title}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 w-fit">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>현재 참여 <strong>{totalParticipants}명</strong></span>
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{event.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>
              후보 기간: {event.startDate} ~ {event.endDate} ({event.dates.length}일간)
            </span>
          </div>
        </div>

        {/* 🌟 Best Date 추천 배너 (참여자가 있을 때) */}
        {totalParticipants > 0 && bestDates.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                가장 모이기 좋은 날 추천!
              </div>
              <div className="text-sm font-semibold mt-0.5">
                {bestDates.map((b) => format(parseISO(b.date), 'M월 d일 (EEE)', { locale: ko })).join(', ')}
                <span className="text-xs font-normal text-zinc-500 ml-2">
                  (가능 {bestDates[0].availableCount}명 / 전체 {totalParticipants}명)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 참여자 투표 섹션 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>내 가능한 날짜 등록/수정</span>
            </h2>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
              날짜를 터치하여 상태 전환 (가능 🟢 ➔ 애매함 🟡 ➔ 불가능 ⚪)
            </div>
          </div>

          <form onSubmit={handleVoteSubmit} className="space-y-4">
            {voteError && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voteError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  내 닉네임 / 이름 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={myParticipantName}
                    onChange={(e) => setMyParticipantName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {isMyDevice && (
                    <span className="absolute right-2.5 top-2 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                      <Check className="w-2.5 h-2.5" /> 내 기기 인증됨
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>
                    수정 방지 PIN <span className="text-zinc-600 dark:text-zinc-400 text-[10px] font-normal">(선택사항)</span>
                  </span>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-normal">
                    {isMyDevice ? '기기 자동 인증 상태' : '타 기기 접속 시 필요'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={isMyDevice ? "비밀번호 없이도 수정 가능합니다" : "기기 변경 시 사용할 4자리 PIN (선택)"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-zinc-400"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* 날짜 선택 그리드 */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">날짜별 가능 여부 선택</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {event.dates.map((d) => {
                  const isAvail = selectedAvailable.includes(d);
                  const isMaybe = selectedMaybe.includes(d);
                  const dateObj = parseISO(d);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  let cardStyle = 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
                  let statusBadge = <span className="text-[10px] text-zinc-600 dark:text-zinc-400">불가능</span>;

                  if (isAvail) {
                    cardStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20';
                    statusBadge = (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> 가능!
                      </span>
                    );
                  } else if (isMaybe) {
                    cardStyle = 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20';
                    statusBadge = (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <HelpCircle className="w-3 h-3" /> 애매함
                      </span>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDateStatus(d)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer hover:shadow-sm ${cardStyle}`}
                    >
                      <div>
                        <div className={`text-xs font-medium ${isWeekend ? 'text-rose-500 font-bold' : ''}`}>
                          {format(dateObj, 'M월 d일 (EEE)', { locale: ko })}
                        </div>
                      </div>
                      <div>{statusBadge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingVote || !myParticipantName.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm cursor-pointer"
            >
              {submittingVote ? '저장 중...' : '내 일정 등록/수정 완료'}
            </button>
          </form>
        </div>

        {/* 📊 취합 히트맵 & 참여자 현황 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>전체 일정 취합 히트맵</span>
            </h2>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              날짜를 클릭하면 가능한 친구 목록을 볼 수 있습니다
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {event.dates.map((d) => {
              const summary = heatmap[d];
              const dateObj = parseISO(d);
              const ratio = totalParticipants > 0 ? summary.availableCount / totalParticipants : 0;

              // 히트맵 컬러 단계 (참여율에 따른 농도)
              let bgLevel = 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700';
              if (totalParticipants > 0) {
                if (ratio >= 0.8) bgLevel = 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20';
                else if (ratio >= 0.5) bgLevel = 'bg-emerald-300 dark:bg-emerald-700 text-zinc-900 dark:text-white border-emerald-400';
                else if (ratio > 0) bgLevel = 'bg-emerald-100 dark:bg-emerald-950 text-zinc-900 dark:text-white border-emerald-200';
              }

              const isSelected = activeDateSummary?.date === d;

              return (
                <button
                  key={d}
                  onClick={() => setActiveDateSummary(summary)}
                  className={`p-3 rounded-xl border text-left transition-all h-22 flex flex-col justify-between cursor-pointer hover:scale-[1.02] ${bgLevel} ${
                    isSelected ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <div className="text-xs font-semibold">
                    {format(dateObj, 'M/d (EEE)', { locale: ko })}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-sm font-black">
                      {summary.availableCount}명 가능
                    </div>
                    {summary.maybeCount > 0 && (
                      <div className="text-[10px] opacity-80">
                        + {summary.maybeCount}명 애매함
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 클릭한 특정 날짜의 참여자 리스트 디테일 */}
          {activeDateSummary && (
            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm">
                  {format(parseISO(activeDateSummary.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 상세 현황
                </div>
                <button
                  onClick={() => setActiveDateSummary(null)}
                  className="text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 가능 ({activeDateSummary.availableNames.length}명)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    {activeDateSummary.availableNames.length > 0
                      ? activeDateSummary.availableNames.join(', ')
                      : '없음'}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <div className="font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> 애매함 ({activeDateSummary.maybeNames.length}명)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    {activeDateSummary.maybeNames.length > 0
                      ? activeDateSummary.maybeNames.join(', ')
                      : '없음'}
                  </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="font-bold text-zinc-500 mb-1 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> 불가능 ({activeDateSummary.unavailableNames.length}명)
                  </div>
                  <div className="text-zinc-500">
                    {activeDateSummary.unavailableNames.length > 0
                      ? activeDateSummary.unavailableNames.join(', ')
                      : '없음'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 참여자 전체 목록 */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
              참여한 친구들 ({event.votes.length}명)
            </div>
            <div className="flex flex-wrap gap-2">
              {event.votes.length === 0 ? (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 py-1">
                  아직 참여한 친구가 없습니다. 첫 번째로 참여해보세요!
                </div>
              ) : (
                event.votes.map((v) => (
                  <span
                    key={v.id}
                    onClick={() => setMyParticipantName(v.participantName)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium cursor-pointer transition"
                    title="클릭하여 내 투표 수정"
                  >
                    <span>{v.participantName}</span>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400">
                      ({v.availableDates.length}일 가능)
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 중간 또는 하단 광고 슬롯 */}
        <AdBanner slotId="bottom-event-ad" format="horizontal" />
      </div>

      {/* 모임방 삭제 비밀번호 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Lock className="w-5 h-5" />
              <h3 className="font-bold text-base">모임 일정 삭제</h3>
            </div>
            <p className="text-xs text-zinc-500">
              이 모임 일정을 완전히 삭제하시겠습니까? 방 생성 시 설정한 비밀번호를 입력해주세요.
            </p>

            {deleteError && (
              <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteEvent} className="space-y-3">
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                >
                  영구 삭제
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
