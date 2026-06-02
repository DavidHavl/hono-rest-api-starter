import { Temporal } from '@js-temporal/polyfill';
import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { generateUuid } from '@/common/utils/id';
import { temporalInstant } from '@/db/data-types';

export const CategoriesTable = pgTable('categories', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  name: varchar().notNull(),
  createdAt: temporalInstant().notNull().default(sql`now()`),
  updatedAt: temporalInstant()
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => Temporal.Now.instant()),
});
