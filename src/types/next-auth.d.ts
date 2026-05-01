import "next-auth";
import "next-auth/jwt";
import type { Role, UserStatus } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      status: UserStatus;
      activeUntil?: string | null;
    };
  }

  interface User {
    role?: Role;
    status?: UserStatus;
    activeUntil?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    activeUntil?: string | null;
  }
}
