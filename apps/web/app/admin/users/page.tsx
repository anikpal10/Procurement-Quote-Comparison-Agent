"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/authContext";
import {
    User,
    LoginAudit,
    UserRole,
    fetchAdminUsers,
    createEmployeeAccount,
    updateEmployeeStatus,
    updateEmployeeRole,
    triggerEmployeeReset,
    revokeEmployeeSessions,
    fetchAdminAuditLogs,
} from "../../../lib/authApi";

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<LoginAudit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Modal state for adding employee
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [newUsername, setNewUsername] = useState<string>("");
    const [newEmail, setNewEmail] = useState<string>("");
    const [newFullName, setNewFullName] = useState<string>("");
    const [newRole, setNewRole] = useState<UserRole>("Buyer");
    const [newPassword, setNewPassword] = useState<string>("WelcomeProcure123!");
    const [createLoading, setCreateLoading] = useState<boolean>(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, auditData] = await Promise.all([
                fetchAdminUsers(),
                fetchAdminAuditLogs(),
            ]);
            setUsers(usersData);
            setAuditLogs(auditData);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to load admin data." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === "Administrator") {
            loadData();
        }
    }, [currentUser]);

    if (currentUser?.role !== "Administrator") {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold ring-1 ring-amber-200">
                    ⚠️
                </div>
                <h1 className="text-xl font-bold text-slate-800">Restricted Administration Area</h1>
                <p className="text-xs text-slate-600">
                    Your current role is <span className="font-semibold text-slate-900">{currentUser?.role}</span>. Only system administrators have permission to manage employee accounts and security audits.
                </p>
            </div>
        );
    }

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setMessage(null);

        try {
            await createEmployeeAccount({
                username: newUsername.trim(),
                email: newEmail.trim(),
                full_name: newFullName.trim(),
                role: newRole,
                initial_password: newPassword,
            });
            setMessage({ type: "success", text: `Employee account "${newUsername}" created successfully.` });
            setShowCreateModal(false);
            setNewUsername("");
            setNewEmail("");
            setNewFullName("");
            setNewPassword("WelcomeProcure123!");
            await loadData();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to create account." });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        setActionLoading(user.id);
        setMessage(null);
        try {
            const newStatus = user.account_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
            await updateEmployeeStatus(user.id, newStatus);
            setMessage({ type: "success", text: `Status for ${user.username} updated to ${newStatus}.` });
            await loadData();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update status." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setActionLoading(userId);
        setMessage(null);
        try {
            await updateEmployeeRole(userId, newRole);
            setMessage({ type: "success", text: "Employee role updated successfully." });
            await loadData();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update role." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleTriggerReset = async (user: User) => {
        setActionLoading(user.id);
        setMessage(null);
        try {
            const res = await triggerEmployeeReset(user.id);
            setMessage({
                type: "success",
                text: res.dev_reset_token
                    ? `Password reset link sent! Dev Token: ${res.dev_reset_token}`
                    : `Password reset email dispatched to ${user.email}.`,
            });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to trigger reset." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeSessions = async (user: User) => {
        setActionLoading(user.id);
        setMessage(null);
        try {
            const res = await revokeEmployeeSessions(user.id);
            setMessage({ type: "success", text: `Revoked ${res.revoked_count} active sessions for ${user.username}.` });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to revoke sessions." });
        } finally {
            setActionLoading(null);
        }
    };

    // Filter users
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
        const matchesStatus = statusFilter === "ALL" || u.account_status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const activeCount = users.filter((u) => u.account_status === "ACTIVE").length;
    const suspendedCount = users.filter((u) => u.account_status === "SUSPENDED" || u.is_locked_out).length;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header & Create Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Employee Account Management
                        <span className="text-[11px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                            Admin Control
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Enterprise role-based access control, employee provisioning, and security audit logs.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                        ↻ Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-sky-500 hover:to-indigo-500 transition"
                    >
                        <span>+ Provision Employee</span>
                    </button>
                </div>
            </div>

            {/* Notification alert banner */}
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

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Staff</span>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{users.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active Accounts</span>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Suspended / Locked</span>
                    <div className="text-2xl font-bold text-rose-700 mt-1">{suspendedCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Audit Events Logged</span>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">{auditLogs.length}</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 flex items-center gap-6">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`pb-3 text-xs font-bold border-b-2 transition ${
                        activeTab === "users"
                            ? "border-sky-600 text-sky-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Employees & Access Directory ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab("audit")}
                    className={`pb-3 text-xs font-bold border-b-2 transition ${
                        activeTab === "audit"
                            ? "border-sky-600 text-sky-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Security & Login Audit Trail ({auditLogs.length})
                </button>
            </div>

            {/* Tab 1: Users Table */}
            {activeTab === "users" && (
                <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Filter by name, username, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none shadow-sm"
                        />
                        <div className="flex gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="Administrator">Administrator</option>
                                <option value="Procurement Manager">Procurement Manager</option>
                                <option value="Buyer">Buyer</option>
                                <option value="Finance Reviewer">Finance Reviewer</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended / Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
                            <thead className="bg-slate-50/80 font-bold text-slate-600">
                                <tr>
                                    <th className="px-4 py-3.5">Employee</th>
                                    <th className="px-4 py-3.5">Assigned Role</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">Security / Attempts</th>
                                    <th className="px-4 py-3.5">Last Login</th>
                                    <th className="px-4 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            Loading employee directory...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No matching employee accounts found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                                                        {emp.full_name
                                                            ? emp.full_name
                                                                  .split(" ")
                                                                  .map((n) => n[0])
                                                                  .join("")
                                                                  .slice(0, 2)
                                                                  .toUpperCase()
                                                            : emp.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{emp.full_name || emp.username}</div>
                                                        <div className="text-[11px] text-slate-500 font-mono">@{emp.username} • {emp.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={emp.role}
                                                    onChange={(e) => handleRoleChange(emp.id, e.target.value as UserRole)}
                                                    disabled={actionLoading === emp.id}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm focus:border-sky-500"
                                                >
                                                    <option value="Administrator">Administrator</option>
                                                    <option value="Procurement Manager">Procurement Manager</option>
                                                    <option value="Buyer">Buyer</option>
                                                    <option value="Finance Reviewer">Finance Reviewer</option>
                                                </select>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {emp.account_status === "ACTIVE" ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-600/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                        {emp.account_status}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {emp.is_locked_out ? (
                                                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                                                        Locked (15 min cooldown)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 text-[11px]">
                                                        {emp.failed_login_attempts > 0
                                                            ? `${emp.failed_login_attempts} failed attempts`
                                                            : "Clean record"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                                                {emp.last_login_at
                                                    ? new Date(emp.last_login_at).toLocaleString()
                                                    : "Never logged in"}
                                            </td>

                                            <td className="px-4 py-3.5 text-right space-x-1">
                                                <button
                                                    onClick={() => handleToggleStatus(emp)}
                                                    disabled={actionLoading === emp.id}
                                                    title={emp.account_status === "ACTIVE" ? "Deactivate employee" : "Activate employee"}
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                                                        emp.account_status === "ACTIVE"
                                                            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                    }`}
                                                >
                                                    {emp.account_status === "ACTIVE" ? "Deactivate" : "Activate"}
                                                </button>

                                                <button
                                                    onClick={() => handleTriggerReset(emp)}
                                                    disabled={actionLoading === emp.id}
                                                    title="Trigger password reset email"
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    Reset Link
                                                </button>

                                                <button
                                                    onClick={() => handleRevokeSessions(emp)}
                                                    disabled={actionLoading === emp.id}
                                                    title="Revoke all active sessions on all devices"
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    Revoke Sessions
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 2: Audit Logs */}
            {activeTab === "audit" && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
                        <thead className="bg-slate-50/80 font-bold text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">Timestamp</th>
                                <th className="px-4 py-3.5">Username</th>
                                <th className="px-4 py-3.5">Event Type</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5">IP Address</th>
                                <th className="px-4 py-3.5">Client Device</th>
                                <th className="px-4 py-3.5">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        No audit entries recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {log.username || "Anonymous"}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[11px]">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.status === "SUCCESS" ? (
                                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                    SUCCESS
                                                </span>
                                            ) : (
                                                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                    {log.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                                            {log.ip_address || "127.0.0.1"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate text-[11px]">
                                            {log.user_agent || "Browser Client"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                                            {log.failure_reason || "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Employee Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Provision New Employee Account</h3>
                                <p className="text-xs text-slate-500">
                                    Administrator-controlled onboarding. No self-registration is permitted.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newFullName}
                                    onChange={(e) => setNewFullName(e.target.value)}
                                    placeholder="e.g. Rachel Chen"
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="e.g. rachel_chen"
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Role</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                                    >
                                        <option value="Administrator">Administrator</option>
                                        <option value="Procurement Manager">Procurement Manager</option>
                                        <option value="Buyer">Buyer</option>
                                        <option value="Finance Reviewer">Finance Reviewer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Registered Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="e.g. rachel@procureai.internal or rachel@company.com"
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Initial Temporary Password</label>
                                <input
                                    type="text"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    The employee will receive an onboarding notice and can change their password on first sign-in.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
                                >
                                    {createLoading ? "Provisioning..." : "Create Account →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
