export interface FetchJsonOptions {
  retries?: number;
  retryDelayMs?: number;
}

export interface FetchJsonResult {
  ok: boolean;
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const NETWORK_ERROR_MESSAGE =
  '네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요. (삼성 인터넷 사용 시 광고/추적 차단 기능을 끄거나 크롬으로 접속해 보세요)';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch 후 JSON 파싱. 네트워크 단계 실패(TypeError: Failed to fetch)만 재시도하며,
 * HTTP 오류 응답은 재시도 없이 그대로 반환한다.
 */
export async function fetchJsonWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { retries = 2, retryDelayMs = 400 }: FetchJsonOptions = {}
): Promise<FetchJsonResult> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(input, { cache: 'no-store', ...init });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      if (attempt >= retries) {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      await sleep(retryDelayMs * (attempt + 1));
    }
  }
}
