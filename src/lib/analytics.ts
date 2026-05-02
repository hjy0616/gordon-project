import { prisma } from "./prisma";

export type TrackEventInput = {
  userId?: string | null;
  sessionId?: string | null;
  type: string;
  label?: string;
  path?: string;
  props?: Record<string, unknown>;
};

export async function trackEvent(input: TrackEventInput) {
  try {
    return await prisma.userEvent.create({
      data: {
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        type: input.type,
        label: input.label ?? null,
        path: input.path ?? null,
        props: (input.props ?? null) as never,
      },
      select: { id: true },
    });
  } catch (err) {
    console.error("[analytics.trackEvent] failed", err);
    return null;
  }
}

// Status 전환은 항상 prisma.$transaction([update, statusLog.create]) 형태로
// 인라인 처리한다 (트랜잭션 일관성 보장). 별도 헬퍼는 try/catch로 에러를 삼켜
// 트랜잭션을 손상시키므로 제거됨.
