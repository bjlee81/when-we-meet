'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

type Category = 'feature' | 'bug' | 'cheer' | 'etc';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'feature', label: '기능 제안', icon: '💡' },
  { id: 'bug', label: '오류 제보', icon: '🐛' },
  { id: 'cheer', label: '응원 한마디', icon: '❤️' },
  { id: 'etc', label: '기타 의견', icon: '💬' },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>('feature');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 관리자 페이지에서는 플로팅 버튼 숨김
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = content.trim();
    if (!trimmed) {
      setError('의견 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          content: trimmed,
          contact: contact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '의견 전송 실패');
      }

      setSubmitted(true);
      setContent('');
      setContact('');
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2500);
    } catch (err: any) {
      setError(err.message || '전송 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 💡 우측 하단 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="개발자에게 의견 보내기"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer backdrop-blur-sm"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">개발자에게 의견 보내기</span>
        <span className="sm:hidden">의견 보내기</span>
      </button>

      {/* 팝업 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    개발자에게 의견 보내기
                  </h3>
                  <p className="text-xs text-zinc-500">
                    더 유용한 서비스를 위한 피드백을 들려주세요!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base">소중한 의견이 전달되었습니다!</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  남겨주신 의견을 꼼꼼히 확인하여 서비스 개선에 적극 반영하겠습니다. 감사합니다! 😊
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 분류 선택 칩 */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    어떤 의견인가요?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                          category === cat.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 내용 입력 */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    의견 내용 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="예: 카카오페이 정산 기능이 있으면 좋겠어요 / 특정 날짜에서 클릭이 안 되는 버그가 있어요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none text-zinc-900 dark:text-white"
                  />
                </div>

                {/* 연락처 입력 (선택) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    답변받을 연락처/이메일 <span className="text-[10px] text-zinc-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="답변을 원하시면 이메일을 남겨주세요"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  />
                </div>

                {/* 버튼 그룹 */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? '전송 중...' : '의견 보내기'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
