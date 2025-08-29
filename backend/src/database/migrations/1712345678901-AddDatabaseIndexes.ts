import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseIndexes1712345678901 implements MigrationInterface {
  name = 'AddDatabaseIndexes1712345678901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index on users.email for faster lookups
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
    
    // Add index on stores.email for faster lookups
    await queryRunner.query(`CREATE INDEX "IDX_stores_email" ON "stores" ("email") `);
    
    // Add index on ratings.userId for faster user rating lookups
    await queryRunner.query(`CREATE INDEX "IDX_ratings_userId" ON "ratings" ("userId") `);
    
    // Add composite index on ratings(storeId, rating) for store rating calculations
    await queryRunner.query(`CREATE INDEX "IDX_ratings_store_rating" ON "ratings" ("storeId", "rating") `);
    
    // Add index on stores.status for filtering active stores
    await queryRunner.query(`CREATE INDEX "IDX_stores_status" ON "stores" ("status") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_stores_status"`);
    await queryRunner.query(`DROP INDEX "IDX_ratings_store_rating"`);
    await queryRunner.query(`DROP INDEX "IDX_ratings_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_stores_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
  }
}
