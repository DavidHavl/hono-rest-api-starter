import { Temporal } from '@js-temporal/polyfill';
import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { generateUuid } from '@/common/utils/id';
import { temporalInstant } from '@/db/data-types';
import { AUTH_ROLES } from '@/features/auth/constants';

export const roleEnum = pgEnum('role', AUTH_ROLES);

export const UsersTable = pgTable(
  'users',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => generateUuid()),
    email: varchar().notNull(),
    role: roleEnum().notNull().default('user'),
    createdAt: temporalInstant().notNull().default(sql`now()`),
    updatedAt: temporalInstant()
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => Temporal.Now.instant()),
  },
  (table) => [uniqueIndex('idx_users_email').on(table.email), index('idx_users_role').on(table.role)],
);
