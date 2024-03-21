import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('name');
    table.string('email');
    table.string('password');
  });
  await knex.schema.createTable('customers', (table) => {
    table.string('id').primary();
    table.string('name');
    table.string('email');
    table.string('image_url');
  });
  await knex.schema.createTable('invoices', (table) => {
    table.string('id').primary();
    table.string('customer_id');
    table.integer('amount');
    table.string('status');
    table.timestamp('date');
  });
  await knex.schema.createTable('revenues', (table) => {
    table.string('month').primary();
    table.integer('revenue');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
  await knex.schema.dropTable('customers');
  await knex.schema.dropTable('invoices');
  await knex.schema.dropTable('revenues');
}
