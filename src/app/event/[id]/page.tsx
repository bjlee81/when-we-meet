'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Share2, 
  Calendar as CalendarIcon, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Lock, 
  AlertCircle,
  Copy,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Edit3,
  CalendarCheck,
  Download,
  Clock,
  Layers,
  UserCheck,
  HelpCircle,
  Paintbrush
} from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { fetchJsonWithRetry } from '@/lib/fetch-json';
import { buildShareMessage } from '@/lib/share';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';
import { 
  calculateHeatmap, 
  findBestDates, 
  generateWeeklyCalendarGrid, 
  getSlotDensityTier,
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
  updatedAt?: string;
  finalDate?: string | null;
  votes: ParticipantVote[];
}

type PaintMode = 'available' | 'preferred' | 'unavailable';
type ViewFilter = 'all' | 'mine';

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 투표 입력 상태
  const [myParticipantName, setMyParticipantName] = useState('');
  const [myPin, setMyPin] = useState('');
  const [myAvailableDates, setMyAvailableDates] = useState<string[]>([]);
  const [myMaybeDates, setMyMaybeDates] = useState<string[]>([]);
  const [isMyDevice, setIsMyDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Stitch 인터랙션 상태
  const [paintMode, setPaintMode] = useState<PaintMode>('available');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const isMouseDownRef = useRef(false);

  // 모달 상태
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeTargetDate, setFinalizeTargetDate] = useState<string>('');
  const [finalizePassword, setFinalizePassword] = useState('');
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  // 마우스 드래그 추적 리스너
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 기기 고유 토큰 로드/생성
  const getDeviceToken = () => {
    let token = localStorage.getItem('wwm_device_token');
    if (!token) {
      token = 'dev_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('wwm_device_token', token);
    }
    return token;
  };

  const fetchEvent = async () => {
    try {
      // 광고 차단기 우회 및 재시도 지원
      let resData: any = null;
      let isOk = false;

      try {
        const { ok, data } = await fetchJsonWithRetry(
          [`/api/meetups/${eventId}`, `/api/events/${eventId}`],
          { method: 'GET' }
        );
        isOk = ok;
        resData = data;
      } catch {
        // Fallback to direct fetch
        const directRes = await fetch(`/api/events/${eventId}`, { cache: 'no-store' });
        isOk = directRes.ok;
        resData = await directRes.json().catch(() => ({}));
      }

      if (!isOk || (!resData?.event && !resData?.success)) {
        throw new Error(resData?.error || '모임 정보를 불러오지 못했습니다.');
      }

      const eventData = resData.event || resData;
      setEvent(eventData);

      // 내가 투표한 정보 자동 로드
      const devToken = getDeviceToken();
      const myVote = eventData.votes?.find((v: any) => v.deviceToken === devToken);
      if (myVote) {
        setMyParticipantName(myVote.participantName);
        setMyAvailableDates(myVote.availableDates || []);
        setMyMaybeDates(myVote.maybeDates || []);
        setIsMyDevice(true);
      }
    } catch (err: any) {
      console.error('Fetch event error:', err);
      setError(err?.message || '모임을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // 슬롯/날짜 페인팅 로직 (클릭 또는 드래그 시)
  const applyPaintToDate = (dateStr: string) => {
    if (event?.finalDate) return; // 확정 시 수정 불가

    if (paintMode === 'available') {
      setMyAvailableDates((prev) => (prev.includes(dateStr) ? prev : [...prev, dateStr]));
      setMyMaybeDates((prev) => prev.filter((d) => d !== dateStr));
    } else if (paintMode === 'preferred') {
      setMyMaybeDates((prev) => (prev.includes(dateStr) ? prev : [...prev, dateStr]));
      setMyAvailableDates((prev) => prev.filter((d) => d !== dateStr));
    } else {
      // unavailable
      setMyAvailableDates((prev) => prev.filter((d) => d !== dateStr));
      setMyMaybeDates((prev) => prev.filter((d) => d !== dateStr));
    }
  };

  const handleCellMouseDown = (dateStr: string) => {
    isMouseDownRef.current = true;
    applyPaintToDate(dateStr);
  };

  const handleCellMouseEnter = (dateStr: string) => {
    setHoveredDate(dateStr);
    if (isMouseDownRef.current) {
      applyPaintToDate(dateStr);
    }
  };

  // 투표 제출
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoteError('');
    setVoteSuccess(false);

    if (!myParticipantName.trim()) {
      setVoteError('이름(닉네임)을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const devToken = getDeviceToken();
      const { ok, data } = await fetchJsonWithRetry(
        [`/api/meetups/${eventId}/vote`, `/api/events/${eventId}/vote`],
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: myParticipantName.trim(),
            pin: myPin || undefined,
            deviceToken: devToken,
            availableDates: myAvailableDates,
            maybeDates: myMaybeDates,
          }),
        }
      );

      if (!ok || !data.success) {
        throw new Error(data.error || '투표 저장에 실패했습니다.');
      }

      setVoteSuccess(true);
      setIsMyDevice(true);
      await fetchEvent();
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch (err: any) {
      console.error('Vote submit error:', err);
      setVoteError(err?.message || '투표 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 모임 정보 수정
  const handleOpenEditModal = () => {
    if (!event) return;
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    setEditLocation(event.location || '');
    setEditPassword('');
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editTitle.trim()) {
      setEditError('모임 이름을 입력해주세요.');
      return;
    }
    if (!editPassword) {
      setEditError('방 생성 시 설정한 비밀번호를 입력해주세요.');
      return;
    }

    setEditLoading(true);
    try {
      const { ok, data } = await fetchJsonWithRetry(
        [`/api/meetups/${eventId}`, `/api/events/${eventId}`],
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim(),
            location: editLocation.trim(),
            password: editPassword,
          }),
        }
      );

      if (!ok || !data.success) {
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      setShowEditModal(false);
      await fetchEvent();
    } catch (err: any) {
      console.error('Update details error:', err);
      setEditError(err?.message || '수정 중 오류가 발생했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // 모임 삭제
  const handleDeleteEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }

    setDeleteLoading(true);
    try {
      const { ok, data } = await fetchJsonWithRetry(
        [`/api/meetups/${eventId}`, `/api/events/${eventId}`],
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: deletePassword }),
        }
      );

      if (!ok || !data.success) {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      alert('모임이 삭제되었습니다. 홈으로 이동합니다.');
      router.push('/');
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err?.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 공유 링크 복사
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!event) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const { title, text } = buildShareMessage(
      {
        title: event.title,
        finalDate: event.finalDate,
        location: event.location,
      },
      url
    );

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // 날짜 확정 모달 열기
  const handleOpenFinalizeModal = (candidateDate?: string) => {
    setFinalizeTargetDate(candidateDate || event?.finalDate || event?.dates[0] || '');
    setFinalizePassword('');
    setFinalizeError('');
    setShowFinalizeModal(true);
  };

  const handleFinalizeDate = async (targetDate: string | null) => {
    setFinalizeError('');
    if (!finalizePassword) {
      setFinalizeError('방장 비밀번호를 입력해주세요.');
      return;
    }

    setFinalizeLoading(true);
    try {
      const { ok, data } = await fetchJsonWithRetry(
        [`/api/meetups/${eventId}`, `/api/events/${eventId}`],
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            finalDate: targetDate,
            password: finalizePassword,
          }),
        }
      );

      if (!ok || !data.success) {
        throw new Error(data.error || '날짜 확정/해제 처리에 실패했습니다.');
      }

      setShowFinalizeModal(false);
      await fetchEvent();
    } catch (err: any) {
      console.error('Finalize error:', err);
      setFinalizeError(err?.message || '오류가 발생했습니다.');
    } finally {
      setFinalizeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center animate-pulse">
          <CalendarIcon className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-on-surface-variant mt-3">모임 일정을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface text-center font-sans">
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-xl border border-surface-container-high max-w-md w-full space-y-4">
          <AlertCircle className="w-12 h-12 text-secondary mx-auto" />
          <h2 className="text-lg font-bold text-on-surface">오류가 발생했습니다</h2>
          <p className="text-sm text-on-surface-variant">{error || '존재하지 않거나 삭제된 일정입니다.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-sm font-bold transition shadow-md shadow-primary/20 cursor-pointer"
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

  // 호버 중인 날짜 요약
  const hoveredSummary = hoveredDate ? heatmap[hoveredDate] : null;

  return (
    <div className="relative min-h-screen bg-surface text-on-surface flex flex-col items-center p-4 sm:p-8 overflow-hidden font-sans">
      {/* 앰비언트 백그라운드 글로우 장식 */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-container/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-6">
        {/* 상단 광고 슬롯 */}
        <AdBanner slotId="top-event-ad" format="horizontal" />

        {/* 상단 네비게이션 & 빠른 액션 바 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>홈으로</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition border border-surface-container-high cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>모임 정보 수정</span>
            </button>

            <button
              onClick={() => handleOpenFinalizeModal(bestDates[0]?.date)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tertiary-container/15 text-tertiary hover:bg-tertiary-container/25 text-xs font-bold transition border border-tertiary/20 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{event.finalDate ? '확정 일정 변경' : '날짜 확정'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '링크 복사됨!' : '친구 초대하기'}</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-fixed/50 text-secondary hover:bg-secondary-fixed text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>방 삭제</span>
            </button>
          </div>
        </div>

        {/* 🌟 모임 메인 헤더 카드 (Bento Card) */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-surface-container-high space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>약속 조율 스페이스</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                {event.title}
              </h1>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface w-fit">
              <Users className="w-4 h-4 text-primary" />
              <span>현재 참여 <strong>{totalParticipants}명</strong></span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low/70 p-3.5 rounded-xl border border-surface-container-high">
              {event.description}
            </p>
          )}

          {/* 📍 확정된 모임 장소 & 지도 연동 */}
          {event.location && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-high">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-on-surface-variant mr-1.5">모임 장소:</span>
                  <span className="font-bold text-on-surface">{event.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#03C75A] text-white text-xs font-bold hover:brightness-105 transition"
                >
                  <span>네이버 지도</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container-lowest text-on-surface border border-surface-container-high text-xs font-bold hover:bg-surface-container transition"
                >
                  <span>구글 지도</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 🏆 날짜 확정 완료 배너 (확정된 경우) */}
        {event.finalDate && (
          <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl p-6 sm:p-7 shadow-xl shadow-primary/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                  <CalendarCheck className="w-4 h-4" />
                  <span>모임 날짜 최종 확정!</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {format(parseISO(event.finalDate), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                </div>
                <p className="text-xs text-on-primary-container">
                  방장이 약속 날짜를 확정했습니다. 내 캘린더에 바로 등록하세요!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={generateGoogleCalendarUrl({
                    title: event.title,
                    date: event.finalDate,
                    description: event.description,
                    location: event.location,
                    eventUrl: typeof window !== 'undefined' ? window.location.href : '',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-primary hover:bg-surface text-xs font-bold transition shadow-sm"
                >
                  <span>Google 캘린더</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile({
                      title: event.title,
                      date: event.finalDate!,
                      description: event.description,
                      location: event.location,
                      eventUrl: typeof window !== 'undefined' ? window.location.href : '',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition backdrop-blur-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Apple/ICS 파일</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 Best Date 1순위 추천 배너 (미확정 시) */}
        {!event.finalDate && totalParticipants > 0 && bestDates.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-tertiary/20 shadow-md flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/15 text-tertiary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-tertiary flex items-center gap-1">
                  <span>가장 추천하는 모임 날짜 (Best Match)</span>
                </div>
                <div className="text-base font-extrabold text-on-surface mt-0.5">
                  {bestDates.map((b) => format(parseISO(b.date), 'M월 d일 (EEE)', { locale: ko })).join(', ')}
                  <span className="text-xs font-semibold text-primary ml-2">
                    {bestDates[0].availableCount}명 가능 (만족도 {Math.round((bestDates[0].availableCount / totalParticipants) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenFinalizeModal(bestDates[0]?.date)}
              className="px-4 py-2 bg-tertiary hover:bg-tertiary-container text-on-tertiary text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ml-auto"
            >
              이 날짜로 바로 확정
            </button>
          </div>
        )}

        {/* 🎛️ Stitch 상단 컨트롤 도크 (Top Control Dock) */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-lg border border-surface-container-high space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* 좌측: 페인트브러시 모드 선택 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1 mr-1">
                <Paintbrush className="w-3.5 h-3.5 text-primary" />
                <span>선택 모드:</span>
              </span>

              <button
                type="button"
                onClick={() => setPaintMode('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  paintMode === 'available'
                    ? 'bg-tertiary text-on-tertiary border-tertiary shadow-sm scale-[1.03]'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed" />
                <span>가능함 (🟢)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaintMode('preferred')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  paintMode === 'preferred'
                    ? 'bg-amber-400 text-zinc-900 border-amber-400 shadow-sm scale-[1.03]'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>선호/조율 (🟡)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaintMode('unavailable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  paintMode === 'unavailable'
                    ? 'bg-surface-container-highest text-secondary border-secondary/40 shadow-sm scale-[1.03]'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <X className="w-3 h-3" />
                <span>불가능/삭제 (⚪)</span>
              </button>
            </div>

            {/* 우측: 뷰 필터 토글 */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high w-fit">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>전체 히트맵</span>
              </button>

              <button
                type="button"
                onClick={() => setViewFilter('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewFilter === 'mine'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>내 투표만</span>
              </button>
            </div>
          </div>

          {/* 호버 정보 툴팁 스트립 */}
          <div className="bg-surface-container-low/70 px-4 py-2.5 rounded-xl border border-surface-container-high flex items-center justify-between text-xs min-h-[38px]">
            {hoveredSummary ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-primary">
                  {format(parseISO(hoveredSummary.date), 'M월 d일 (EEE)', { locale: ko })}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-semibold text-on-surface">
                  가능: <strong className="text-tertiary">{hoveredSummary.availableCount}명</strong>
                  {hoveredSummary.availableNames.length > 0 && ` (${hoveredSummary.availableNames.join(', ')})`}
                </span>
                {hoveredSummary.maybeCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                    [조율: {hoveredSummary.maybeCount}명 - {hoveredSummary.maybeNames.join(', ')}]
                  </span>
                )}
              </div>
            ) : (
              <span className="text-outline text-[11px]">
                달력의 날짜를 클릭하거나 마우스로 드래그하여 내 가능한 일정을 칠해보세요.
              </span>
            )}

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-on-surface-variant">
              <span>농도:</span>
              <span className="w-3 h-3 rounded bg-surface-container border" title="0%" />
              <span className="w-3 h-3 rounded bg-[#ecfdf5] border-[#a7f3d0]" title="1~25%" />
              <span className="w-3 h-3 rounded bg-[#a7f3d0]" title="26~50%" />
              <span className="w-3 h-3 rounded bg-[#34d399]" title="51~75%" />
              <span className="w-3 h-3 rounded bg-[#10b981]" title="76~100%" />
            </div>
          </div>
        </div>

        {/* 🗓️ 메인 스케줄 캘린더 그리드 & 참여자 리스트 (2열 벤토) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측 8열: 인터랙티브 주간 캘린더 그리드 */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xl shadow-primary/5 border border-surface-container-high space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-on-surface">모임 후보 캘린더</h3>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                {myAvailableDates.length}일 가능 선택됨
              </span>
            </div>

            {/* 요일 헤더 (월~일) */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-on-surface-variant py-1">
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div className="text-primary font-bold">토</div>
              <div className="text-secondary font-bold">일</div>
            </div>

            {/* 그리드 셀들 */}
            <div className="grid grid-cols-7 gap-2">
              {weeklyGrid.map((dateStr, idx) => {
                if (!dateStr) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[80px] sm:min-h-[96px] rounded-xl bg-surface-container/30 border border-transparent opacity-40"
                    />
                  );
                }

                const summary = heatmap[dateStr] || {
                  availableCount: 0,
                  maybeCount: 0,
                  availableNames: [],
                  maybeNames: [],
                  unavailableNames: [],
                  score: 0,
                };

                const isMyAvailable = myAvailableDates.includes(dateStr);
                const isMyMaybe = myMaybeDates.includes(dateStr);
                const isBest = bestDates.some((b) => b.date === dateStr);

                // 특정 참여자 호버 시 하이라이트 여부
                const isParticipantActive = hoveredParticipant
                  ? summary.availableNames.includes(hoveredParticipant) ||
                    summary.maybeNames.includes(hoveredParticipant)
                  : true;

                // 5단계 농도 티어 스타일 매핑
                const tier = getSlotDensityTier(summary.availableCount, totalParticipants);
                let bgStyle = 'bg-surface-container-low border-surface-container-high';
                if (viewFilter === 'all') {
                  if (tier === 1) bgStyle = 'bg-[#ecfdf5] border-[#a7f3d0] text-emerald-950';
                  else if (tier === 2) bgStyle = 'bg-[#a7f3d0] border-[#6ee7b7] text-emerald-950 font-medium';
                  else if (tier === 3) bgStyle = 'bg-[#34d399] border-[#10b981] text-emerald-950 font-bold';
                  else if (tier === 4) bgStyle = 'bg-[#10b981] border-[#059669] text-white font-extrabold shadow-sm';
                } else {
                  // 내 일정만 보기
                  if (isMyAvailable) bgStyle = 'bg-tertiary text-on-tertiary border-tertiary font-bold';
                  else if (isMyMaybe) bgStyle = 'bg-amber-400 text-zinc-900 border-amber-400 font-bold';
                  else bgStyle = 'bg-surface-container-low text-on-surface-variant opacity-40';
                }

                const dayNum = format(parseISO(dateStr), 'd');
                const isWeekend = ['6', '0'].includes(format(parseISO(dateStr), 'i'));

                return (
                  <div
                    key={dateStr}
                    onMouseDown={() => handleCellMouseDown(dateStr)}
                    onMouseEnter={() => handleCellMouseEnter(dateStr)}
                    className={`min-h-[80px] sm:min-h-[96px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${bgStyle} ${
                      hoveredDate === dateStr ? 'ring-2 ring-primary scale-[1.02]' : ''
                    } ${
                      !isParticipantActive ? 'opacity-25' : 'opacity-100'
                    }`}
                  >
                    {/* 상단 날짜 및 상태 뱃지 */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${tier === 4 ? 'text-white' : 'text-on-surface'}`}>
                        {dayNum}
                      </span>
                      {isBest && (
                        <span className="text-[10px] bg-amber-400 text-zinc-900 px-1 rounded font-bold shadow-xs">
                          Best
                        </span>
                      )}
                    </div>

                    {/* 중앙 내 상태 배지 (내가 체크한 경우) */}
                    <div className="my-1 flex items-center gap-1">
                      {isMyAvailable && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/30 text-current backdrop-blur-xs flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> 가능
                        </span>
                      )}
                      {isMyMaybe && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-current flex items-center gap-0.5">
                          조율
                        </span>
                      )}
                    </div>

                    {/* 하단 참석 인원 카운트 */}
                    <div className="text-right">
                      {totalParticipants > 0 ? (
                        <span className="text-[11px] font-semibold tabular-nums">
                          {summary.availableCount}명
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline font-normal">미투표</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측 4열: 참여자 명단 및 투표 등록 폼 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 참여자 명단 박스 */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xl shadow-primary/5 border border-surface-container-high space-y-3">
              <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm text-on-surface">응답한 친구들 ({totalParticipants}명)</h4>
                </div>
                <span className="text-[11px] text-outline">마우스 올리면 일정 확인</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {event.votes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-outline">
                    아직 투표한 친구가 없습니다.<br />첫 번째로 일정을 등록해보세요!
                  </div>
                ) : (
                  event.votes.map((v) => {
                    const isHovered = hoveredParticipant === v.participantName;
                    return (
                      <div
                        key={v.id}
                        onMouseEnter={() => setHoveredParticipant(v.participantName)}
                        onMouseLeave={() => setHoveredParticipant(null)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                            : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                        }`}
                      >
                        <span className="font-bold">{v.participantName}</span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={isHovered ? 'text-on-primary-container' : 'text-tertiary font-semibold'}>
                            {v.availableDates.length}일 가능
                          </span>
                          {v.maybeDates && v.maybeDates.length > 0 && (
                            <span className={isHovered ? 'text-on-primary-container' : 'text-amber-600'}>
                              (조율 {v.maybeDates.length})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 내 투표 저장 폼 박스 */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xl shadow-primary/5 border border-surface-container-high space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>내 일정 등록하기</span>
                </h4>
                {isMyDevice && (
                  <span className="text-[10px] bg-tertiary-container/15 text-tertiary px-2 py-0.5 rounded-full font-bold">
                    기기 인증됨
                  </span>
                )}
              </div>

              {voteSuccess && (
                <div className="p-3 bg-tertiary-container/20 text-tertiary rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>투표가 성공적으로 저장되었습니다!</span>
                </div>
              )}

              {voteError && (
                <div className="p-3 bg-secondary-fixed/50 text-secondary rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voteError}</span>
                </div>
              )}

              <form onSubmit={handleVoteSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    내 닉네임 / 이름 <span className="text-secondary">*</span>
                  </label>
                  <input
                    type="text"
                    value={myParticipantName}
                    onChange={(e) => setMyParticipantName(e.target.value)}
                    placeholder="예: 홍길동, 지민"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-on-surface">
                      본인확인 PIN <span className="text-on-surface-variant font-normal text-[11px]">(선택)</span>
                    </label>
                    <span className="text-[10px] text-outline">타인의 수정 방지</span>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={myPin}
                    onChange={(e) => setMyPin(e.target.value)}
                    placeholder="4자리 숫자"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !!event.finalDate}
                  className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl text-xs shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span>저장 중...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>내 시간 등록 완료 ({myAvailableDates.length + myMaybeDates.length}개 선택)</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 하단 광고 슬롯 */}
        <AdBanner slotId="bottom-event-ad" format="horizontal" />
      </div>

      {/* 🛠️ 모임 정보(설명/장소/제목) 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Edit3 className="w-5 h-5" />
              <h3 className="text-base">모임 정보 및 장소 수정</h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              확정된 모임 장소나 공지사항을 업데이트할 수 있습니다. 방 생성 시 설정한 비밀번호가 필요합니다.
            </p>

            {editError && (
              <div className="text-xs text-secondary bg-secondary-fixed/50 p-3 rounded-xl border border-secondary/20">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  모임 이름 (제목) <span className="text-secondary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 연말 송년회 파티 🎉"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  모임 장소 (검색 키워드)
                </label>
                <input
                  type="text"
                  placeholder="예: 신사역 가로수길, 강남역 11번 출구"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  모임 설명 / 공지사항
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 7시까지 모여요!"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  방장 비밀번호 <span className="text-secondary">*</span>
                </label>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-xs hover:bg-surface-container transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {editLoading ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📅 날짜 확정 모달 */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center gap-2 text-tertiary font-bold">
              <CalendarCheck className="w-5 h-5" />
              <h3 className="text-base">모임 날짜 확정</h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              확정하면 다른 참여자들의 추가 투표가 잠기고, 모든 친구에게 확정 날짜가 공지됩니다.
            </p>

            {finalizeError && (
              <div className="text-xs text-secondary bg-secondary-fixed/50 p-3 rounded-xl border border-secondary/20">
                {finalizeError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  확정할 날짜 선택 <span className="text-secondary">*</span>
                </label>
                <select
                  value={finalizeTargetDate}
                  onChange={(e) => setFinalizeTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                >
                  {event.dates.map((d) => (
                    <option key={d} value={d}>
                      {format(parseISO(d), 'yyyy년 M월 d일 (EEE)', { locale: ko })} (가능 {heatmap[d]?.availableCount || 0}명)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  방장 비밀번호 <span className="text-secondary">*</span>
                </label>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={finalizePassword}
                  onChange={(e) => setFinalizePassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinalizeModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-xs hover:bg-surface-container transition"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalizeDate(finalizeTargetDate)}
                  disabled={finalizeLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {finalizeLoading ? '확정 중...' : '날짜 확정하기'}
                </button>
              </div>

              {event.finalDate && (
                <button
                  type="button"
                  onClick={() => handleFinalizeDate(null)}
                  disabled={finalizeLoading}
                  className="w-full py-2 text-xs text-secondary hover:underline text-center"
                >
                  확정 취소하고 투표 다시 열기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ 방 삭제 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base">모임 방 삭제</h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              정말 이 모임을 삭제하시겠습니까? 등록된 모든 투표와 모임 정보가 영구 삭제됩니다.
            </p>

            {deleteError && (
              <div className="text-xs text-secondary bg-secondary-fixed/50 p-3 rounded-xl border border-secondary/20">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  방장 비밀번호 <span className="text-secondary">*</span>
                </label>
                <input
                  type="password"
                  placeholder="방 생성 시 설정한 비밀번호"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-surface-container-high rounded-xl bg-surface-container-low text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-xs hover:bg-surface-container transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-md hover:bg-secondary-container transition disabled:opacity-50"
                >
                  {deleteLoading ? '삭제 중...' : '영구 삭제'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
