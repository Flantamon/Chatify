import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersTable1745144749288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN theme VARCHAR(10) NOT NULL DEFAULT 'system' CHECK (theme IN ('dark', 'light', 'system')),
            ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ru'))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN theme,
            DROP COLUMN language
        `);
  }
}
