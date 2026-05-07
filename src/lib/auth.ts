import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // PENDING/SUSPENDED는 self-service 대상 아님 — 로그인 차단 유지.
        // EXPIRED는 부분 세션을 발급해 /expired 페이지에서 재인증 흐름을 탄다.
        if (user.status === "PENDING" || user.status === "SUSPENDED") {
          return null;
        }
        if (user.status === "EXPIRED") {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            status: user.status,
            activeUntil: user.activeUntil?.toISOString() ?? null,
          };
        }

        // ADMIN exempt — 운영자는 멤버십 만료 적용 안 함
        if (
          user.role !== "ADMIN" &&
          user.activeUntil &&
          new Date() > user.activeUntil
        ) {
          const now = new Date();
          const expired = await prisma.$transaction(async (tx) => {
            const result = await tx.user.updateMany({
              where: {
                id: user.id,
                status: "ACTIVE",
                activeUntil: { lt: now },
              },
              data: { status: "EXPIRED" },
            });
            if (result.count !== 1) return false;
            await tx.userStatusLog.create({
              data: {
                userId: user.id,
                fromStatus: user.status,
                toStatus: "EXPIRED",
                reason: "activeUntil 경과 — 자동 만료",
              },
            });
            return true;
          });

          if (expired) {
            // 부분 세션 발급 — /expired 페이지로 redirect되게 한다.
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
              status: "EXPIRED",
              activeUntil: user.activeUntil?.toISOString() ?? null,
            };
          }

          // race: read 이후 어드민이 갱신/재활성화함. fresh 한 번 더 읽고 진실 결정.
          const fresh = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              status: true,
              activeUntil: true,
            },
          });
          if (!fresh || fresh.status !== "ACTIVE") return null;
          if (
            fresh.role !== "ADMIN" &&
            fresh.activeUntil &&
            new Date() > fresh.activeUntil
          ) {
            return null;
          }

          return {
            id: fresh.id,
            email: fresh.email,
            name: fresh.name,
            image: fresh.image,
            role: fresh.role,
            status: fresh.status,
            activeUntil: fresh.activeUntil?.toISOString() ?? null,
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
          activeUntil: user.activeUntil?.toISOString() ?? null,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (err) {
        console.error("[auth.events.signIn] lastLoginAt update failed", err);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.activeUntil = user.activeUntil ?? null;
      }
      const needsBackfill = !!token.id && !token.status;
      if ((trigger === "update" || needsBackfill) && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { activeUntil: true, role: true, status: true },
        });
        if (dbUser) {
          token.activeUntil = dbUser.activeUntil?.toISOString() ?? null;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      if (token?.role) {
        session.user.role = token.role;
      }
      if (token?.status) {
        session.user.status = token.status;
      }
      session.user.activeUntil = (token.activeUntil as string) ?? null;
      return session;
    },
  },
});
