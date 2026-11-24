"use client";

import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../lib/authContext";
import { fetchGoogleAuthUrl } from "../../lib/authApi";

export default function LoginPage() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rememberMe, setRememberMe] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill remembered identity from localStorage
    useEffect(() => {
        const remembered = localStorage.getItem("procureai_remembered_identity");
        if (remembered) {
            setIdentifier(remembered);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({
                username_or_email: identifier.trim(),
                password,
                remember_me: rememberMe,
            });
        } catch (err: any) {
            setError(err.message || "Invalid credentials or account is suspended.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            const data = await fetchGoogleAuthUrl();
            if (data.auth_url) {
                window.location.href = data.auth_url;
            }
        } catch (err: any) {
            setError(err.message || "Failed to initialize Google Sign-In.");
            setGoogleLoading(false);
        }
    };

    const fillDemoAccount = (u: string, p: string) => {
        setIdentifier(u);
        setPassword(p);
        setError(null);
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            {/* Left Column: Visual & Trust Hero */}
            <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 border-r border-slate-800/80 overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Brand */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
                        PA
                    </div>
                    <div>
                        <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                            Procure<span className="text-sky-400">AI</span>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                Enterprise
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Intelligent Quotation Analysis & Compliance</p>
                    </div>
                </div>

                {/* Center Content / Highlights */}
                <div className="relative z-10 my-auto space-y-6 max-w-lg">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                        Autonomous quote comparison, instant compliance scoring.
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Streamline supplier quotations, detect pricing anomalies, enforce procurement standards, and accelerate supplier awards with Gemini AI.
                    </p>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                ✓
                            </div>
                            <span>Argon2id password hashing and session tokens</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                ✓
                            </div>
                            <span>Brute-force protection & account lockout safeguards</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                ✓
                            </div>
                            <span>Role-based access control for procurement operations</span>
                        </div>
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
                    <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        ProcureAI Identity Gateway v2.4
                    </span>
                    <span>SOC-2 & ISO 27001 Certified Architecture</span>
                </div>
            </div>

            {/* Right Column: Login Card */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
                <div className="w-full max-w-md space-y-7">
                    {/* Header */}
                    <div>
                        <div className="flex lg:hidden items-center gap-2 mb-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white font-bold text-sm">
                                PA
                            </div>
                            <span className="text-lg font-bold text-white">Procure<span className="text-sky-400">AI</span></span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Sign in to your account
                        </h1>
                        <p className="mt-1.5 text-xs text-slate-400">
                            Enter your employee username or registered company email.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                            <svg className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition shadow-sm disabled:opacity-50"
                    >
                        {googleLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                        )}
                        <span>Continue with Google</span>
                    </button>

                    <div className="relative flex items-center justify-center">
                        <div className="w-full border-t border-slate-800" />
                        <span className="absolute bg-slate-950 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            or with credentials
                        </span>
                    </div>

                    {/* Standard Credentials Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Username or Registered Email
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. admin or employee@procureai.internal"
                                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-medium text-slate-300">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative mt-1.5">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition"
                                >
                                    {showPassword ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/30"
                                />
                                <span>Remember my account on this browser (30 days)</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Verifying Credentials...</span>
                                </>
                            ) : (
                                <span>Sign In to ProcureAI →</span>
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Credentials Card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-[11px] space-y-2">
                        <div className="font-semibold text-slate-300 flex items-center justify-between">
                            <span>Test Enterprise Accounts:</span>
                            <span className="text-[10px] text-sky-400 uppercase tracking-wider">Click to fill</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => fillDemoAccount("admin", "AdminPassword123!")}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-left hover:border-slate-700 transition"
                            >
                                <span className="block font-bold text-amber-400">Admin</span>
                                <span className="text-slate-400">admin / AdminPassword123!</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoAccount("proc_manager", "Manager123!")}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-left hover:border-slate-700 transition"
                            >
                                <span className="block font-bold text-sky-400">Proc. Manager</span>
                                <span className="text-slate-400">proc_manager / Manager123!</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoAccount("buyer_john", "Buyer123!")}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-left hover:border-slate-700 transition"
                            >
                                <span className="block font-bold text-emerald-400">Buyer</span>
                                <span className="text-slate-400">buyer_john / Buyer123!</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoAccount("finance_amy", "Finance123!")}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-left hover:border-slate-700 transition"
                            >
                                <span className="block font-bold text-purple-400">Finance Reviewer</span>
                                <span className="text-slate-400">finance_amy / Finance123!</span>
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-[11px] text-slate-500">
                        New employee? Contact your system administrator to provision an account.
                    </div>
                </div>
            </div>
        </div>
    );
}
