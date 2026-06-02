import { Temporal } from '@js-temporal/polyfill';
import { customType } from 'drizzle-orm/pg-core';

/**
 * Represents a custom type for handling temporal instant data, integrating with
 * Temporal.Instant for date-time manipulation and a driver-specific string format.
 *
 * The `temporalInstant` variable provides methods for converting between the
 * database's `timestamptz` type and JavaScript's `Temporal.Instant` object. The
 * conversion ensures consistency in handling ISO 8601 formatted timestamps.
 */
export const temporalInstant = customType<{ data: Temporal.Instant; driverData: string }>({
  dataType() {
    return 'timestamptz';
  },
  toDriver(value: Temporal.Instant): string {
    return value.toString(); // ISO 8601 string, e.g. "2024-01-01T00:00:00Z"
  },
  fromDriver(value: string): Temporal.Instant {
    return Temporal.Instant.from(value);
  },
});
