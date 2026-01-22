import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCallsTable1768975172759 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE calls (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                caller_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                call_type VARCHAR(10) DEFAULT 'video' CHECK (call_type IN ('video', 'audio')),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ended', 'missed')),
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answered_at TIMESTAMP,
                ended_at TIMESTAMP,
                duration INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT different_users CHECK (caller_id != receiver_id),
                CONSTRAINT fk_calls_caller FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_calls_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

    // Создаем индексы отдельными запросами
    await queryRunner.query(
      `CREATE INDEX idx_calls_caller_id ON calls(caller_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_calls_receiver_id ON calls(receiver_id);`,
    );
    await queryRunner.query(`CREATE INDEX idx_calls_status ON calls(status);`);
    await queryRunner.query(
      `CREATE INDEX idx_calls_started_at ON calls(started_at);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // В обратном порядке: сначала удаляем индексы, потом таблицу
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_started_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_receiver_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calls_caller_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS calls;`);
  }
}
