"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitGoogleCallback } from "../../../../lib/authApi";
import { useAuth } from "../../../../lib/authContext";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get("token") || undefined;
        const code = searchParams.get("code") || undefined;

        const processAuth = async () => {
            try {
                await submitGoogleCallback(token, code);
                await refreshUser();
                router.replace("/");
            } catch (err: any) {
                setError(err.message || "Google authentication failed. Please try again.");
            }
        };

        processAuth();
    }, [searchParams, router, refreshUser]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center">
                {error ? (
                    <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mx-auto">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white">Authentication Failed</h1>
                        <p className="text-xs text-rose-300">{error}</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
                        >
                            Return to Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-sky-500 border-t-transparent mx-auto" />
                        <h1 className="text-xl font-bold text-white">Authenticating with Google</h1>
                        <p className="text-xs text-slate-400">
                            Validating identity token and establishing your secure ProcureAI session...
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-xs text-slate-400">Loading Google callback...</div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
