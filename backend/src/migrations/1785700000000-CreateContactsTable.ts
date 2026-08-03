import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable1785700000000 implements MigrationInterface {
  name = 'CreateContactsTable1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create contacts table
    await queryRunner.query(
      `CREATE TABLE "contacts" (
        "id" SERIAL NOT NULL,
        "type" character varying NOT NULL,
        "value" character varying NOT NULL,
        "platform" character varying,
        "iconName" character varying,
        "label" character varying,
        "orderIndex" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_contacts_id" PRIMARY KEY ("id")
      )`,
    );

    // Migrate existing social_links data into contacts
    await queryRunner.query(
      `INSERT INTO "contacts" ("type", "value", "platform", "iconName", "orderIndex")
       SELECT 'social', "url", "platform", "iconName", "orderIndex"
       FROM "social_links"`,
    );

    // Drop old social_links table
    await queryRunner.query(`DROP TABLE "social_links"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create social_links table
    await queryRunner.query(
      `CREATE TABLE "social_links" (
        "id" SERIAL NOT NULL,
        "platform" character varying NOT NULL,
        "url" character varying NOT NULL,
        "iconName" character varying NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_social_links_id" PRIMARY KEY ("id")
      )`,
    );

    // Restore data from contacts back to social_links
    await queryRunner.query(
      `INSERT INTO "social_links" ("platform", "url", "iconName", "orderIndex")
       SELECT COALESCE("platform", ''), "value", COALESCE("iconName", ''), "orderIndex"
       FROM "contacts"
       WHERE "type" = 'social'`,
    );

    // Drop contacts table
    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
