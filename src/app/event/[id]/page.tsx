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
  ArrowLeft,
  MapPin,
  ExternalLink,
  Edit3,
  CalendarCheck
} from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { buildShareMessage } from '@/lib/share';
import { 
  calculateHeatmap, 
  findBestDates, 
  generateWeeklyCalendarGrid, 
  ParticipantVote, 
  DateSummary 
} from '@/lib/scheduler';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  location?: string;
  startDate: string;
  endDate: string;
  dates: string[];
  createdAt: string;
  finalDate?: string | null;
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

  // 모임 장소/설명 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // 날짜 확정 모달 상태
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeDate, setFinalizeDate] = useState('');
  const [finalizePassword, setFinalizePassword] = useState('');
  const [finalizeError, setFinalizeError] = useState('');
  const [finalizing, setFinalizing] = useState(false);

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
    if (savedName) {
      setMyParticipantName(savedName);
      setIsMyDevice(true);
    }
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
          availableDates: selectedAvailable,
          maybeDates: selectedMaybe,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 본인 브라우저에 등록 정보 저장
      localStorage.setItem(`wwm_user_${eventId}`, myParticipantName.trim());
      setIsMyDevice(true);

      await fetchEvent();
      alert('일정이 성공적으로 저장되었습니다!');
    } catch (err: any) {
      setVoteError(err.message);
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleOpenEditModal = () => {
    if (event) {
      setEditDescription(event.description || '');
      setEditLocation(event.location || '');
      setEditPassword('');
      setEditError('');
      setShowEditModal(true);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setUpdatingDetails(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          location: editLocation,
          password: editPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '수정 실패');
      }

      await fetchEvent();
      setShowEditModal(false);
      alert('모임 정보가 성공적으로 업데이트되었습니다!');
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setUpdatingDetails(false);
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

  // 모바일 공유 시트(카카오톡 포함)로 공유, 미지원 시 링크 복사
  const handleShare = async () => {
    if (!event) return;
    const msg = buildShareMessage(event, window.location.href);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: msg.title, text: msg.text, url: msg.url });
        return;
      } catch (err: any) {
        // 사용자가 공유 시트를 닫은 경우는 조용히 종료
        if (err?.name === 'AbortError') return;
      }
    }
    handleCopyLink();
  };

  const handleOpenFinalizeModal = (recommended?: string) => {
    setFinalizeDate(event?.finalDate || recommended || '');
    setFinalizePassword('');
    setFinalizeError('');
    setShowFinalizeModal(true);
  };

  // finalDate가 null이면 확정 해제
  const submitFinalize = async (target: string | null) => {
    setFinalizeError('');
    if (target !== null && !target) {
      setFinalizeError('확정할 날짜를 선택해주세요.');
      return;
    }
    setFinalizing(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalDate: target, password: finalizePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '날짜 확정에 실패했습니다.');

      await fetchEvent();
      setShowFinalizeModal(false);
    } catch (err: any) {
      setFinalizeError(err.message);
    } finally {
      setFinalizing(false);
    }
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
  const weeklyGrid = generateWeeklyCalendarGrid(event.dates);

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
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>장소/설명 수정</span>
            </button>

            <button
              onClick={() => handleOpenFinalizeModal(bestDates[0]?.date)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold transition cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{event.finalDate ? '확정 변경' : '날짜 확정'}</span>
            </button>

            <button
              onClick={handleShare}
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

          {/* 📍 확정된 모임 장소 및 지도 바로가기 버튼 */}
          {event.location ? (
            <div className="pt-2 pb-1 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 mr-1.5">모임 장소:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{event.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#03C75A] text-white text-[11px] font-bold hover:brightness-105 transition"
                >
                  <span>네이버 지도</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold hover:bg-zinc-50 transition"
                >
                  <span>구글 지도</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <button
                onClick={handleOpenEditModal}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>장소가 결정되었나요? 모임 장소 등록하기</span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>
              후보 기간: {event.startDate} ~ {event.endDate} ({event.dates.length}일간)
            </span>
          </div>
        </div>

        {/* ✅ 확정된 날짜 배너 */}
        {event.finalDate && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">날짜가 확정되었어요!</div>
              <div className="text-lg font-bold mt-0.5">
                {format(parseISO(event.finalDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
              </div>
            </div>
          </div>
        )}

        {/* 🌟 Best Date 추천 배너 (참여자가 있을 때) */}
        {!event.finalDate && totalParticipants > 0 && bestDates.length > 0 && (
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>내 가능한 날짜 등록/수정</span>
            </h2>
            <div className="text-[11px] text-zinc-500">
              날짜 클릭 시 전환: <strong>가능 🟢</strong> ➔ <strong>애매함 🟡</strong> ➔ <strong>불가능 ⚪</strong>
            </div>
          </div>

          <form onSubmit={handleVoteSubmit} className="space-y-4">
            {event.finalDate && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <Lock className="w-4 h-4 shrink-0" />
                <span>날짜가 확정되어 투표가 잠겼습니다. 방장이 확정을 해제하면 다시 수정할 수 있어요.</span>
              </div>
            )}

            {voteError && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voteError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                내 닉네임 / 이름 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="예: 홍길동 (이름을 입력하면 내 기기에서 바로 인식됩니다)"
                  value={myParticipantName}
                  onChange={(e) => setMyParticipantName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {isMyDevice && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-2.5 h-2.5" /> 내 기기 인증됨
                  </span>
                )}
              </div>
            </div>

            {/* 🗓️ 월요일 시작 주단위 7열 캘린더 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span>주간 달력 (월요일 시작)</span>
                <span className="text-[11px] font-normal text-zinc-400">토/일요일 주말 구분</span>
              </div>

              {/* 요일 헤더 (월~일) */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-700 dark:text-zinc-300">월</span>
                <span className="text-zinc-700 dark:text-zinc-300">화</span>
                <span className="text-zinc-700 dark:text-zinc-300">수</span>
                <span className="text-zinc-700 dark:text-zinc-300">목</span>
                <span className="text-zinc-700 dark:text-zinc-300">금</span>
                <span className="text-blue-600 dark:text-blue-400">토</span>
                <span className="text-rose-600 dark:text-rose-400">일</span>
              </div>

              {/* 7열 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {weeklyGrid.map((d, index) => {
                  if (!d) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-16 sm:h-20 rounded-lg sm:rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-transparent opacity-30"
                      />
                    );
                  }

                  const isAvail = selectedAvailable.includes(d);
                  const isMaybe = selectedMaybe.includes(d);
                  const dateObj = parseISO(d);
                  const dayOfWeek = dateObj.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  let cardStyle =
                    'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300';
                  let statusText = '불가능';
                  let statusBadge = <span className="text-[9px] sm:text-[10px] text-zinc-400">불가능</span>;

                  if (isAvail) {
                    cardStyle =
                      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30';
                    statusText = '가능';
                    statusBadge = (
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 가능
                      </span>
                    );
                  } else if (isMaybe) {
                    cardStyle =
                      'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30';
                    statusText = '애매';
                    statusBadge = (
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <HelpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 애매
                      </span>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDateStatus(d)}
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-center sm:text-left transition-all flex flex-col justify-between h-16 sm:h-20 cursor-pointer ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            dayOfWeek === 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : dayOfWeek === 6
                              ? 'text-blue-600 dark:text-blue-400'
                              : ''
                          }`}
                        >
                          {format(dateObj, 'd')}
                        </span>
                        <span className="text-[9px] text-zinc-400 hidden sm:inline">
                          {format(dateObj, 'M월')}
                        </span>
                      </div>
                      <div className="w-full text-center sm:text-left truncate">{statusBadge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingVote || !myParticipantName.trim() || Boolean(event.finalDate)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm cursor-pointer"
            >
              {submittingVote ? '저장 중...' : '내 일정 등록/수정 완료'}
            </button>
          </form>
        </div>

        {/* 📊 취합 히트맵 & 참여자 현황 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>전체 일정 취합 주간 히트맵</span>
            </h2>
            <div className="text-xs text-zinc-500">
              날짜를 클릭하면 해당 일자에 가능한 친구 목록을 볼 수 있습니다
            </div>
          </div>

          {/* 주간 7열 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold py-1 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-700 dark:text-zinc-300">월</span>
            <span className="text-zinc-700 dark:text-zinc-300">화</span>
            <span className="text-zinc-700 dark:text-zinc-300">수</span>
            <span className="text-zinc-700 dark:text-zinc-300">목</span>
            <span className="text-zinc-700 dark:text-zinc-300">금</span>
            <span className="text-blue-600 dark:text-blue-400">토</span>
            <span className="text-rose-600 dark:text-rose-400">일</span>
          </div>

          {/* 주간 7열 히트맵 그리드 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {weeklyGrid.map((d, index) => {
              if (!d) {
                return (
                  <div
                    key={`heatmap-empty-${index}`}
                    className="h-16 sm:h-20 rounded-lg sm:rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-transparent opacity-30"
                  />
                );
              }

              const summary = heatmap[d];
              const dateObj = parseISO(d);
              const dayOfWeek = dateObj.getDay();
              const ratio = totalParticipants > 0 ? summary.availableCount / totalParticipants : 0;

              // 히트맵 컬러 단계 (참여율에 따른 농도)
              let bgLevel = 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
              if (totalParticipants > 0) {
                if (ratio >= 0.8) bgLevel = 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
                else if (ratio >= 0.5) bgLevel = 'bg-emerald-300 dark:bg-emerald-700 text-zinc-900 dark:text-white border-emerald-400';
                else if (ratio > 0) bgLevel = 'bg-emerald-100 dark:bg-emerald-950/80 text-zinc-900 dark:text-white border-emerald-200 dark:border-emerald-900';
              }

              const isSelected = activeDateSummary?.date === d;

              return (
                <button
                  key={d}
                  onClick={() => setActiveDateSummary(summary)}
                  className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-center sm:text-left transition-all h-16 sm:h-20 flex flex-col justify-between cursor-pointer hover:scale-[1.02] ${bgLevel} ${
                    isSelected ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        ratio >= 0.8
                          ? 'text-white'
                          : dayOfWeek === 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : dayOfWeek === 6
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }`}
                    >
                      {format(dateObj, 'd')}
                    </span>
                    <span className="text-[9px] opacity-75 hidden sm:inline">
                      {format(dateObj, 'M/d')}
                    </span>
                  </div>

                  <div className="w-full text-center sm:text-left">
                    <div className="text-[11px] sm:text-xs font-black">
                      {summary.availableCount}명
                    </div>
                    {summary.maybeCount > 0 && (
                      <div className="text-[9px] opacity-80 hidden sm:block">
                        +{summary.maybeCount}
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

      {/* 모임 정보(설명/장소) 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-bold text-base">모임 정보 및 장소 수정</h3>
            </div>
            <p className="text-xs text-zinc-500">
              확정된 모임 장소나 안내 사항을 업데이트할 수 있습니다. 방 생성 시 설정한 비밀번호가 필요합니다.
            </p>

            {editError && (
              <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  모임 장소 (네이버/구글 지도 검색어)
                </label>
                <input
                  type="text"
                  placeholder="예: 강남역 11번 출구 고기집, 홍대입구역 스타벅스"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  모임 설명 / 공지사항
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 7시까지 강남역 11번 출구 앞에서 만나요!"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  방장 비밀번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="방 생성 시 설정한 비밀번호"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={updatingDetails}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50"
                >
                  {updatingDetails ? '수정 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 날짜 확정 모달 */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <CalendarCheck className="w-5 h-5" />
              <h3 className="font-bold text-base">모임 날짜 확정</h3>
            </div>
            <p className="text-xs text-zinc-500">
              확정하면 모든 참여자의 투표가 잠깁니다. 방 생성 시 설정한 방장 비밀번호가 필요합니다.
            </p>

            {finalizeError && (
              <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {finalizeError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitFinalize(finalizeDate);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">확정할 날짜</label>
                <select
                  value={finalizeDate}
                  onChange={(e) => setFinalizeDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">날짜를 선택하세요</option>
                  {event.dates.map((d) => {
                    const sum = heatmap[d];
                    return (
                      <option key={d} value={d}>
                        {format(parseISO(d), 'M월 d일 (EEE)', { locale: ko })} · 가능 {sum?.availableCount ?? 0}명
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  방장 비밀번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="방 생성 시 설정한 비밀번호"
                  value={finalizePassword}
                  onChange={(e) => setFinalizePassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={finalizing}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {finalizing ? '처리 중...' : '날짜 확정'}
                </button>
              </div>

              {event.finalDate && (
                <button
                  type="button"
                  disabled={finalizing || !finalizePassword}
                  onClick={() => submitFinalize(null)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition disabled:opacity-50 cursor-pointer"
                >
                  확정 해제 (다시 투표 열기)
                </button>
              )}
            </form>
          </div>
        </div>
      )}

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
