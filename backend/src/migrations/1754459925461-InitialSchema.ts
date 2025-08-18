import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1754459925461 implements MigrationInterface {
  name = 'InitialSchema1754459925461';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('admin'), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`
    );
    await queryRunner.query(
      `CREATE TABLE "games" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" varchar, "developer" varchar, "publisher" varchar, "releaseYear" integer, "genre" varchar, "coverUrl" varchar, "fileName" varchar NOT NULL, "filePath" varchar NOT NULL, "fileSize" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('uploaded'), "igdbId" integer, "rawgId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
