import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoiceMessageFields1745244800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем тип сообщения
    await queryRunner.query(`
      ALTER TABLE messages
      ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
    `);

    // Добавляем длительность для голосовых сообщений
    await queryRunner.query(`
      ALTER TABLE messages
      ADD COLUMN duration INTEGER NULL;
    `);

    // Добавляем индексы для новых полей
    await queryRunner.query(`
      CREATE INDEX idx_message_type ON messages (message_type);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_message_duration ON messages (duration);
    `);

    // Обновляем существующие записи с типом 'text' для сообщений с текстом
    await queryRunner.query(`
      UPDATE messages
      SET message_type = 'text'
      WHERE text IS NOT NULL AND text != '';
    `);

    // Обновляем существующие записи с типом 'file' для сообщений с файлами
    await queryRunner.query(`
      UPDATE messages
      SET message_type = 'file'
      WHERE file_url IS NOT NULL;
    `);

    // Обновляем существующие записи с типом 'voice' для аудио файлов
    await queryRunner.query(`
      UPDATE messages
      SET message_type = 'voice'
      WHERE file_type LIKE 'audio/%';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX idx_message_duration;
    `);

    await queryRunner.query(`
      DROP INDEX idx_message_type;
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      DROP COLUMN duration;
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      DROP COLUMN message_type;
    `);
  }
}
