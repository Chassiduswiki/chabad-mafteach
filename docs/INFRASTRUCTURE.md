# Infrastructure & Maintenance Guide

## 1. CI/CD Pipeline (GitHub Actions)

We have set up a Continuous Integration pipeline to ensure code quality and stability.

### Workflows
- **CI Checks (`.github/workflows/ci.yml`)**: Runs on every push to `main` and `develop`, and on Pull Requests.
    - **Linting**: `npm run lint` (ESLint)
    - **Type Checking**: `npm run type-check` (TypeScript)
    - **Unit Tests**: `npm run test:ci` (Jest)
    - **Build Test**: `npm run build` (Next.js Build verification)

### Setup
Ensure the following secrets are configured in GitHub Repository Settings if needed for tests (though usually CI uses mock envs):
- `DIRECTUS_URL` (if integration tests run against a staging instance)
- `DIRECTUS_STATIC_TOKEN`

## 2. Monitoring (Sentry)

Sentry is integrated for exception tracking and performance monitoring.

### Configuration
- **DSN**: Configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- **Environment**: Automatically detects `production` vs `development`.

### Alerts
Recommended Sentry Alerts:
1. **New Issue Check**: Alert on any new issue type.
2. **High Error Rate**: Alert if error rate exceeds 1% in 5 minutes.
3. **Frontend Regression**: Alert if `LCP` (Largest Contentful Paint) degrades by >50%.

## 3. Backup Procedures

### Database (Railway PostgreSQL)
Railway provides automated backups, but manual backups are recommended before major schema changes.

**Manual Backup Command:**
```bash
pg_dump -h <host> -p <port> -U <user> -d <database> > backup_$(date +%Y%m%d).sql
```

**Restore Command:**
```bash
psql -h <host> -p <port> -U <user> -d <database> < backup_date.sql
```

### Directus Schema
Backup the Directus schema (collections/fields) using the `schema-sync` or snapshot feature if available, or export schema via API.

```bash
# Export schema to JSON
npx directus schema snapshot ./snapshots/schema_$(date +%Y%m%d).yaml
```

## 4. Periodic Maintenance

### Database Cleanup
Run the integrity script periodically to remove orphaned records:
```bash
node scripts/cleanup-data-integrity.js
```

### Dependency Updates
Check for outdated packages:
```bash
npm outdated
```
Update critical dependencies carefully, testing the build after each major update.
