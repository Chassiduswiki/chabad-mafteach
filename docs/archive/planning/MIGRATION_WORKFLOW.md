# Directus Migration & Staging Workflow

This document outlines the standard process for managing schema changes and content updates between environments.

## 1. Environments
- **Local**: Development on local machine using local Directus or staging API.
- **Staging**: `https://directus-staging...` - Sandbox for testing schema migrations.
- **Production**: `https://directus-production...` - Public-facing instance.

## 2. Schema Migration Process (Directus)
Directus provides a schema export/import feature. Use this to sync environments.

### Exporting Schema (Source Environment)
1. Navigate to **Settings > Schema**.
2. Click **Export Schema** (JSON format).
3. Save the file as `scripts/migrations/schema-[timestamp].json`.

### Migration Dry-Run (Staging)
1. **Always** apply changes to Staging first.
2. Go to **Settings > Schema** in Staging.
3. Click **Import Schema** and upload your JSON.
4. **DO NOT** click "Apply" yet. Review the "Differences" list first.
5. If no conflicts, click **Apply**.

### Verification Checklist
- [ ] Check collection visibility (Permissions).
- [ ] Verify junction tables still link correctly.
- [ ] Test frontend API calls against Staging.

## 3. Rollback Procedure
If a migration breaks Staging:
1. Re-import the previous known-good schema JSON.
2. If data was corrupted, restore from Railway/Database daily backup.

## 4. Promotion to Production
1. Only promote after 24 hours of successful operation in Staging.
2. Export from Staging and Import to Production using the same process.
3. Schedule migrations during low-traffic windows (e.g., 2 AM EST).

## 5. Automated Backups
Railway (our host) provides automated Postgres backups. 
- Ensure "Daily Backups" are enabled in Railway dashboard.
- Manual Snapshot: Trigger a manual backup in Railway before applying schema changes to Production.
