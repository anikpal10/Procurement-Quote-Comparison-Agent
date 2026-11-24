"use client";

import Link from "next/link";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitPasswordReset } from "../../lib/authApi";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Password requirement checks
    const hasMinLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
    const isStrong = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Reset token is missing from the URL. Please re-open the link from your email.");
            return;
        }

        if (!isStrong) {
            setError("Please fulfill all password security requirements.");
            return;
        }

        setLoading(true);
        try {
            await submitPasswordReset(token, newPassword);
            router.push("/password-changed");
        } catch (err: any) {
            setError(err.message || "Failed to reset password. Token may have expired or been used.");
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-white">Invalid Reset Link</h1>
                <p className="text-xs text-slate-400">
                    No reset token was found in this URL. Please request a new password reset link.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-block rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
                >
                    Request New Link
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-sm shadow-md">
                    PA
                </div>
                <div>
                    <div className="text-lg font-bold text-white tracking-tight">Procure<span className="text-sky-400">AI</span></div>
                    <p className="text-[11px] text-slate-400">Set New Account Password</p>
                </div>
            </div>

            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Create new password</h1>
                <p className="mt-1 text-xs text-slate-400">
                    Your new password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-300">New Password</label>
                    <div className="relative mt-1.5">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-300">Confirm New Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                    />
                </div>

                {/* Requirements Checklist */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-400">Password Requirements:</div>
                    <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                        <span>{hasMinLength ? "✓" : "○"}</span>
                        <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasUpper && hasLower ? "text-emerald-400" : "text-slate-500"}`}>
                        <span>{hasUpper && hasLower ? "✓" : "○"}</span>
                        <span>Uppercase and lowercase letters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                        <span>{hasNumber ? "✓" : "○"}</span>
                        <span>At least one number</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordsMatch ? "text-emerald-400" : "text-slate-500"}`}>
                        <span>{passwordsMatch ? "✓" : "○"}</span>
                        <span>Passwords match</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isStrong}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Updating Password...</span>
                        </>
                    ) : (
                        <span>Save New Password & Sign In →</span>
                    )}
                </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800/80">
                <Link
                    href="/login"
                    className="text-xs font-medium text-slate-400 hover:text-white transition"
                >
                    Cancel and Return to Sign In
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
