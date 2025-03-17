import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from 'next-auth/jwt';

declare module "next-auth" {
    interface User {
        username?: string;
        role?: number;
        user_id?: number;
        is_active?: boolean;
        is_admin?: boolean;
    }

    interface Session {
        user: {
            username?: string;
            user_id?: number;
            role?: number;
            is_active?: boolean;
            is_admin?: boolean;
        } & DefaultSession["user"]
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string;
        user_id?: number;
        role?: number;
        is_active?: boolean;
        is_admin?: boolean;
        accessToken?: string;
    }
}