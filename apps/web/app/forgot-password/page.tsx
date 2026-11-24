"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset } from "../../lib/authApi";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await requestPasswordReset(email.trim());
            // Pass dev token if returned in local testing mode
            const queryParams = new URLSearchParams({ email: email.trim() });
            if (res.dev_reset_token) {
                queryParams.set("dev_token", res.dev_reset_token);
            }
            router.push(`/check-email?${queryParams.toString()}`);
        } catch (err: any) {
            setError(err.message || "Failed to process password reset request.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
                {/* Branding */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-sm shadow-md">
                        PA
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white tracking-tight">Procure<span className="text-sky-400">AI</span></div>
                        <p className="text-[11px] text-slate-400">Security & Account Recovery</p>
                    </div>
                </div>

                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Reset your password</h1>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        Enter your registered company email address. If an active account matches, we will dispatch a secure, single-use reset link.
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300">
                            Registered Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. employee@procureai.internal or user@company.com"
                            className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Generating Secure Link...</span>
                            </>
                        ) : (
                            <span>Send Password Reset Link →</span>
                        )}
                    </button>
                </form>

                <div className="pt-2 text-center border-t border-slate-800/80">
                    <Link
                        href="/login"
                        className="text-xs font-medium text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
                    >
                        <span>← Return to Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
