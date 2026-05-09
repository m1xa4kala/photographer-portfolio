import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778341825123 implements MigrationInterface {
    name = 'InitialSchema1778341825123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "clientName" character varying NOT NULL, "text" text NOT NULL, "rating" integer NOT NULL DEFAULT '5', "isActive" boolean NOT NULL DEFAULT true, "date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "price_items" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "price" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_56a8fdc66fe1056f3db3a2d871d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_photos" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "imageUrl" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', "categoryId" integer NOT NULL, CONSTRAINT "PK_a9d66b1e570ff11cebfe322d924" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_e63477b3409a7fa6f620f98ff38" UNIQUE ("name"), CONSTRAINT "UQ_c32592287205edc6ad0188ee84b" UNIQUE ("slug"), CONSTRAINT "PK_e1ebad1076e043277bea080a1cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "about" ("id" SERIAL NOT NULL, "photoUrl" character varying, "fullName" character varying NOT NULL, "bioText" text NOT NULL, "equipmentText" text, "experience" character varying, "email" character varying, "phone" character varying, "socialLinks" json, CONSTRAINT "PK_e7b581a8a74d0a2ea3aa53226ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "best_photos" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "imageUrl" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_bf987d13d6846cce3a79c969795" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "portfolio_photos" ADD CONSTRAINT "FK_0f5a9cb0d2912507084a3b3c33c" FOREIGN KEY ("categoryId") REFERENCES "portfolio_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_photos" DROP CONSTRAINT "FK_0f5a9cb0d2912507084a3b3c33c"`);
        await queryRunner.query(`DROP TABLE "best_photos"`);
        await queryRunner.query(`DROP TABLE "about"`);
        await queryRunner.query(`DROP TABLE "portfolio_categories"`);
        await queryRunner.query(`DROP TABLE "portfolio_photos"`);
        await queryRunner.query(`DROP TABLE "price_items"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
