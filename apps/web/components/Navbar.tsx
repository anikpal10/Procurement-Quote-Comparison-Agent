"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchHealth } from "../lib/api";
import { HealthResponse } from "../types";
import { ScalesIcon } from "./Icons";

const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "New RFQ", href: "/comparisons/new" },
    { label: "Uploads", href: "/uploads" },
    { label: "AI Extraction", href: "/processing" },
    { label: "Comparison Workbench", href: "/comparison" },
    { label: "Human Review", href: "/review" },
];

export function Navbar() {
    const pathname = usePathname();
    const [health, setHealth] = useState<HealthResponse | null>(null);

    useEffect(() => {
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
    }, []);

    const isConnected = health && health.status === "ok";

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-700 to-indigo-600 text-white shadow-sm transition group-hover:scale-105">
                            <ScalesIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">Procure<span className="text-sky-600">AI</span></span>
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">v0.1.0</span>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        isActive
                                            ? "bg-sky-50 text-sky-700 font-bold"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Backend Health Badge */}
                    <div
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                        title={isConnected ? `FastAPI backend active (${health?.service})` : "FastAPI backend unreachable"}
                    >
                        <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-slate-600 font-medium hidden sm:inline">
                            API: <span className={isConnected ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                                {isConnected ? "Connected" : "Offline"}
                            </span>
                        </span>
                    </div>

                    {/* Role Pill */}
                    <Link
                        href="/login"
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                    >
                        Role: <span className="font-semibold text-slate-900">Buyer</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
