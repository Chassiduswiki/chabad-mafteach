#!/bin/bash

# Authentication Flow Test Script
# Tests the complete login, access control, and logout flow

set -e

BASE_URL="http://localhost:3001"
DIRECTUS_URL="${NEXT_PUBLIC_DIRECTUS_URL:-https://directus-production-20db.up.railway.app}"

echo "🧪 Testing Chabad Mafteach Authentication Flow"
echo "=============================================="
echo ""

# Test 1: Public routes should be accessible without auth
echo "✓ Test 1: Public routes accessible without authentication"
echo "  Testing GET /"
curl -s -o /dev/null -w "  Status: %{http_code}\n" "$BASE_URL/"

echo "  Testing GET /topics"
curl -s -o /dev/null -w "  Status: %{http_code}\n" "$BASE_URL/topics"

echo "  Testing GET /auth/signin"
curl -s -o /dev/null -w "  Status: %{http_code}\n" "$BASE_URL/auth/signin"

echo ""

# Test 2: Protected routes should redirect without auth
echo "✓ Test 2: Protected routes redirect without authentication"
echo "  Testing GET /editor (should redirect to /auth/signin)"
curl -s -o /dev/null -w "  Status: %{http_code}\n" -L "$BASE_URL/editor"

echo "  Testing GET /admin (should redirect to /auth/signin)"
curl -s -o /dev/null -w "  Status: %{http_code}\n" -L "$BASE_URL/admin"

echo ""

# Test 3: Login API
echo "✓ Test 3: Login API endpoint"
echo "  Testing POST /api/auth/login with invalid credentials"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@example.com","password":"wrongpassword"}')
echo "  Response: $RESPONSE"

echo ""

# Test 4: Logout API
echo "✓ Test 4: Logout API endpoint"
echo "  Testing POST /api/auth/logout"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout")
echo "  Response: $RESPONSE"

echo ""

echo "✅ Authentication Flow Tests Complete!"
echo ""
echo "📝 Manual Testing Steps:"
echo "1. Open http://localhost:3001/auth/signin"
echo "2. Try to access http://localhost:3001/editor (should redirect to signin)"
echo "3. Try to access http://localhost:3001/admin (should redirect to signin)"
echo "4. Log in with your Directus credentials"
echo "5. Verify you can access /editor (if editor role) or /admin (if admin role)"
echo "6. Check that user menu appears in top-right"
echo "7. Click logout and verify redirect to signin"
echo ""
