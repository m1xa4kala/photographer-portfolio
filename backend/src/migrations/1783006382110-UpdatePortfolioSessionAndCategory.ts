import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePortfolioSessionAndCategory1783006382110 implements MigrationInterface {
    name = 'UpdatePortfolioSessionAndCategory1783006382110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" DROP COLUMN "coverImageUrl"`);
        await queryRunner.query(`ALTER TABLE "portfolio_categories" ADD "coverImageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_categories" DROP COLUMN "coverImageUrl"`);
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" ADD "coverImageUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" ADD "description" character varying`);
    }

}
