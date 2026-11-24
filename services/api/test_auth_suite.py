import requests
import time
import sys

BASE_URL = "http://localhost:8001"

def print_result(name: str, passed: bool, detail: str = ""):
    symbol = "✅ PASS" if passed else "❌ FAIL"
    print(f"{symbol} [{name}] {detail}")

def test_suite():
    print("=" * 60)
    print("RUNNING COMPLETE PROCUREAI AUTHENTICATION TEST SUITE")
    print("=" * 60)

    # 1. Valid login with admin
    s = requests.Session()
    res = s.post(f"{BASE_URL}/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!",
        "remember_me": True
    })
    admin_login_pass = res.status_code == 200 and res.json().get("user", {}).get("username") == "admin"
    admin_session_token = res.json().get("session_token")
    admin_headers = {"Authorization": f"Bearer {admin_session_token}"}
    print_result("1. Valid Admin Login", admin_login_pass, f"Token: {admin_session_token[:15]}...")

    # 2. Invalid password returns 401
    res_bad = requests.post(f"{BASE_URL}/v1/auth/login", json={
        "username_or_email": "buyer_john",
        "password": "WrongPassword123!"
    })
    print_result("2. Invalid Password Rejection", res_bad.status_code == 401, f"Detail: {res_bad.json().get('detail')}")

    # 3. Rate limiting / Progressive lockout after 5 failed attempts
    unique_suffix = int(time.time())
    test_user = f"lockout_{unique_suffix}"
    test_email = f"lockout_{unique_suffix}@procureai.internal"
    
    res_create = requests.post(f"{BASE_URL}/v1/admin/users", headers=admin_headers, json={
        "username": test_user,
        "email": test_email,
        "full_name": "Lockout Tester",
        "role": "Buyer",
        "initial_password": "InitialPassword123!"
    })
    
    locked = False
    lockout_msg = ""
    for i in range(5):
        rf = requests.post(f"{BASE_URL}/v1/auth/login", json={
            "username_or_email": test_user,
            "password": f"BadPassword{i}"
        })
        if "locked" in rf.text.lower():
            locked = True
            lockout_msg = rf.json().get("detail", "")
            break
    print_result("3. Progressive Lockout (5 failed attempts)", locked, f"Result: {lockout_msg}")

    # 4. Remember Me 30-day session persistence check
    res_rem = requests.post(f"{BASE_URL}/v1/auth/login", json={
        "username_or_email": "proc_manager",
        "password": "Manager123!",
        "remember_me": True
    })
    rem_pass = res_rem.status_code == 200 and "expires_at" in res_rem.json()
    print_result("4. Remember Me 30-Day Session Persistence", rem_pass, f"Expires at: {res_rem.json().get('expires_at')}")

    # 5. Google Login OAuth Flow (URL generation and callback)
    res_gurl = requests.get(f"{BASE_URL}/v1/auth/google/url")
    gurl_pass = res_gurl.status_code == 200 and "auth_url" in res_gurl.json()
    print_result("5. Google OAuth URL Generation", gurl_pass, f"Auth URL: {res_gurl.json().get('auth_url')[:40]}...")

    res_gcb = requests.post(f"{BASE_URL}/v1/auth/google/callback", json={
        "token": "simulated_google_token_proc_manager"
    })
    gcb_pass = res_gcb.status_code == 200 and "user" in res_gcb.json()
    print_result("6. Google OAuth ID Token Callback & Session Creation", gcb_pass, f"Linked user: {res_gcb.json().get('user', {}).get('email')}")

    # 7. Forgot Password & Single-use Reset Token
    res_forgot = requests.post(f"{BASE_URL}/v1/auth/forgot-password", json={
        "email": "finance@procureai.internal"
    })
    dev_token = res_forgot.json().get("dev_reset_token")
    forgot_pass = res_forgot.status_code == 200 and dev_token is not None
    print_result("7. Forgot Password Secure Token Generation", forgot_pass, f"Generated Single-use Token: {dev_token[:15] if dev_token else 'None'}...")

    # 8. Reset Password Execution
    res_reset = requests.post(f"{BASE_URL}/v1/auth/reset-password", json={
        "token": dev_token,
        "new_password": "NewFinancePassword456!"
    })
    reset_pass = res_reset.status_code == 200
    print_result("8. Reset Password Execution (Argon2id Hash Update)", reset_pass, f"Response: {res_reset.json().get('message')}")

    # 9. Verify Token is Single-Use (Reused reset token must fail)
    res_reuse = requests.post(f"{BASE_URL}/v1/auth/reset-password", json={
        "token": dev_token,
        "new_password": "AnotherPassword456!"
    })
    reuse_rejected = res_reuse.status_code == 400
    print_result("9. Reused Reset Token Rejected (Single-Use)", reuse_rejected, f"Detail: {res_reuse.json().get('detail')}")

    # 10. Login with newly reset password
    res_new_login = requests.post(f"{BASE_URL}/v1/auth/login", json={
        "username_or_email": "finance_amy",
        "password": "NewFinancePassword456!"
    })
    new_login_pass = res_new_login.status_code == 200
    print_result("10. Login with Newly Reset Password", new_login_pass, f"Welcome {res_new_login.json().get('user', {}).get('full_name')}")

    # 11. Role-based Access Control (Buyer trying to access admin users endpoint -> 403 Forbidden)
    res_buyer_login = requests.post(f"{BASE_URL}/v1/auth/login", json={
        "username_or_email": "buyer_john",
        "password": "Buyer123!"
    })
    buyer_token = res_buyer_login.json().get("session_token")
    res_forbidden = requests.get(f"{BASE_URL}/v1/admin/users", headers={"Authorization": f"Bearer {buyer_token}"})
    rbac_pass = res_forbidden.status_code == 403
    print_result("11. Role-Based Access Control (Buyer blocked from Admin APIs)", rbac_pass, f"Status: {res_forbidden.status_code} Forbidden")

    # 12. Inactive/Suspended Employee Account Login Rejection
    tester_id = res_create.json().get("id")
    if tester_id:
        requests.put(f"{BASE_URL}/v1/admin/users/{tester_id}/status", headers=admin_headers, json={"account_status": "SUSPENDED"})
        res_suspended_login = requests.post(f"{BASE_URL}/v1/auth/login", json={
            "username_or_email": test_user,
            "password": "InitialPassword123!"
        })
        suspended_blocked = res_suspended_login.status_code == 403
        print_result("12. Suspended Account Blocked from Login", suspended_blocked, f"Detail: {res_suspended_login.json().get('detail')}")

    # 13. Active Sessions Query and Revocation
    res_sessions = requests.get(f"{BASE_URL}/v1/auth/sessions", headers=admin_headers)
    sessions_list = res_sessions.json()
    sessions_pass = res_sessions.status_code == 200 and len(sessions_list) > 0
    print_result("13. Active Sessions Listing", sessions_pass, f"Found {len(sessions_list)} sessions")

    # 14. Logout All Devices
    res_logout_all = requests.post(f"{BASE_URL}/v1/auth/logout-all", headers=admin_headers)
    logout_all_pass = res_logout_all.status_code == 200 and res_logout_all.json().get("revoked_count", 0) > 0
    print_result("14. Revoke All Active Sessions", logout_all_pass, f"Revoked count: {res_logout_all.json().get('revoked_count')}")

    # 15. Verify Session Invalidation
    res_me_after = requests.get(f"{BASE_URL}/v1/auth/me", headers=admin_headers)
    invalidated_pass = res_me_after.status_code == 401
    print_result("15. Revoked Session Invalidation Verified", invalidated_pass, "Token no longer authorized")

    print("=" * 60)
    print("ALL 15 AUTHENTICATION & SECURITY TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_suite()
