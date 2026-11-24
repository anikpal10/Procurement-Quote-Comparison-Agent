"use client";

import { useState } from "react";
import { useAuth } from "../../lib/authContext";
import { updateProfile, changePassword } from "../../lib/authApi";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [fullName, setFullName] = useState<string>(user?.full_name || "");
    const [profileLoading, setProfileLoading] = useState<boolean>(false);
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Change Password
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            await updateProfile(fullName.trim());
            await refreshUser();
            setProfileMsg({ type: "success", text: "Profile details updated successfully." });
        } catch (err: any) {
            setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg(null);

        if (newPassword.length < 8) {
            setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: "error", text: "New passwords do not match." });
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setPasswordMsg({ type: "success", text: "Password changed successfully! A security notice was sent to your email." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Profile & Account</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                    Manage your personal credentials, contact details, and authentication security.
                </p>
            </div>

            {/* Profile Overview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                        {user.full_name
                            ? user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                            : user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">{user.full_name || user.username}</h2>
                            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-600/20">
                                {user.role}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">@{user.username} • {user.email}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Account Status: <span className="text-emerald-600 font-semibold">{user.account_status}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Edit Profile Information */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                    <p className="text-xs text-slate-500">
                        Employee username and email are managed by the procurement system administrator.
                    </p>

                    {profileMsg && (
                        <div
                            className={`rounded-xl p-3 text-xs ${
                                profileMsg.type === "success"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                        >
                            {profileMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Display / Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Username</label>
                            <input
                                type="text"
                                disabled
                                value={user.username}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Registered Email</label>
                            <input
                                type="email"
                                disabled
                                value={user.email}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
                        >
                            {profileLoading ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                    <p className="text-xs text-slate-500">
                        Securely update your password. Your new password will be hashed using Argon2id.
                    </p>

                    {passwordMsg && (
                        <div
                            className={`rounded-xl p-3 text-xs ${
                                passwordMsg.type === "success"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                        >
                            {passwordMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Current Password</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700">New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {passwordLoading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
