import { describe, it, expect, beforeEach } from 'vitest';
import { 
  initDb, 
  createFeedback, 
  getAllFeedbacksForAdmin, 
  adminDeleteFeedback 
} from '@/lib/db';

describe('User Feedback System', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('creates and retrieves user feedback successfully', async () => {
    const res = await createFeedback({
      category: 'feature',
      content: '카카오페이 1/N 정산 링크도 넣어주시면 좋겠어요!',
      contact: 'user@example.com',
    });

    expect(res.success).toBe(true);
    expect(res.feedback).toBeDefined();
    expect(res.feedback?.id).toBeDefined();
    expect(res.feedback?.category).toBe('feature');
    expect(res.feedback?.content).toBe('카카오페이 1/N 정산 링크도 넣어주시면 좋겠어요!');
    expect(res.feedback?.contact).toBe('user@example.com');
    expect(res.feedback?.createdAt).toBeDefined();

    // 관리자 목록 조회에서 확인
    const all = await getAllFeedbacksForAdmin();
    const found = all.find((f) => f.id === res.feedback?.id);
    expect(found).toBeDefined();
    expect(found?.content).toBe('카카오페이 1/N 정산 링크도 넣어주시면 좋겠어요!');
  });

  it('rejects feedback with empty or whitespace-only content', async () => {
    const resEmpty = await createFeedback({
      category: 'bug',
      content: '   ',
    });

    expect(resEmpty.success).toBe(false);
    expect(resEmpty.error).toMatch(/내용을 입력/);
  });

  it('allows optional contact information and defaults category to etc if invalid', async () => {
    const res = await createFeedback({
      category: 'invalid_category',
      content: '응원합니다 번창하세요!',
    });

    expect(res.success).toBe(true);
    expect(res.feedback?.category).toBe('etc');
    expect(res.feedback?.contact).toBe('');
  });

  it('deletes feedback via adminDeleteFeedback', async () => {
    const created = await createFeedback({
      category: 'cheer',
      content: '삭제 테스트 피드백',
    });

    expect(created.success).toBe(true);
    const feedbackId = created.feedback!.id;

    const delRes = await adminDeleteFeedback(feedbackId);
    expect(delRes).toBe(true);

    const afterList = await getAllFeedbacksForAdmin();
    const found = afterList.find((f) => f.id === feedbackId);
    expect(found).toBeUndefined();
  });
});
