import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullSessionAndOriginalFiles1783887474305 implements MigrationInterface {
  name = 'AddFullSessionAndOriginalFiles1783887474305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "full_sessions" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "downloadToken" character varying, "downloadsEnabled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1bb0142399b8b1d46050376c777" UNIQUE ("downloadToken"), CONSTRAINT "PK_a51e7fdd876fdbfa03f4386cdb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1bb0142399b8b1d46050376c77" ON "full_sessions" ("downloadToken") `,
    );
    await queryRunner.query(
      `CREATE TABLE "session_original_files" ("id" SERIAL NOT NULL, "fullSessionId" integer NOT NULL, "originalName" character varying NOT NULL, "s3Key" character varying NOT NULL, "fileSize" bigint NOT NULL DEFAULT '0', "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1db1b54e0884b8f761d900b1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54d2bfdde93503bdc3e46932f8" ON "session_original_files" ("fullSessionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "session_original_files" ADD CONSTRAINT "FK_54d2bfdde93503bdc3e46932f8a" FOREIGN KEY ("fullSessionId") REFERENCES "full_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_original_files" DROP CONSTRAINT "FK_54d2bfdde93503bdc3e46932f8a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54d2bfdde93503bdc3e46932f8"`,
    );
    await queryRunner.query(`DROP TABLE "session_original_files"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1bb0142399b8b1d46050376c77"`,
    );
    await queryRunner.query(`DROP TABLE "full_sessions"`);
  }
}
