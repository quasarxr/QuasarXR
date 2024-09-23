import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from 'next-auth/jwt';

declare module "next-auth" {
    interface User {
        username?: string;
        role?: number;
    }

    interface Session {
        user: {
            username?: string;
            role?: number;
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string,
        role?: number;
    }
}