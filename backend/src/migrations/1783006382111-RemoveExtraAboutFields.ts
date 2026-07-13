import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveExtraAboutFields1783006382111 implements MigrationInterface {
  name = 'RemoveExtraAboutFields1783006382111';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "about" DROP COLUMN "equipmentText"`);
    await queryRunner.query(`ALTER TABLE "about" DROP COLUMN "experience"`);
    await queryRunner.query(`ALTER TABLE "about" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "about" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "about" DROP COLUMN "socialLinks"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "about" ADD "socialLinks" json`);
    await queryRunner.query(
      `ALTER TABLE "about" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "about" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "about" ADD "experience" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "about" ADD "equipmentText" text`);
  }
}
