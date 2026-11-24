"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/authContext";
import { AuthSession, fetchUserSessions, revokeUserSession, logoutAllDevices } from "../../../lib/authApi";

export default function SecuritySessionsPage() {
    const { logout } = useAuth();
    const [sessions, setSessions] = useState<AuthSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await fetchUserSessions();
            setSessions(data);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to load active sessions." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        setActionLoading(sessionId);
        setMessage(null);
        try {
            await revokeUserSession(sessionId);
            setMessage({ type: "success", text: "Session revoked successfully." });
            await loadSessions();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to revoke session." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSignOutAll = async () => {
        if (!confirm("Are you sure you want to sign out from all devices? You will be returned to the login screen.")) {
            return;
        }

        setActionLoading("ALL");
        try {
            await logoutAllDevices();
            await logout();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to revoke all sessions." });
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Active Sessions</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                    View active authentication sessions across your devices and revoke any unrecognized sessions.
                </p>
            </div>

            {message && (
                <div
                    className={`rounded-xl p-3.5 text-xs font-medium border flex items-center justify-between ${
                        message.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                >
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-2">
                        ✕
                    </button>
                </div>
            )}

            {/* Active Sessions List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Active Devices & Browsers</h2>
                        <p className="text-xs text-slate-500">
                            Authenticated sessions associated with your ProcureAI employee account.
                        </p>
                    </div>
                    <button
                        onClick={loadSessions}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        ↻ Refresh
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="py-8 text-center text-xs text-slate-400">Loading active sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">No active sessions found.</div>
                    ) : (
                        sessions.map((sess) => (
                            <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">
                                                {sess.user_agent ? sess.user_agent.slice(0, 45) + "..." : "Web Client"}
                                            </span>
                                            {sess.is_current && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Current Device
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 space-x-2 mt-0.5">
                                            <span>IP: {sess.ip_address || "127.0.0.1"}</span>
                                            <span>•</span>
                                            <span>Signed in: {new Date(sess.created_at).toLocaleString()}</span>
                                            <span>•</span>
                                            <span>Expires: {new Date(sess.expires_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {!sess.is_current && (
                                        <button
                                            onClick={() => handleRevokeSession(sess.id)}
                                            disabled={actionLoading === sess.id}
                                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                                        >
                                            {actionLoading === sess.id ? "Revoking..." : "Revoke"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Global Sign Out Action */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 space-y-3">
                <h3 className="text-sm font-bold text-rose-900">Sign Out of All Devices</h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                    If you suspect unauthorized access or lost a device, you can instantly terminate all active sessions across all browsers and devices. You will need to log in again.
                </p>
                <button
                    onClick={handleSignOutAll}
                    disabled={actionLoading === "ALL"}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 transition disabled:opacity-50"
                >
                    {actionLoading === "ALL" ? "Revoking All..." : "Sign Out Everywhere →"}
                </button>
            </div>
        </div>
    );
}
