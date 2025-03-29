import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1743247928701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            sender_id INT NOT NULL,
            receiver_channel_id INT,
            receiver_user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            text VARCHAR(255),
            file_name character varying(255) NULL,
            file_content text NULL,
            file_url character varying(255) NULL,
            file_type character varying(255) NULL,
            file_size integer NULL,
            FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (receiver_channel_id) REFERENCES channels (id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_user_id) REFERENCES users (id) ON DELETE CASCADE
        ); 
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_sender_id ON messages (sender_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_receiver_user_id ON messages (receiver_user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_created_at ON messages (created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_file_name ON messages (file_name);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_file_url ON messages (file_url);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_file_type ON messages (file_type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX idx_message_sender_id;
          `);

    await queryRunner.query(`
            DROP INDEX idx_message_receiver_user_id;
          `);

    await queryRunner.query(`
            DROP INDEX idx_message_created_at;
          `);

    await queryRunner.query(`
            DROP INDEX idx_message_file_name;
          `);

    await queryRunner.query(`
            DROP INDEX idx_message_file_url;
          `);

    await queryRunner.query(`
            DROP INDEX idx_message_file_type;
          `);

    await queryRunner.query(`
              DROP TABLE messages;    
          `);
  }
}
