import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: typeof window !== "undefined" ? localStorage.getItem("googleAccessToken") : null,
    setAccessToken: (token) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("googleAccessToken", token ?? "");
    }
    set({ accessToken: token });
    },
}));
