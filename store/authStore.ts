import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  expireAt: string | null;
  tokenType: string | null;
  setAccessToken: (token: string | null) => void;
  removeAccessToken: () => void;
  setTokenExpireAt: (time: string | null) => void;
  setTokenType: (type: string | null) => void;
}

enum GOOGLE_AUTH { ACCESS_TOKEN = "googleAccessToken", EXPIRE_AT = "googleAccessToken_ExpireAt", TOKEN_TYPE = "googleAccessToken_Type" };


export const useAuthStore = create<AuthState>((set) => ({
    // 서버 컴포넌트에서 접근을 방지함.
    accessToken: typeof window !== "undefined" ? localStorage.getItem(GOOGLE_AUTH.ACCESS_TOKEN) : null,
    expireAt: typeof window !== "undefined" ? localStorage.getItem(GOOGLE_AUTH.EXPIRE_AT) : null,
    tokenType: typeof window !== "undefined" ? localStorage.getItem(GOOGLE_AUTH.TOKEN_TYPE) : null,
    setAccessToken: (token) => {
        if (typeof window !== "undefined") { 
            localStorage.setItem(GOOGLE_AUTH.ACCESS_TOKEN, token ?? "");
        }
        set({ accessToken: token });
    },
    setTokenExpireAt: (time) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(GOOGLE_AUTH.EXPIRE_AT, `${time}`);
        }
        set({ expireAt: time ?? null });
    },
    setTokenType: ( type ) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(GOOGLE_AUTH.TOKEN_TYPE, type ?? "");
        }
        set({ tokenType: type ?? "" });
    },
    removeAccessToken: () => {
        // ✅ localStorage에서 삭제
        localStorage.removeItem(GOOGLE_AUTH.ACCESS_TOKEN); 
        localStorage.removeItem(GOOGLE_AUTH.TOKEN_TYPE); 
        localStorage.removeItem(GOOGLE_AUTH.EXPIRE_AT);
        set({ accessToken: null, tokenType: null, expireAt: null });
    },
}));
