import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewClientPhotoUrl1783006382113 implements MigrationInterface {
  name = 'AddReviewClientPhotoUrl1783006382113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD "clientPhotoUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN "clientPhotoUrl"`,
    );
  }
}
