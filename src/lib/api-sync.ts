/**
 * 백그라운드 API 호출 헬퍼.
 * Zustand 낙관적 업데이트 후 서버에 동기화할 때 사용.
 * 실패 시 콘솔에만 로그 (UI는 이미 반영됨).
 */
export async function syncToServer(
  url: string,
  method: "PUT" | "POST" | "DELETE",
  body: unknown,
) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[sync] ${method} ${url} failed:`, res.status);
    } else if (method === "PUT") {
      // PUT 0-row → id mismatch (실제 문제). DELETE 0-row는 idempotent라 정상 (예: client-only mock fixture 삭제).
      try {
        const data = await res.clone().json();
        if (data && data.updated === 0) {
          console.warn(
            `[sync] PUT ${url} updated 0 rows — possible client/server id mismatch`,
          );
        }
      } catch {
        /* non-JSON response, ignore */
      }
    }
    return res;
  } catch (err) {
    console.error(`[sync] ${method} ${url} error:`, err);
    return null;
  }
}

/** GET 호출 후 JSON 반환. 실패 시 null */
export async function fetchFromServer<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
