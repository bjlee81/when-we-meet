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

/** 네트워크 단계 실패(차단/단절)를 HTTP 오류와 구분하기 위한 에러 */
export class NetworkError extends Error {
  constructor(message: string = NETWORK_ERROR_MESSAGE) {
    super(message);
    this.name = 'NetworkError';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch 후 JSON 파싱. 네트워크 단계 실패(TypeError: Failed to fetch)만 재시도하며,
 * HTTP 오류 응답은 재시도 없이 그대로 반환한다.
 */
export async function fetchJsonWithRetry(
  input: string | string[],
  init: RequestInit = {},
  { retries = 2, retryDelayMs = 400 }: FetchJsonOptions = {}
): Promise<FetchJsonResult> {
  // 광고 차단기가 특정 URL만 막는 경우를 대비해, 재시도마다 다음 후보 URL을 사용한다.
  const urls = Array.isArray(input) ? input : [input];
  const attempts = Math.max(retries, urls.length - 1);
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(urls[attempt % urls.length], { cache: 'no-store', ...init });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      if (attempt >= attempts) {
        throw new NetworkError();
      }
      await sleep(retryDelayMs * (attempt + 1));
    }
  }
}

