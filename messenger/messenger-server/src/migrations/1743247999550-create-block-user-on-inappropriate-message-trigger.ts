import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlockUserOnInapprociateMessageTrigger1743247999550
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION block_user_on_inappropriate_message()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM users WHERE id = NEW.sender_id
                ) THEN
                    RAISE EXCEPTION 'Sender ID % does not exist in table users.', NEW.sender_id;
                END IF;

        IF NEW.text ~* '(spam|abuse|violation)' THEN
            UPDATE users 
            SET status = 'blocked'
            WHERE id = NEW.sender_id;

            RAISE NOTICE 'User % has been blocked for inappropriate content.', NEW.sender_id;
            ELSE
            RAISE NOTICE 'No inappropriate content detected for user %.', NEW.sender_id;
        END IF;

        RETURN NEW; 
        END;
        $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
        CREATE TRIGGER trigger_block_user_on_inappropriate_message
        BEFORE INSERT ON messages
        FOR EACH ROW
        EXECUTE FUNCTION block_user_on_inappropriate_message();    
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER trigger_block_user_on_inappropriate_message ON messages;
          `);

    await queryRunner.query(`
            DROP FUNCTION block_user_on_inappropriate_message();
          `);
  }
}
