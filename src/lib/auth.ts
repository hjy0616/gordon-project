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

        // Check activeUntil expiration
        if (user.activeUntil && new Date() > user.activeUntil) {
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
        token.activeUntil = user.activeUntil ?? null;
      }
      // Refresh activeUntil on every session update
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { activeUntil: true, role: true },
        });
        if (dbUser) {
          token.activeUntil = dbUser.activeUntil?.toISOString() ?? null;
          token.role = dbUser.role;
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
      session.user.activeUntil = (token.activeUntil as string) ?? null;
      return session;
    },
  },
});
