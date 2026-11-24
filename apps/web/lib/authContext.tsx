"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, fetchCurrentUser, loginUser, logoutUser, setStoredSessionToken, getStoredSessionToken } from "./authApi";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: { username_or_email: string; password: string; remember_me?: boolean }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthRoute: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that do not require authentication
const PUBLIC_AUTH_ROUTES = [
    "/login",
    "/forgot-password",
    "/check-email",
    "/reset-password",
    "/password-changed",
    "/auth/callback/google",
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const pathname = usePathname();

    const isAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route));

    const refreshUser = async () => {
        try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
            setStoredSessionToken(null);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const currentUser = await fetchCurrentUser();
                if (isMounted) setUser(currentUser);
            } catch {
                if (isMounted) {
                    setUser(null);
                    setStoredSessionToken(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        init();
        return () => {
            isMounted = false;
        };
    }, []);

    // Protect private routes and redirect unauthenticated users to /login
    useEffect(() => {
        if (!loading) {
            if (!user && !isAuthRoute) {
                router.replace("/login");
            } else if (user && pathname === "/login") {
                router.replace("/");
            }
        }
    }, [user, loading, pathname, isAuthRoute, router]);

    const login = async (credentials: { username_or_email: string; password: string; remember_me?: boolean }) => {
        const res = await loginUser(credentials);
        setUser(res.user);
        if (credentials.remember_me) {
            localStorage.setItem("procureai_remembered_identity", credentials.username_or_email);
        } else {
            localStorage.removeItem("procureai_remembered_identity");
        }
        router.push("/");
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
            router.push("/login");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthRoute }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
