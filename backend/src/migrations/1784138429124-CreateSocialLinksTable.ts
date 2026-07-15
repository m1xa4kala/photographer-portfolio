import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialLinksTable1784138429124 implements MigrationInterface {
  name = 'CreateSocialLinksTable1784138429124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "social_links" ("id" SERIAL NOT NULL, "platform" character varying NOT NULL, "url" character varying NOT NULL, "iconName" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_50d32c67ddd71c09d372b02167f" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "social_links"`);
  }
}
