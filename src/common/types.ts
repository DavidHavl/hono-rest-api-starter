import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { AppBindings } from '@/types';

// Router //

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;

// Request / Response //

export type NonBodyTarget = 'param' | 'query' | 'header' | 'cookie';

// Sparse Fieldsets //
export type SparseFieldsets = {
  [resourceType: string]: string[];
};

// Helper Types //
export type NonEmptyArray<T> = [T, ...T[]];
