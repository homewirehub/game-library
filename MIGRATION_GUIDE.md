# 🗄️ Database Migrations Guide

This guide explains how to manage database schema changes using TypeORM migrations in the Game Library backend.

## 📋 Overview

**Migrations** are version-controlled database schema changes that allow you to:
- ✅ Apply consistent database changes across environments
- ✅ Roll back problematic changes safely
- ✅ Track schema evolution over time
- ✅ Collaborate on database changes with your team

## 🚀 Quick Start

### 1. Initial Setup

If this is your first time setting up the database:

```bash
# Copy environment configuration
cp .env.example .env

# Edit .env with your database settings
# For development, SQLite is pre-configured

# Run initial migration
pnpm migration:run
```

### 2. Development Workflow

When working on new features that require database changes:

```bash
# 1. Modify your entity files (*.entity.ts)
# 2. Generate a migration
pnpm migration:generate src/migrations/DescriptiveFeatureName

# 3. Review the generated migration file
# 4. Run the migration
pnpm migration:run

# 5. Test your changes
pnpm dev
```

## 📚 Available Commands

### Migration Management

| Command | Description |
|---------|-------------|
| `pnpm migration:generate <name>` | Generate migration from entity changes |
| `pnpm migration:create <name>` | Create empty migration file |
| `pnpm migration:run` | Run all pending migrations |
| `pnpm migration:revert` | Revert the last migration |
| `pnpm migration:show` | Show migration status |
| `pnpm schema:drop` | ⚠️ Drop entire database schema |

### Examples

```bash
# Generate migration for new user profile feature
pnpm migration:generate src/migrations/AddUserProfile

# Create empty migration for custom changes
pnpm migration:create src/migrations/CustomIndexOptimization

# Check what migrations are pending
pnpm migration:show
```

## 🔧 Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```bash
# Database Type
DB_TYPE=sqlite  # or 'postgres' for production

# SQLite (Development)
DB_PATH=./gamelib.db
DB_SYNCHRONIZE=false  # Must be false when using migrations

# PostgreSQL (Production)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=gamelib_user
DB_PASSWORD=your_secure_password
DB_NAME=gamelib
```

### TypeORM DataSource

The migration system uses `src/config/data-source.ts` for configuration. This file:
- ✅ Loads environment variables
- ✅ Configures database connection
- ✅ Sets migration paths and settings
- ✅ Supports both SQLite and PostgreSQL

## 🏗️ Migration Best Practices

### 1. **Descriptive Names**
```bash
# ✅ Good
pnpm migration:generate src/migrations/AddGameMetadataFields
pnpm migration:generate src/migrations/CreateUserPreferencesTable

# ❌ Bad
pnpm migration:generate src/migrations/Update
pnpm migration:generate src/migrations/Fix
```

### 2. **Review Before Running**
Always review generated migrations before applying:
```typescript
// Check that the migration does what you expect
export class AddGameMetadata1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ Verify these changes are correct
        await queryRunner.query(`ALTER TABLE "games" ADD "metacritic_score" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_games_metacritic" ON "games" ("metacritic_score")`);
    }
    
    public async down(queryRunner: QueryRunner): Promise<void> {
        // ✅ Ensure down migration reverses the up migration
        await queryRunner.query(`DROP INDEX "IDX_games_metacritic"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "metacritic_score"`);
    }
}
```

### 3. **Test Rollbacks**
Test your down migrations in development:
```bash
# Apply migration
pnpm migration:run

# Test rollback
pnpm migration:revert

# Re-apply to confirm both directions work
pnpm migration:run
```

### 4. **Backup Before Production**
Always backup production databases before running migrations:
```bash
# PostgreSQL backup example
pg_dump gamelib_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Then run migrations
pnpm migration:run
```

## 🔒 Production Deployment

### 1. **Pre-Deployment Checklist**
- [ ] All migrations tested in staging environment
- [ ] Database backup completed
- [ ] Migration rollback plan prepared
- [ ] Team notified of deployment window

### 2. **Deployment Process**
```bash
# 1. Backup database
pg_dump your_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
pnpm migration:run

# 3. Verify application starts correctly
pnpm start

# 4. Run smoke tests
curl http://localhost:3001/health
```

### 3. **Rollback Procedure**
If issues occur:
```bash
# Option 1: Revert last migration
pnpm migration:revert

# Option 2: Restore from backup
psql your_db < backup_20240106_143000.sql
```

## 🐛 Troubleshooting

### Common Issues

#### "Migration table not found"
```bash
# First migration run, this is expected
pnpm migration:run
```

#### "Migration already exists"
```bash
# Check migration status
pnpm migration:show

# If duplicate, manually remove the duplicate file
```

#### "No changes in database schema found"
```bash
# Your entities haven't changed since last migration
# Or you might need to:
# 1. Check entity decorators are correct
# 2. Ensure entities are imported in data-source.ts
# 3. Restart TypeScript compiler
```

#### Database connection errors
```bash
# Check your .env configuration
# Verify database server is running
# Test connection manually
```

## 📁 File Structure

```
backend/src/
├── config/
│   ├── data-source.ts      # TypeORM CLI configuration
│   ├── migration.service.ts # Migration status service
│   └── env.schema.ts       # Environment validation
├── migrations/             # Generated migration files
│   └── 1234567890-InitialSchema.ts
├── entities/              # TypeORM entities
│   ├── game.entity.ts
│   └── user.entity.ts
└── modules/               # Application modules
```

## 🔗 Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [Database Design Best Practices](https://en.wikipedia.org/wiki/Database_normalization)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## ⚡ Quick Reference

```bash
# Daily development workflow
pnpm migration:generate src/migrations/YourFeatureName
pnpm migration:run
pnpm dev

# Check status
pnpm migration:show

# Emergency rollback
pnpm migration:revert
```

Remember: **Never use `synchronize: true` in production!** Always use migrations for schema changes.
