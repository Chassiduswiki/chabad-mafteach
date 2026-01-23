# Authentication System Documentation

## Overview
The Chabad Mafteach application uses a **dual authentication system** that bridges Directus user management with a custom Next.js JWT-based session system.

---

## 🔐 Authentication Flow

### 1. User Login Process

```
User enters credentials at /auth/signin
         ↓
POST /api/auth/login
         ↓
Validate against Directus /auth/login endpoint
         ↓
Fetch user details from Directus /users/me
         ↓
Generate App JWT (signed with JWT_SECRET)
         ↓
Return accessToken + refreshToken to client
         ↓
Client stores token in localStorage as 'auth_token'
         ↓
All subsequent API calls include: Authorization: Bearer {token}
```

### 2. API Request Authentication

```
Client makes request with Authorization header
         ↓
API route calls verifyAuth(request)
         ↓
Check 1: Is it the DIRECTUS_STATIC_TOKEN? → Grant admin access
         ↓
Check 2: Is it a valid App JWT? → Verify signature with JWT_SECRET
         ↓
Extract userId and role from token
         ↓
Proceed with authorized request
```

---

## 🔑 Token Types

### 1. **App JWT Token** (Primary User Authentication)
- **Generated**: When user logs in via `/auth/signin`
- **Stored**: Browser `localStorage` as `auth_token`
- **Format**: JWT signed with `JWT_SECRET`
- **Expiration**: 24 hours
- **Contains**: `{ userId, role, iat }`
- **Used for**: All authenticated API requests from the frontend

### 2. **Directus Static Token** (Backend Master Key)
- **Defined**: Environment variable `DIRECTUS_STATIC_TOKEN`
- **Used for**: Server-side Directus API calls
- **Special**: Also accepted by `verifyAuth()` for admin bypass
- **Format**: Plain string (not JWT)
- **Expiration**: Never (until manually changed)

### 3. **Directus Access Token** (Temporary)
- **Generated**: By Directus `/auth/login` endpoint
- **Used for**: Validating user credentials during login
- **Lifespan**: Only used to fetch user details, then discarded
- **Not stored**: Never sent to client

### 4. **Refresh Token**
- **Generated**: Alongside App JWT during login
- **Expiration**: 7 days
- **Purpose**: Get new access tokens without re-login
- **Endpoint**: `/api/auth/refresh` (to be implemented)

---

## 🌐 Environment Variables

### Required Variables

```bash
# Directus Instance URL
DIRECTUS_URL=https://directus-production-20db.up.railway.app
NEXT_PUBLIC_DIRECTUS_URL=https://directus-production-20db.up.railway.app

# Master Backend Token (from Directus Admin → User Settings)
DIRECTUS_STATIC_TOKEN=ChassidusWikiAdminToken2025

# App Session Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Service Key (optional, for AI features)
OPENROUTER_API_KEY=sk-or-v1-...
```

### Variable Usage

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DIRECTUS_URL` | Server-side code | Backend Directus API calls |
| `NEXT_PUBLIC_DIRECTUS_URL` | Client-side code | Proxy routing, login endpoint |
| `DIRECTUS_STATIC_TOKEN` | Server API routes | Admin access to Directus |
| `JWT_SECRET` | Auth utilities | Sign/verify App JWTs |
| `OPENROUTER_API_KEY` | AI features | OpenRouter API access |

---

## 👤 User Roles

### Role Mapping
Directus roles are mapped to app roles during login:

```typescript
const role = directusUser.role?.name?.toLowerCase().includes('admin') 
  ? 'admin' 
  : 'editor';
```

### Permission Levels

| Role | Can Access | Restrictions |
|------|-----------|--------------|
| **Admin** | `/admin/*`, `/editor/*`, All API routes | None |
| **Editor** | `/editor/*`, Write operations | Cannot access `/admin/settings` |
| **Public** | `/topics/*`, `/seforim/*`, Read-only APIs | No write access |

---

## 🚪 Access Points

### Sign In
- **URL**: `/auth/signin`
- **Credentials**: Your Directus email and password
- **Success**: Redirects to `/editor`
- **Token Storage**: `localStorage.auth_token`

### Admin Dashboard
- **URL**: `/admin`
- **Requires**: Admin role
- **Features**: Analytics, user management, system settings

### Editor
- **URL**: `/editor/topics`
- **Requires**: Editor or Admin role
- **Features**: Content creation, topic editing

### Settings
- **URL**: `/admin/settings`
- **Requires**: Admin role
- **Features**: Token breakdown, user directory, system config

---

## 🔧 How to Log In

### Step 1: Get Your Directus Credentials
1. Go to your Directus Admin Panel: https://directus-production-20db.up.railway.app/admin
2. Sign in with your existing Directus credentials
3. Note your email and password

### Step 2: Log In to the App
1. Navigate to: `https://your-app-url.com/auth/signin`
2. Enter the **same email and password** you use for Directus
3. Click "Sign In with Directus"
4. You'll be redirected to `/editor` on success

### Step 3: Verify Access
- Check that you can access `/admin` (if you're an admin)
- Try editing a topic at `/editor/topics/[slug]`
- Your token is valid for 24 hours

---

## 🐛 Troubleshooting

### "Invalid email or password"
**Cause**: Directus login failed
**Fix**:
1. Verify your credentials work at the Directus Admin Panel
2. Check that `DIRECTUS_URL` is correct in `.env`
3. Ensure Directus instance is running

### "Authentication required" (401)
**Cause**: Token missing or invalid
**Fix**:
1. Check `localStorage.auth_token` exists in browser DevTools
2. Try logging out and back in
3. Verify `JWT_SECRET` is set in environment

### "Insufficient permissions" (403)
**Cause**: User role doesn't have access
**Fix**:
1. Check your role in Directus Admin Panel
2. Ensure role name includes "admin" for admin access
3. Contact system administrator to update your role

### Login works but editor gives 401
**Cause**: Token not being sent with requests
**Fix**:
1. Check browser console for errors
2. Verify `Authorization` header is present in Network tab
3. Clear `localStorage` and log in again

---

## 🔒 Security Best Practices

### For Production

1. **Change JWT_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Use output as `JWT_SECRET`

2. **Rotate DIRECTUS_STATIC_TOKEN**:
   - Generate new token in Directus Admin
   - Update environment variable
   - Redeploy application

3. **Use HTTPS**:
   - Ensure `DIRECTUS_URL` uses `https://`
   - Enable SSL on hosting platform

4. **Set Secure Headers**:
   - Already configured in `verifyAuth()`
   - Tokens transmitted via Authorization header only

### For Development

1. **Use .env.local**:
   ```bash
   cp .env .env.local
   # Edit .env.local with development values
   ```

2. **Development Bypass**:
   - Some routes allow unauthenticated access in `NODE_ENV=development`
   - Never deploy with this enabled

---

## 📊 Token Breakdown Dashboard

View real-time token status at `/admin/settings`:

- **App JWT**: Shows active users who can generate tokens
- **Directus Static**: Lists users with permanent API tokens
- **System Secret**: Verifies `DIRECTUS_STATIC_TOKEN` is configured
- **AI Service**: Confirms `OPENROUTER_API_KEY` is set
- **User Directory**: Complete list of users, roles, and token status

---

## 🔄 Token Lifecycle

### Login (Token Creation)
```typescript
// User logs in
const accessToken = createAuthToken(userId, role);  // 24h expiry
const refreshToken = createRefreshToken(userId);    // 7d expiry

// Stored in localStorage
localStorage.setItem('auth_token', accessToken);
```

### API Request (Token Usage)
```typescript
// Every API call includes token
fetch('/api/topics/my-topic', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### Token Verification (Server-Side)
```typescript
// API route validates token
const auth = verifyAuth(request);
if (!auth) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
// auth = { userId: '...', role: 'admin' }
```

### Token Expiry (Auto-Logout)
- After 24 hours, token becomes invalid
- User must log in again
- Refresh token can be used to get new access token (feature pending)

---

## 🧪 Testing Authentication

### Manual Test (Browser)

1. **Open DevTools** (F12)
2. **Go to Console**:
   ```javascript
   // Check if token exists
   localStorage.getItem('auth_token')
   
   // Test API call
   fetch('/api/admin/auth-status', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
     }
   }).then(r => r.json()).then(console.log)
   ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "users": [...],
     "tokenBreakdown": {...}
   }
   ```

### Automated Test (curl)

```bash
# 1. Login
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Response: { "accessToken": "eyJhbG...", ... }

# 2. Use token
curl https://your-app.com/api/admin/auth-status \
  -H "Authorization: Bearer eyJhbG..."
```

---

## 📝 Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `/lib/auth.ts` | Core auth utilities (verifyAuth, createAuthToken) |
| `/app/api/auth/login/route.ts` | Login endpoint |
| `/app/auth/signin/page.tsx` | Sign-in UI |
| `/app/api/admin/auth-status/route.ts` | Token status API |
| `/app/admin/settings/page.tsx` | Token breakdown UI |

### Key Functions

```typescript
// Verify incoming request
verifyAuth(request: NextRequest): { userId: string; role: string } | null

// Create new JWT
createAuthToken(userId: string, role: string): string

// Protect API route
requireAuth(handler: Function): Function
requireEditor(handler: Function): Function
```

---

## 🎯 Quick Reference

### I want to...

**...log in to the app**
→ Go to `/auth/signin`, use Directus credentials

**...check my token status**
→ Go to `/admin/settings` (admin only)

**...access the editor**
→ Log in, then go to `/editor/topics`

**...use the API directly**
→ Include `Authorization: Bearer {token}` header

**...reset my password**
→ Use Directus Admin Panel password reset

**...create a new user**
→ Add user in Directus Admin, they can log in immediately

**...revoke access**
→ Delete user in Directus Admin or change their password

---

## 🆘 Support

If authentication is still not working:

1. **Check logs**: Look for errors in browser console and server logs
2. **Verify environment**: Ensure all variables are set correctly
3. **Test Directus**: Confirm you can log in to Directus Admin Panel
4. **Clear cache**: Clear browser cache and localStorage
5. **Restart server**: Restart the Next.js development server

For persistent issues, check:
- Network tab in DevTools for failed requests
- Server logs for authentication errors
- Directus instance health and accessibility
