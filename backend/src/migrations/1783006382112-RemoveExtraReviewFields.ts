import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveExtraReviewFields1783006382112 implements MigrationInterface {
    name = 'RemoveExtraReviewFields1783006382112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "date"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ADD "date" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "rating" integer NOT NULL DEFAULT '5'`);
    }
}