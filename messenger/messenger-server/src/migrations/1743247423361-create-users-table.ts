import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1743247423361 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE users (
              id SERIAL PRIMARY KEY,
              role VARCHAR(45), 
              status VARCHAR(45), 
              name VARCHAR(45) NOT NULL,
              email VARCHAR(100) UNIQUE NOT NULL,
              password VARCHAR(64) NOT NULL
            );
          `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX idx_user_email ON users (email);
      `);

    await queryRunner.query(`
        CREATE INDEX idx_user_status ON users (status);
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX idx_user_email;
          `);

    await queryRunner.query(`
            DROP INDEX idx_user_status;
          `);

    await queryRunner.query(`
            DROP TABLE users;
          `);
  }
}
