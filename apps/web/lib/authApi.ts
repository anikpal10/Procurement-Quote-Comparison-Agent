export type UserRole = "Administrator" | "Procurement Manager" | "Buyer" | "Finance Reviewer";

export interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    account_status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    created_at: string;
    updated_at: string;
    last_login_at?: string | null;
    failed_login_attempts: number;
    is_locked_out: boolean;
}

export interface AuthSession {
    id: string;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at: string;
    expires_at: string;
    is_active: boolean;
    is_current: boolean;
}

export interface LoginAudit {
    id: string;
    user_id?: string | null;
    username?: string | null;
    event_type: string;
    status: string;
    ip_address?: string | null;
    user_agent?: string | null;
    failure_reason?: string | null;
    created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Helper for session token in client storage (supports both cookie & authorization header for reliability)
const TOKEN_KEY = "procureai_auth_session_token";

export function getStoredSessionToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredSessionToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getStoredSessionToken();
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include", // send/receive HttpOnly cookies
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errorDetail = data?.detail || `Request failed with status ${res.status}`;
        throw new Error(typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail));
    }

    return data as T;
}

export async function loginUser(credentials: {
    username_or_email: string;
    password: string;
    remember_me?: boolean;
}): Promise<{ user: User; session_token: string; expires_at: string }> {
    const res = await request<{ user: User; session_token: string; expires_at: string }>(
        "/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        }
    );
    if (res.session_token) {
        setStoredSessionToken(res.session_token);
    }
    return res;
}

export async function logoutUser(): Promise<{ status: string }> {
    try {
        await request<{ status: string }>("/v1/auth/logout", { method: "POST" });
    } finally {
        setStoredSessionToken(null);
    }
    return { status: "success" };
}

export async function logoutAllDevices(): Promise<{ status: string; revoked_count: number }> {
    try {
        return await request<{ status: string; revoked_count: number }>("/v1/auth/logout-all", { method: "POST" });
    } finally {
        setStoredSessionToken(null);
    }
}

export async function fetchCurrentUser(): Promise<User> {
    return await request<User>("/v1/auth/me");
}

export async function requestPasswordReset(email: string): Promise<{ message: string; dev_reset_token?: string; dev_reset_url?: string }> {
    return await request("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export async function submitPasswordReset(token: string, new_password: string): Promise<{ message: string }> {
    return await request("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password }),
    });
}

export async function fetchUserSessions(): Promise<AuthSession[]> {
    return await request<AuthSession[]>("/v1/auth/sessions");
}

export async function revokeUserSession(sessionId: string): Promise<{ status: string }> {
    return await request<{ status: string }>(`/v1/auth/sessions/${sessionId}`, {
        method: "DELETE",
    });
}

export async function updateProfile(full_name: string): Promise<User> {
    return await request<User>("/v1/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ full_name }),
    });
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    return await request("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password, new_password }),
    });
}

export async function fetchGoogleAuthUrl(): Promise<{ auth_url: string; simulated_token?: string }> {
    return await request<{ auth_url: string; simulated_token?: string }>("/v1/auth/google/url");
}

export async function submitGoogleCallback(token?: string, code?: string): Promise<{ user: User; session_token: string; expires_at: string }> {
    const res = await request<{ user: User; session_token: string; expires_at: string }>("/v1/auth/google/callback", {
        method: "POST",
        body: JSON.stringify({ token, code }),
    });
    if (res.session_token) {
        setStoredSessionToken(res.session_token);
    }
    return res;
}

// Administrator APIs
export async function fetchAdminUsers(): Promise<User[]> {
    return await request<User[]>("/v1/admin/users");
}

export async function createEmployeeAccount(data: {
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    initial_password: string;
}): Promise<User> {
    return await request<User>("/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateEmployeeStatus(userId: string, account_status: string): Promise<User> {
    return await request<User>(`/v1/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ account_status }),
    });
}

export async function updateEmployeeRole(userId: string, role: UserRole): Promise<User> {
    return await request<User>(`/v1/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
    });
}

export async function triggerEmployeeReset(userId: string): Promise<{ message: string; dev_reset_token?: string }> {
    return await request(`/v1/admin/users/${userId}/trigger-reset`, {
        method: "POST",
    });
}

export async function revokeEmployeeSessions(userId: string): Promise<{ status: string; revoked_count: number }> {
    return await request(`/v1/admin/users/${userId}/revoke-sessions`, {
        method: "POST",
    });
}

export async function fetchAdminAuditLogs(): Promise<LoginAudit[]> {
    return await request<LoginAudit[]>("/v1/admin/audit-logs");
}
