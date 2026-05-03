import { randomBytes } from "node:crypto";

/**
 * 마인드맵 공유 토큰 — URL-safe base64url, 18 bytes → 24자, 144비트 엔트로피.
 * 추측 공격에 대해 충분히 안전 (2^144). DB는 unique 인덱스로 충돌 검출.
 *
 * 서버 전용 — node:crypto 의존 (브라우저에서 import 금지).
 */
export function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}
