import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeddingTables1793628444187 implements MigrationInterface {
  name = 'CreateWeddingTables1793628444187';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wedding_packages" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "duration" character varying(255) NOT NULL,
        "includes" text DEFAULT NULL,
        "imageUrl" character varying(500) DEFAULT NULL,
        "prices" json NOT NULL DEFAULT '[]',
        "orderIndex" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_wedding_packages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wedding_faq_items" (
        "id" SERIAL NOT NULL,
        "question" character varying(500) NOT NULL,
        "answer" text NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_wedding_faq_items" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wedding_faq_items"`);
    await queryRunner.query(`DROP TABLE "wedding_packages"`);
  }
}