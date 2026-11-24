"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchHealth, getComparisonData } from "../lib/api";
import { HealthResponse } from "../types";
import { useAuth } from "../lib/authContext";

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [pendingCount, setPendingCount] = useState<number>(3);

    useEffect(() => {
        const comp = getComparisonData();
        const pending = comp.reviewItems?.filter((r) => r.decision === "PENDING").length ?? 0;
        setPendingCount(pending);

        let mounted = true;
        const check = async () => {
            const res = await fetchHealth();
            if (mounted) setHealth(res);
        };
        check();
        const interval = setInterval(check, 15000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [pathname]);

    const isConnected = health && health.status === "ok";

    const menuItems = [
        {
            label: "Dashboard",
            href: "/?view=dashboard",
            icon: (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            ),
        },
        {
            label: "Upload Quotes",
            href: "/?view=upload",
            icon: (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
            ),
        },
        {
            label: "Download Details",
            href: "/download",
            icon: (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
            ),
        },
        {
            label: "Human Review",
            href: "/review",
            badge: pendingCount > 0 ? `${pendingCount}` : undefined,
            icon: (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
        },
    ];

    if (user?.role === "Administrator") {
        menuItems.push({
            label: "Employee Admin",
            href: "/admin/users",
            badge: undefined,
            icon: (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            ),
        });
    }

    const initials = user?.full_name
        ? user.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : "PA";

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white">
            {/* Logo */}
            <div className="flex h-14 items-center px-5 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-sm">
                        <span className="font-mono tracking-tighter">PA</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                        Procure<span className="text-sky-600">AI</span>
                    </span>
                </Link>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {menuItems.map((item) => {
                    const isActive = item.href.startsWith("/?")
                        ? pathname === "/"
                        : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${isActive
                                ? "bg-sky-50 text-sky-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={isActive ? "text-sky-600" : "text-slate-400"}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </div>

                            {item.badge && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logged in Employee Quick Card */}
            {user && (
                <div className="border-t border-slate-100 p-3 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                        <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition">
                            <div className="h-6 w-6 rounded-full bg-sky-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 truncate">{user.full_name || user.username}</p>
                                <p className="text-[10px] text-sky-700 font-medium truncate">{user.role}</p>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            title="Sign out"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* AI Engine & Backend Status footer */}
            <div className="border-t border-slate-100 p-3 text-[11px] space-y-1 text-slate-500">
                <div className="flex items-center justify-between">
                    <span>AI Model:</span>
                    <span className="font-mono font-semibold text-slate-700">gemini-3.1-flash-lite</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Backend API:</span>
                    <span className="flex items-center gap-1 font-semibold">
                        <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className={isConnected ? "text-emerald-700" : "text-rose-700"}>
                            {isConnected ? "Port 8001" : "Offline"}
                        </span>
                    </span>
                </div>
            </div>
        </aside>
    );
}
