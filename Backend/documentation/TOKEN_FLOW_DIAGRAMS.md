# Refresh Token Flow Diagrams

## 1. Login Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│          │                    │          │                    │          │
│  Client  │                    │  Server  │                    │ Database │
│          │                    │          │                    │          │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /auth/login              │                               │
     │ {mobile, password}            │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Verify credentials            │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ User found ✓                  │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │                               │ Generate access token (15m)   │
     │                               │ Generate refresh token (7d)   │
     │                               │                               │
     │                               │ Store refresh token           │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ Token stored ✓                │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ Response:                     │                               │
     │ {                             │                               │
     │   accessToken: "eyJ...",      │                               │
     │   refreshToken: "a8f...",     │                               │
     │   user: {...}                 │                               │
     │ }                             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ Store tokens in localStorage  │                               │
     │                               │                               │
```

## 2. API Request Flow (with valid access token)

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /auth/change-password    │                               │
     │ Authorization: Bearer eyJ...  │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Verify JWT signature          │
     │                               │ Check expiry (<15m) ✓         │
     │                               │                               │
     │                               │ Execute request               │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ Success ✓                     │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ Response: Success             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

## 3. Token Expired → Automatic Refresh Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /api/some-endpoint       │                               │
     │ Authorization: Bearer eyJ...  │                               │
     │ (access token expired)        │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Verify JWT signature ✓        │
     │                               │ Check expiry (>15m) ✗         │
     │                               │                               │
     │ 401 Unauthorized              │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ Interceptor detects 401       │                               │
     │                               │                               │
     │ POST /auth/refresh-token      │                               │
     │ {refresh_token: "a8f..."}     │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Verify refresh token          │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ Check:                        │
     │                               │ - Token exists? ✓             │
     │                               │ - Not revoked? ✓              │
     │                               │ - Not expired? ✓              │
     │                               │ - User active? ✓              │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │                               │ Generate new access token     │
     │                               │ Generate new refresh token    │
     │                               │                               │
     │                               │ Revoke old refresh token      │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ Store new refresh token       │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ Success ✓                     │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ Response:                     │                               │
     │ {                             │                               │
     │   accessToken: "eyJ...",      │                               │
     │   refreshToken: "b9g..."      │                               │
     │ }                             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ Update stored tokens          │                               │
     │                               │                               │
     │ Retry original request        │                               │
     │ POST /api/some-endpoint       │                               │
     │ Authorization: Bearer eyJ...  │                               │
     │ (NEW access token)            │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Verify new token ✓            │
     │                               │ Execute request               │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │ Response: Success             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

## 4. Password Change → Token Revocation Flow

```
┌──────────┐   ┌──────────┐            ┌──────────┐            ┌──────────┐
│ Device 1 │   │ Device 2 │            │  Server  │            │ Database │
└────┬─────┘   └────┬─────┘            └────┬─────┘            └────┬─────┘
     │              │                       │                       │
     │ Logged in    │ Logged in             │                       │
     │ Token1       │ Token2                │                       │
     │              │                       │                       │
     │ POST /auth/change-password           │                       │
     │ (with Token1)                        │                       │
     ├─────────────────────────────────────>│                       │
     │              │                       │                       │
     │              │                       │ Verify Token1 ✓       │
     │              │                       │ Update password       │
     │              │                       ├──────────────────────>│
     │              │                       │                       │
     │              │                       │ Revoke ALL refresh    │
     │              │                       │ tokens for this user  │
     │              │                       ├──────────────────────>│
     │              │                       │                       │
     │              │                       │ Token1 revoked ✓      │
     │              │                       │ Token2 revoked ✓      │
     │              │                       │<──────────────────────┤
     │              │                       │                       │
     │ Success!     │                       │                       │
     │<─────────────────────────────────────┤                       │
     │              │                       │                       │
     │              │                       │                       │
     │              │ After 15 minutes...   │                       │
     │              │ Access token expired  │                       │
     │              │                       │                       │
     │              │ POST /auth/refresh-token                      │
     │              │ (with Token2)         │                       │
     │              ├──────────────────────>│                       │
     │              │                       │                       │
     │              │                       │ Verify Token2         │
     │              │                       ├──────────────────────>│
     │              │                       │                       │
     │              │                       │ Token2 is revoked ✗   │
     │              │                       │<──────────────────────┤
     │              │                       │                       │
     │              │ 401 Unauthorized      │                       │
     │              │ "Invalid refresh token"                      │
     │              │<──────────────────────┤                       │
     │              │                       │                       │
     │              │ Redirect to login     │                       │
     │              │ Must login with       │                       │
     │              │ new password          │                       │
     │              │                       │                       │
```

## 5. Logout Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /auth/logout             │                               │
     │ {refresh_token: "a8f..."}     │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Revoke refresh token          │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ SET is_revoked = true         │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ Response: Success             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ Clear localStorage            │                               │
     │ Redirect to login             │                               │
     │                               │                               │
```

## 6. Logout All Devices Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Device 1 │   │ Device 2 │   │ Device 3 │   │  Server  │   │ Database │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     │ Logged in    │ Logged in    │ Logged in    │              │
     │ Token1       │ Token2       │ Token3       │              │
     │              │              │              │              │
     │ POST /auth/logout-all       │              │              │
     │ Authorization: Bearer eyJ... │              │              │
     ├─────────────────────────────────────────────>             │
     │              │              │              │              │
     │              │              │              │ Verify JWT   │
     │              │              │              │ Get user_id  │
     │              │              │              │              │
     │              │              │              │ Revoke ALL   │
     │              │              │              │ tokens for   │
     │              │              │              │ this user    │
     │              │              │              ├─────────────>│
     │              │              │              │              │
     │              │              │              │ UPDATE       │
     │              │              │              │ refresh_tokens
     │              │              │              │ SET is_revoked = true
     │              │              │              │ WHERE user_id = ...
     │              │              │              │              │
     │              │              │              │ 3 rows updated
     │              │              │              │<─────────────┤
     │              │              │              │              │
     │ Response:    │              │              │              │
     │ Logged out from 3 devices   │              │              │
     │<─────────────────────────────────────────────             │
     │              │              │              │              │
     │              │              │              │              │
     │              │ Later... try to refresh     │              │
     │              │ POST /auth/refresh-token    │              │
     │              ├─────────────────────────────>              │
     │              │              │              │              │
     │              │              │              │ Check token  │
     │              │              │              ├─────────────>│
     │              │              │              │              │
     │              │              │              │ is_revoked = true ✗
     │              │              │              │<─────────────┤
     │              │              │              │              │
     │              │ 401 Unauthorized            │              │
     │              │<─────────────────────────────              │
     │              │              │              │              │
     │              │ Redirect to login           │              │
     │              │              │              │              │
     │              │              │ Same for Device 3           │
     │              │              │ All devices logged out      │
     │              │              │              │              │
```

## 7. Token Lifecycle Timeline

```
Time          Access Token                Refresh Token                 Action
───────────── ─────────────────────────── ───────────────────────────── ──────────────────
0:00          [████████████████] Valid    [█████████████████████] Valid Login
              (15 min remaining)          (7 days remaining)

0:05          [██████████      ] Valid    [█████████████████████] Valid API calls work
              (10 min remaining)          (7 days remaining)

0:10          [█████           ] Valid    [█████████████████████] Valid API calls work
              (5 min remaining)           (7 days remaining)

0:15          [                ] EXPIRED  [█████████████████████] Valid API calls fail (401)
              (expired)                   (7 days remaining)

0:16          [████████████████] Valid    [█████████████████████] Valid Auto-refresh
              (15 min remaining)          (7 days remaining)          Old refresh revoked
              NEW TOKEN                   NEW TOKEN

0:31          [                ] EXPIRED  [█████████████████████] Valid 401 error
              (expired)                   (7 days remaining)

0:32          [████████████████] Valid    [█████████████████████] Valid Auto-refresh again
              (15 min remaining)          (7 days remaining)
              NEW TOKEN                   NEW TOKEN

...continues for 7 days...

7 days        [████████████████] Valid    [                ] EXPIRED Cannot refresh
              (15 min remaining)          (expired)                   Must login again

7 days        [                ] EXPIRED  [                ] EXPIRED Both expired
+ 15 min      (expired)                   (expired)                   Must login again
```

## 8. Database State Changes

### After Login
```
refresh_tokens table:
┌─────────────────────┬─────────────────────┬──────────────┬─────────────┬────────────┐
│ id                  │ user_id             │ token        │ expires_at  │ is_revoked │
├─────────────────────┼─────────────────────┼──────────────┼─────────────┼────────────┤
│ uuid-1              │ user-uuid-123       │ a8f5f167...  │ +7 days     │ false      │
└─────────────────────┴─────────────────────┴──────────────┴─────────────┴────────────┘
```

### After Token Refresh
```
refresh_tokens table:
┌─────────────────────┬─────────────────────┬──────────────┬─────────────┬────────────┐
│ id                  │ user_id             │ token        │ expires_at  │ is_revoked │
├─────────────────────┼─────────────────────┼──────────────┼─────────────┼────────────┤
│ uuid-1              │ user-uuid-123       │ a8f5f167...  │ +7 days     │ TRUE       │ ← Revoked
│ uuid-2              │ user-uuid-123       │ b9g6g278...  │ +7 days     │ false      │ ← New
└─────────────────────┴─────────────────────┴──────────────┴─────────────┴────────────┘
```

### After Login from Another Device
```
refresh_tokens table:
┌─────────────────────┬─────────────────────┬──────────────┬─────────────┬────────────┐
│ id                  │ user_id             │ token        │ expires_at  │ is_revoked │
├─────────────────────┼─────────────────────┼──────────────┼─────────────┼────────────┤
│ uuid-1              │ user-uuid-123       │ a8f5f167...  │ +7 days     │ TRUE       │
│ uuid-2              │ user-uuid-123       │ b9g6g278...  │ +7 days     │ false      │ ← Device 1
│ uuid-3              │ user-uuid-123       │ c0h7h389...  │ +7 days     │ false      │ ← Device 2
└─────────────────────┴─────────────────────┴──────────────┴─────────────┴────────────┘
```

### After Password Change
```
refresh_tokens table:
┌─────────────────────┬─────────────────────┬──────────────┬─────────────┬────────────┐
│ id                  │ user_id             │ token        │ expires_at  │ is_revoked │
├─────────────────────┼─────────────────────┼──────────────┼─────────────┼────────────┤
│ uuid-1              │ user-uuid-123       │ a8f5f167...  │ +7 days     │ TRUE       │
│ uuid-2              │ user-uuid-123       │ b9g6g278...  │ +7 days     │ TRUE       │ ← Revoked!
│ uuid-3              │ user-uuid-123       │ c0h7h389...  │ +7 days     │ TRUE       │ ← Revoked!
└─────────────────────┴─────────────────────┴──────────────┴─────────────┴────────────┘

All tokens for this user are now revoked → All devices must login again
```

## 9. Security Comparison

### Old System (Single JWT - 24h)
```
Login → JWT Token (24h) → Use for 24 hours → Expire
         ↓
         If stolen: Attacker has 24h access
         Password change: Token still valid for remaining time
         Cannot force logout
```

### New System (Access + Refresh Tokens)
```
Login → Access Token (15m) + Refresh Token (7d)
         ↓                     ↓
         API requests          Get new access token
         ↓                     ↓
         Expires in 15m        Revocable from DB
         ↓                     ↓
         If stolen:            Password change:
         - Only 15m access     - All tokens revoked
         - Cannot refresh      - Force logout all devices
         - Limited damage      - Immediate effect
```

## 10. Error Handling Flow

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ API Request with token        │
     ├──────────────────────────────>│
     │                               │
     │                           ┌───┴───┐
     │                           │ Check │
     │                           │ Token │
     │                           └───┬───┘
     │                               │
     │            ┌──────────────────┼──────────────────┐
     │            │                  │                  │
     │        Valid?             Expired?           Invalid?
     │            │                  │                  │
     │        ┌───▼───┐          ┌───▼───┐         ┌───▼───┐
     │        │Process│          │ 401   │         │ 401   │
     │        │Request│          │ JWT   │         │Invalid│
     │        │       │          │Expired│         │ Token │
     │        └───┬───┘          └───┬───┘         └───┬───┘
     │            │                  │                  │
     │ Success    │                  │                  │
     │<───────────┤                  │                  │
     │            │                  │                  │
     │            │ Try refresh      │                  │
     │            │ token            │                  │
     │            │                  │                  │
     │            │ ┌────────────────┼──────┐           │
     │            │ │                │      │           │
     │            │ │            Valid?  Invalid?       │
     │            │ │                │      │           │
     │            │ │            ┌───▼──┐ ┌─▼──┐        │
     │            │ │            │Refresh│Logout│        │
     │            │ │            │Success│User  │        │
     │            │ │            └───┬───┘└─┬──┘        │
     │            │ │                │      │           │
     │ New tokens │ │                │      │           │
     │<───────────┼─┼────────────────┘      │           │
     │            │ │                       │           │
     │            │ │ Redirect to login     │           │
     │            │ │<──────────────────────┤           │
     │            │ │                                   │
     │            │ │ Redirect to login                 │
     │            │ │<──────────────────────────────────┘
     │            │ │
```

---

## Summary

✅ **Login**: Get both tokens  
✅ **API Request**: Use access token (15 min)  
✅ **Token Expired**: Auto-refresh with refresh token  
✅ **Token Refresh**: Old token revoked, new tokens issued  
✅ **Password Change**: All tokens revoked, all devices logged out  
✅ **Logout**: Single token revoked  
✅ **Logout All**: All tokens revoked  

---

**Diagrams Created:** January 2025  
**For:** SARVVIVAH Refresh Token System
