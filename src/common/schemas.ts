import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

export const temporalInstantSchema = z.custom<Temporal.Instant>((val) => val instanceof Temporal.Instant, {
  message: 'Expected a Temporal.Instant',
});

export const temporalZonedDateTimeSchema = z.custom<Temporal.ZonedDateTime>(
  (val) => val instanceof Temporal.ZonedDateTime,
  { message: 'Expected a Temporal.ZonedDateTime' },
);

export const temporalPlainDateSchema = z.custom<Temporal.PlainDate>((val) => val instanceof Temporal.PlainDate, {
  message: 'Expected a Temporal.PlainDate',
});

export const temporalPlainTimeSchema = z.custom<Temporal.PlainTime>((val) => val instanceof Temporal.PlainTime, {
  message: 'Expected a Temporal.PlainTime',
});

export const temporalPlainDateTimeSchema = z.custom<Temporal.PlainDateTime>(
  (val) => val instanceof Temporal.PlainDateTime,
  { message: 'Expected a Temporal.PlainDateTime' },
);
