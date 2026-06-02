import { defineRelations } from 'drizzle-orm';
import * as categoryTables from '@/features/category/models/tables';
import * as itemTables from '@/features/item/models/tables';
import * as userTables from '@/features/user/models/tables';

// ================================================================
// Table Schemas --------------------------------------------------
// ================================================================

// Flatten all tables into a single namespace object.
// Keys here are what you'll see on `db.query.<key>`.
export const schema = {
  ...itemTables,
  ...categoryTables,
  ...userTables,
} as const;

// ================================================================
// Relationships --------------------------------------------------
// ================================================================

// Define all relations in one place, referencing the consolidated schema.
// `r` exposes every table from `schema` so you can wire cross-feature relations.
export const relations = defineRelations(schema, (r) => ({
  ItemsTable: {
    category: r.one.CategoriesTable({
      from: r.ItemsTable.categoryId,
      to: r.CategoriesTable.id,
    }),
    owner: r.one.UsersTable({
      from: r.ItemsTable.userId,
      to: r.UsersTable.id,
    }),
  },
  CategoriesTable: {
    items: r.many.ItemsTable(),
  },
  UsersTable: {
    items: r.many.ItemsTable(),
  },
}));

export type DbSchema = typeof schema;
export type DbRelations = typeof relations;
