import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateReviews1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'productId', type: 'uuid', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'author_name', type: 'varchar', isNullable: false },
          { name: 'author_email', type: 'varchar', isNullable: false },
          { name: 'rating', type: 'int', isNullable: false },
          { name: 'title', type: 'text', isNullable: true },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'is_approved', type: 'boolean', default: false },
          { name: 'is_verified_purchase', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({ name: 'IDX_reviews_product', columnNames: ['productId'] }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reviews');
  }
}
