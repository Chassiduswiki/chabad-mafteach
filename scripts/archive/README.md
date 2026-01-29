# Archived Scripts

This directory contains old scripts that are no longer actively used but are kept for reference.

## Contents

### Ingestion Scripts (Multiple Versions)
These are various iterations of the v1 data ingestion scripts. Only `ingest-v1-final.ts` in the parent directory is the canonical version.

- `ingest-v1-complete.ts` - Original complete version
- `ingest-v1-complete-fixed.ts` - Bug fix iteration
- `ingest-v1-enhanced.ts` - Enhanced parsing version
- `ingest-v1-full.ts` - Full data import version
- `ingest-v1-dictionary.ts` - Dictionary-style import
- `ingest-to-directus.ts` - Generic ingestion
- `import-to-directus.js` - Original import script
- `import-v1-to-directus.js` - V1 specific import

### One-Time Migration Files
- `fix-orphaned-records.sql` - SQL for cleaning orphaned records
- `fix-schema-migration.sql` - Schema migration SQL
- `parsed-entries.json` - Pre-parsed v1 data

### Status Reports
- `audit-and-fix-report.md` - Audit completion report
- `complete-import.md` - Import completion status
- `final-import-status.md` - Final import status
- `v1-ingestion-workflow.md` - V1 ingestion workflow documentation

---

**Note**: These files are archived and should not be used for new work. For current scripts, see the parent `/scripts/` directory.
