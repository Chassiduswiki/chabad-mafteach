#!/bin/bash

# Complete Topic Translation Migration Runner
# This script helps you run the migration with proper environment setup

echo "🚀 Topic Translation Migration Runner"
echo "======================================"
echo ""

# Check if token is provided
if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ Error: DIRECTUS_ADMIN_TOKEN not set"
  echo ""
  echo "Please get your admin token from:"
  echo "https://directus-production-20db.up.railway.app/admin/settings/access-tokens"
  echo ""
  echo "Then run:"
  echo "export DIRECTUS_ADMIN_TOKEN='your-token-here'"
  echo "./scripts/run-migration.sh"
  echo ""
  exit 1
fi

echo "✅ Admin token found"
echo "📦 Running migration script..."
echo ""

# Run the migration
node scripts/complete-migration.mjs

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Verify migration with SQL queries"
  echo "2. Add default_language field to topics table"
  echo "3. Test the new translation system"
else
  echo ""
  echo "❌ Migration failed. Check the error messages above."
  exit 1
fi
