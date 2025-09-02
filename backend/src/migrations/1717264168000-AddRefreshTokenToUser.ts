import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenToUser1717264168000 implements MigrationInterface {
  name = 'AddRefreshTokenToUser1717264168000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token" character varying NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "users"."refresh_token" IS 'Hashed refresh token for JWT refresh functionality'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token"`);
  }
}
