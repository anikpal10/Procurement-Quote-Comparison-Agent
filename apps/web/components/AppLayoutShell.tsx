"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../lib/authContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function ShellContent({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user, loading, isAuthRoute } = useAuth();

    if (isAuthRoute) {
        return <div className="min-h-screen bg-slate-900 text-slate-100">{children}</div>;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                    <span className="text-xs font-medium tracking-wide">Authenticating session...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        // Will be redirected by AuthProvider
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
            <Sidebar />
            <div className="pl-56 flex min-h-screen flex-col">
                <Header />
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
}

export function AppLayoutShell({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ShellContent>{children}</ShellContent>
        </AuthProvider>
    );
}
