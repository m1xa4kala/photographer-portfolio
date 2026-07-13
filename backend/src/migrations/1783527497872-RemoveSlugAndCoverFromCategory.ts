import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSlugAndCoverFromCategory1783527497872 implements MigrationInterface {
  name = 'RemoveSlugAndCoverFromCategory1783527497872';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" DROP CONSTRAINT "UQ_c32592287205edc6ad0188ee84b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" DROP COLUMN "slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" DROP COLUMN "coverImageUrl"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2786efc8945fc64e8a7f0eaf0" ON "portfolio_photos" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca58793abe848a3e0d50fcf2b5" ON "portfolio_sessions" ("categoryId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca58793abe848a3e0d50fcf2b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2786efc8945fc64e8a7f0eaf0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" ADD "coverImageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_categories" ADD CONSTRAINT "UQ_c32592287205edc6ad0188ee84b" UNIQUE ("slug")`,
    );
  }
}
