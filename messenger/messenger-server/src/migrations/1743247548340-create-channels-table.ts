import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChannelsTable1743247548340 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE channels (
            id SERIAL PRIMARY KEY,
            name VARCHAR(45) NOT NULL,
            tag VARCHAR(45)
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE channels;
        `);
  }
}
