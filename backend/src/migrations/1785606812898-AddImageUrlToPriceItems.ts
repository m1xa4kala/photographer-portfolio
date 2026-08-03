import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToPriceItems1785606812898 implements MigrationInterface {
  name = 'AddImageUrlToPriceItems1785606812898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "price_items" ADD "imageUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "price_items" DROP COLUMN "imageUrl"`);
  }
}
