import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    // Check if we need to run migrations
    await this.checkMigrationStatus();
  }

  private async checkMigrationStatus() {
    try {
      const pendingMigrations = await this.dataSource.showMigrations();

      if (pendingMigrations) {
        this.logger.warn('⚠️  Pending migrations detected!');
        this.logger.warn('📋 Run the following command to update your database:');
        this.logger.warn('   pnpm --filter backend migration:run');
        this.logger.warn('🔍 Or check migration status with:');
        this.logger.warn('   pnpm --filter backend migration:show');
      } else {
        this.logger.log('✅ Database schema is up to date');
      }
    } catch (error) {
      this.logger.error('❌ Failed to check migration status:', error);
      this.logger.warn('💡 This might be the first run. Consider running migrations:');
      this.logger.warn('   pnpm --filter backend migration:run');
    }
  }

  async runMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Running pending migrations...');
      const migrations = await this.dataSource.runMigrations();

      if (migrations.length === 0) {
        this.logger.log('✅ No pending migrations to run');
      } else {
        this.logger.log(`✅ Successfully ran ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          this.logger.log(`   - ${migration.name}`);
        });
      }
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async revertLastMigration(): Promise<void> {
    try {
      this.logger.log('🔄 Reverting last migration...');
      await this.dataSource.undoLastMigration();
      this.logger.log('✅ Successfully reverted last migration');
    } catch (error) {
      this.logger.error('❌ Migration revert failed:', error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
  }> {
    try {
      const executedMigrations = await this.dataSource.query(
        `SELECT * FROM typeorm_migrations ORDER BY timestamp DESC`
      );

      const allMigrations = this.dataSource.migrations.map((m) => m.name);
      const executedNames = executedMigrations.map((m: any) => m.name);
      const pendingNames = allMigrations.filter((name) => !executedNames.includes(name));

      return {
        executed: executedNames,
        pending: pendingNames,
      };
    } catch (error) {
      this.logger.error('Failed to get migration status:', error);
      return {
        executed: [],
        pending: [],
      };
    }
  }
}
