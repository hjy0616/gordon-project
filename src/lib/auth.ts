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

        // Status checks
        if (user.status === "PENDING") {
          throw new Error("PENDING");
        }
        if (user.status === "SUSPENDED") {
          throw new Error("SUSPENDED");
        }
        if (user.status === "EXPIRED") {
          throw new Error("EXPIRED");
        }

        // Check activeUntil expiration (ADMIN exempt — 운영자는 멤버십 만료 적용 안 함)
        if (
          user.role !== "ADMIN" &&
          user.activeUntil &&
          new Date() > user.activeUntil
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "EXPIRED" },
          });
          throw new Error("EXPIRED");
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
