#!/bin/bash

# Umami Setup Script for Chabad Mafteach
# This script sets up Umami analytics with secure defaults

set -e

echo "🔧 Setting up Umami Analytics for Chabad Mafteach..."

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Generate secure values
UMAMI_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
UMAMI_HASH_SALT=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Update .env.umami with secure values
cat > .env.umami << EOF
# Umami Environment Variables
UMAMI_DB_PASSWORD=${UMAMI_DB_PASSWORD}
UMAMI_HASH_SALT=${UMAMI_HASH_SALT}

# Optional: Custom domain for tracking script
# UMAMI_SITE_DOMAIN=chabad-mafteach.org
EOF

echo "✅ Generated secure credentials"

echo "🚀 Starting Umami..."

# Start Umami
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.umami.yml --env-file .env.umami up -d
else
    docker compose -f docker-compose.umami.yml --env-file .env.umami up -d
fi

echo "⏳ Waiting for Umami to be ready..."

# Wait for database to be ready
sleep 10

# Wait for Umami to be reachable (Umami does not expose a guaranteed /api/health endpoint)
for i in {1..30}; do
    if curl -fsS http://localhost:3000/login &> /dev/null; then
        echo "✅ Umami is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

if [ $i -eq 30 ]; then
    echo "❌ Umami failed to start. Check logs with: docker-compose -f docker-compose.umami.yml logs"
    exit 1
fi

echo ""
echo "🎉 Umami Setup Complete!"
echo ""
echo "📊 Access Umami Dashboard:"
echo "   URL: http://localhost:3000"
echo "   Email: admin"
echo "   Password: umami"
echo ""
echo "⚠️  IMPORTANT: Change the default admin password immediately!"
echo ""
echo "📝 Next Steps:"
echo "   1. Login to Umami dashboard"
echo "   2. Change admin password"
echo "   3. Add your website"
echo "   4. Get the tracking script ID"
echo "   5. Add tracking to your Next.js app"
echo ""
echo "🔗 Tracking Script Integration:"
echo "   Add this to your layout.tsx:"
echo "   <Script src=\"http://localhost:3000/analytics.js\" data-website-id=\"YOUR_ID\" async />"
