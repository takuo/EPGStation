import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRuleName1699337464234 implements MigrationInterface {
    name = 'AddRuleName1699337464234';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `rule` ADD `ruleName` text NULL DEFAULT ''");
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `rule` DROP COLUMN `ruleName`");
    }
}