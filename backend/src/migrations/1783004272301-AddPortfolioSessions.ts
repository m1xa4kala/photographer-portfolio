import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPortfolioSessions1783004272301 implements MigrationInterface {
    name = 'AddPortfolioSessions1783004272301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_photos" DROP CONSTRAINT "FK_0f5a9cb0d2912507084a3b3c33c"`);
        await queryRunner.query(`ALTER TABLE "portfolio_photos" RENAME COLUMN "categoryId" TO "sessionId"`);
        await queryRunner.query(`CREATE TABLE "portfolio_sessions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "coverImageUrl" character varying, "orderIndex" integer NOT NULL DEFAULT '0', "categoryId" integer NOT NULL, CONSTRAINT "PK_64a4619f6a33032fbaa56d6a7bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" ADD CONSTRAINT "FK_ca58793abe848a3e0d50fcf2b58" FOREIGN KEY ("categoryId") REFERENCES "portfolio_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_photos" ADD CONSTRAINT "FK_d2786efc8945fc64e8a7f0eaf00" FOREIGN KEY ("sessionId") REFERENCES "portfolio_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_photos" DROP CONSTRAINT "FK_d2786efc8945fc64e8a7f0eaf00"`);
        await queryRunner.query(`ALTER TABLE "portfolio_sessions" DROP CONSTRAINT "FK_ca58793abe848a3e0d50fcf2b58"`);
        await queryRunner.query(`DROP TABLE "portfolio_sessions"`);
        await queryRunner.query(`ALTER TABLE "portfolio_photos" RENAME COLUMN "sessionId" TO "categoryId"`);
        await queryRunner.query(`ALTER TABLE "portfolio_photos" ADD CONSTRAINT "FK_0f5a9cb0d2912507084a3b3c33c" FOREIGN KEY ("categoryId") REFERENCES "portfolio_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
