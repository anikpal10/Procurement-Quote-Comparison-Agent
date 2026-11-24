"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "your registered email";
    const devToken = searchParams.get("dev_token");

    return (
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
            {/* Mail Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 mx-auto">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                    If an account is associated with <span className="font-semibold text-sky-300">{email}</span>, we have sent instructions to reset your password.
                </p>
            </div>

            {/* Dev helper: if local dev environment returns token */}
            {devToken && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                        <span>⚡ Local Dev Mode Helper</span>
                    </div>
                    <p className="text-[11px] text-amber-200">
                        Since SMTP may be in local logger mode, click below to open your reset link directly:
                    </p>
                    <Link
                        href={`/reset-password?token=${devToken}`}
                        className="inline-block w-full text-center rounded-lg bg-amber-500/20 border border-amber-500/40 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 transition"
                    >
                        Click to Open Reset Password Page →
                    </Link>
                </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300">Security Instructions:</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>The link will expire in <span className="text-slate-200 font-semibold">60 minutes</span>.</li>
                    <li>The link can only be used <span className="text-slate-200 font-semibold">once</span>.</li>
                    <li>If you do not see the email, check your spam or promotions folder.</li>
                </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <Link
                    href="/forgot-password"
                    className="w-full text-center rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                    Try another email address
                </Link>
                <Link
                    href="/login"
                    className="w-full text-center py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                    Return to Sign In
                </Link>
            </div>
        </div>
    );
}

export default function CheckEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
                <CheckEmailContent />
            </Suspense>
        </div>
    );
}
