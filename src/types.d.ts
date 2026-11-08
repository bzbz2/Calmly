import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; guest?: boolean };
  }
  interface User {
    guest?: boolean;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    guest?: boolean;
  }
}
