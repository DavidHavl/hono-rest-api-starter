import { Temporal } from '@js-temporal/polyfill';
import { sql } from 'drizzle-orm';
import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { generateUuid } from '@/common/utils/id';
import { temporalInstant } from '@/db/data-types';
import { UsersTable } from '@/features/user/models/tables';

export const ItemsTable = pgTable(
  'items',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => generateUuid()),
    name: varchar().notNull(),
    description: text().notNull(),
    categoryId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    completedAt: temporalInstant(),
    createdAt: temporalInstant().notNull().default(sql`now()`),
    updatedAt: temporalInstant()
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => Temporal.Now.instant()),
  },
  (table) => [
    // // Use foreignKey for a finer control or when self-referencing
    // foreignKey({ name: 'fk_items_user_id', columns: [table.userId], foreignColumns: [UsersTable.id] }).onDelete(
    //   'cascade',
    // ),
    index('idx_items_category_id').on(table.categoryId),
    index('idx_items_user_id').on(table.userId),
  ],
);
