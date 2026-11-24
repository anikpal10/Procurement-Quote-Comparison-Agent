"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/authContext";

export function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const displayName = user?.full_name || user?.username || "Employee";

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <Link
                    href="/"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition"
                    title="Back"
                >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </Link>

                <Link href="/" className="hover:text-slate-900 transition">
                    All RFQs
                </Link>
                <span className="text-slate-300 font-normal">&gt;</span>
                <span className="font-semibold text-slate-700">RFQ id: KA001020</span>
                <span className="text-slate-300 font-normal">&gt;</span>
                <span className="font-bold text-slate-900">
                    {pathname === "/review"
                        ? "Human Review"
                        : pathname === "/download"
                        ? "Download Supplier Details"
                        : pathname === "/admin/users"
                        ? "Employee Directory"
                        : pathname === "/profile"
                        ? "User Profile"
                        : pathname === "/settings/security"
                        ? "Security & Sessions"
                        : "Compare Quotes"}
                </span>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="relative hidden md:block">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search quotations or suppliers..."
                        className="h-8 w-64 rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none transition"
                    />
                </div>

                {/* Notifications icon */}
                <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                        title="System Notifications"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                    </button>
                </div>

                {/* User Profile Menu */}
                <div className="relative border-l border-slate-200 pl-3" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer focus:outline-none"
                    >
                        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm ring-1 ring-sky-400/40">
                            {initials}
                        </div>
                        <div className="flex items-center gap-1 text-left">
                            <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                                {displayName}
                            </span>
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs">
                            <div className="p-2 border-b border-slate-100">
                                <p className="font-bold text-slate-900 truncate">{displayName}</p>
                                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                                <div className="mt-1.5">
                                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-600/20">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <div className="py-1">
                                <Link
                                    href="/profile"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>My Profile</span>
                                </Link>

                                <Link
                                    href="/settings/security"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Security & Sessions</span>
                                </Link>

                                {user?.role === "Administrator" && (
                                    <Link
                                        href="/admin/users"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                                    >
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold text-sky-700">Employee Management</span>
                                    </Link>
                                )}
                            </div>

                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-rose-600 hover:bg-rose-50 font-medium transition text-left"
                                >
                                    <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
