import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable1743247679015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE contacts (
            id SERIAL PRIMARY KEY,
            owner_user_id INT NOT NULL,
            contact_user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (contact_user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE contacts;
        `);
  }
}
