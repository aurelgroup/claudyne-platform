# Claudyne Database Migrations

## Overview
All database migrations are stored here with sequential numbering (YYYYMMDD_description.sql). 
Migrations are **idempotent** - they use `IF NOT EXISTS` and can be safely re-run.

## Migration History

### 20250101_init_schema.sql (Migration 001)
**Status**: Consolidated from legacy
**What**: Initial schema consolidation
- Core tables: users, students, lessons, subscriptions, payments
- Indexes for performance

**Legacy sources**: 
- add_missing_columns_v1-v10_FINAL.sql
- create_missing_tables.sql
- consolidate-databases.sql

### 20250601_add_lessons_columns.sql (Migration 002)
**Status**: Consolidated from legacy
**What**: Enhanced lessons table
- cameroonContext, stats, resources (JSONB fields)
- reviewStatus, reviewedBy, pendingReview
- transcript, videoUrl, version
- GIN indexes for JSONB performance

**Legacy sources**:
- add_missing_columns_v10_FINAL.sql
- add_all_missing_student_columns.sql

### 20251003_add_subscription_and_admin_features.sql
**Status**: Already in proper format (kept as-is)
**What**: Subscription and admin enhancements

---

## How to Run Migrations

### Development
```bash
cd backend
psql -U claudyne_user -d claudyne_dev < migrations/20250101_init_schema.sql
psql -U claudyne_user -d claudyne_dev < migrations/20250601_add_lessons_columns.sql
```

### Production
⚠️ Always test migrations on a **staging database first**!

```bash
# Backup production first
pg_dump -U claudyne_user -d claudyne_production > backup_$(date +%s).sql

# Run migrations
psql -U claudyne_user -d claudyne_production < migrations/20250101_init_schema.sql
psql -U claudyne_user -d claudyne_production < migrations/20250601_add_lessons_columns.sql
```

---

## Rules for New Migrations

1. **Naming**: Use `YYYYMMDD_description.sql` format
2. **Idempotence**: Always use `IF NOT EXISTS`, `IF NOT` for drops, etc.
3. **Comments**: Add `COMMENT ON` for complex columns
4. **Indexes**: Include relevant indexes for new columns
5. **Backwards compatible**: Never break existing data/queries
6. **Testing**: Always test locally first before committing

---

## Legacy SQL Files (DEPRECATED)

The following files are consolidated into migrations above and should NOT be used:
- add_missing_columns_v*.sql (v1-v10)
- add_missing_columns_students.sql
- add_all_missing_student_columns.sql
- create_missing_tables.sql
- create-families-complete.sql
- create-missing-tables.sql
- consolidate-databases.sql
- database/claudyne-schema.sql
- database/init/01-init-claudyne.sql
- database/production/real-data-schema.sql
- setup-production-database.sql

These files are kept in the root directory for **historical reference only**. 
Do not use them for new deployments. Use the numbered migrations in `/backend/migrations/` instead.

---

## Verifying Schema

To check current schema state:
```bash
psql -U claudyne_user -d claudyne_production -c "\d+ lessons"
psql -U claudyne_user -d claudyne_production -c "\di lessons*"
```

To test migrations are idempotent:
```bash
# Run once
psql -U claudyne_user -d claudyne_test < migrations/20250101_init_schema.sql

# Run again - should show "... already exists" messages, not errors
psql -U claudyne_user -d claudyne_test < migrations/20250101_init_schema.sql
```
