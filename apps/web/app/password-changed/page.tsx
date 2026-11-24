"use client";

import Link from "next/link";

export default function PasswordChangedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center">
                {/* Shield Check Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 mx-auto">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Password Changed Successfully</h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Your account password has been updated securely with Argon2id encryption. All prior active sessions have been invalidated for your safety.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                    A security alert has been dispatched to your registered email to notify you of this change.
                </div>

                <Link
                    href="/login"
                    className="inline-block w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition"
                >
                    Sign In with New Password →
                </Link>
            </div>
        </div>
    );
}
