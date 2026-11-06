'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Settings, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 탭 상태: 'ads' | 'events'
  const [tab, setTab] = useState<'ads' | 'events'>('ads');

  // 광고 설정 상태
  const [settings, setSettings] = useState({
    ad_enabled: 'false',
    ad_google_client_id: '',
    ad_google_slot_id: '',
    ad_kakao_unit_id: '',
    ad_custom_html: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 모임방 목록 상태
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '비밀번호가 올바르지 않습니다.');
      }

      setIsLoggedIn(true);
      setEvents(data.events || []);

      // 설정 로드
      const settingsRes = await fetch('/api/admin/settings');
      const settingsData = await settingsRes.json();
      if (settingsData && settingsData.settings) {
        setSettings((prev) => ({ ...prev, ...settingsData.settings }));
      }
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  // 광고 설정 저장
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // 모임 강제 삭제
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`[마스터 권한] "${title}" 모임 일정을 정말 강제 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, eventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');

      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      alert('모임이 성공적으로 삭제되었습니다.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="bg-zinc-800/90 border border-zinc-700 p-8 rounded-2xl max-w-sm w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">마스터 관리자 로그인</h1>
            <p className="text-xs text-zinc-400">
              전체 사이트 광고 설정 및 모임방 총괄 관리
            </p>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-900/60 rounded-xl text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                관리자 비밀번호
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="관리자 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-zinc-500"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
            >
              대시보드 접속
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="w-full text-center text-xs text-zinc-400 hover:text-white transition"
          >
            ← 서비스 메인으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>When We Meet 서비스 총괄 관리자</span>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">MASTER</span>
              </h1>
              <p className="text-xs text-zinc-400">광고 배너 제어 및 전체 모임방 모니터링</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab('ads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                tab === 'ads' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>전역 광고 설정</span>
            </button>
            <button
              onClick={() => setTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                tab === 'events' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>전체 모임 관리 ({events.length})</span>
            </button>
          </div>
        </div>

        {/* 탭 1: 광고 설정 */}
        {tab === 'ads' && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold flex items-center gap-2 text-indigo-400">
                <Settings className="w-4 h-4" />
                <span>실시간 전역 광고 배너 설정</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                여기서 설정한 광고 코드는 메인 페이지와 모든 생성된 모임방의 상/하단 배너에 즉시 실시간 노출됩니다.
              </p>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>광고 설정이 성공적으로 저장되었습니다! 즉시 웹사이트에 반영됩니다.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-zinc-200">1. 카카오 애드핏 (Kakao AdFit)</h3>
                <div>
                  <label className="block text-zinc-400 mb-1">Ad Unit ID (단위 ID)</label>
                  <input
                    type="text"
                    placeholder="예: DAN-1h8v94k1abc"
                    value={settings.ad_kakao_unit_id}
                    onChange={(e) => setSettings({ ...settings, ad_kakao_unit_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-zinc-200">2. 구글 애드센스 (Google AdSense)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Client ID (퍼블리셔 ID)</label>
                    <input
                      type="text"
                      placeholder="예: ca-pub-1234567890123456"
                      value={settings.ad_google_client_id}
                      onChange={(e) => setSettings({ ...settings, ad_google_client_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Slot ID (광고 단위 ID)</label>
                    <input
                      type="text"
                      placeholder="예: 9876543210"
                      value={settings.ad_google_slot_id}
                      onChange={(e) => setSettings({ ...settings, ad_google_slot_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-zinc-200">3. 또는 커스텀 HTML 광고 태그 직접 입력</h3>
                <div>
                  <textarea
                    rows={3}
                    placeholder="<ins ...></ins> 또는 다른 제휴 마케팅 배너 태그"
                    value={settings.ad_custom_html}
                    onChange={(e) => setSettings({ ...settings, ad_custom_html: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? '저장 중...' : '전역 광고 설정 저장하기'}</span>
              </button>
            </form>
          </div>
        )}

        {/* 탭 2: 전체 모임방 목록 */}
        {tab === 'events' && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>현재 개설된 모임 목록 총괄</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  모임 목록을 확인하고, 만료되었거나 불필요한 방을 즉시 개별/일괄 삭제할 수 있습니다.
                </p>
              </div>

              <button
                onClick={async () => {
                  if (!confirm('기간이 지난 모임 및 14일 이상 참여자가 없는 방치 모임을 모두 정리하시겠습니까?')) return;
                  try {
                    const res = await fetch('/api/admin/events', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setEvents(data.events || []);
                    alert(`총 ${data.deletedCount}개의 만료/방치 모임이 정리되었습니다.`);
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>만료/방치 모임 일괄 정리</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  아직 생성된 모임이 없습니다.
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{ev.title}</span>
                        <span className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-900/50">
                          참여 {ev.participantCount}명
                        </span>
                        {ev.location && (
                          <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-900/50">
                            장소: {ev.location}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400">{ev.description || '설명 없음'}</p>
                      <p className="text-zinc-500 text-[11px]">
                        후보 기간: {ev.startDate} ~ {ev.endDate} • 생성일: {ev.createdAt.split('T')[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/event/${ev.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      >
                        <span>방 바로가기</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-900/50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>강제 삭제</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
