import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsSetTable1743247864309 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE settings_set (
            settings_set_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            theme VARCHAR(20),
            language VARCHAR(10),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE settings_set;    
        `);
  }
}
