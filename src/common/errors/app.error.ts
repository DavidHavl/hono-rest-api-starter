import { uuidv7 } from 'uuidv7';
import { env } from '@/env';

/**
 * Base application error with standard HTTP error properties.
 */
export class AppError extends Error {
  public id: string;
  public status: number;
  public code: string;
  public title: string;
  public detail?: string;
  public source?: {
    pointer?: string;
    parameter?: string;
    header?: string;
  };
  public links?: {
    about?: string;
    type?: string;
  };
  public meta?: Record<string, unknown>;

  constructor(options: {
    status: number;
    code: string;
    title: string;
    detail?: string;
    source?:
      | {
          pointer?: string;
          parameter?: string;
          header?: string;
        }
      | undefined;
    meta?: Record<string, unknown> | undefined;
  }) {
    super(options.detail ?? options.title);
    this.id = uuidv7();
    this.status = options.status;
    this.code = options.code;
    this.title = options.title;
    if (options.detail) {
      this.detail = options.detail;
    }
    if (options.source) {
      this.source = options.source;
    }
    if (options.meta) {
      this.meta = options.meta;
    }
    const baseUrl = env.BASE_URL;
    const basePath = env.BASE_PATH;
    const apiVersion = env.API_MAJOR_VERSION;
    this.links = {
      about: `${baseUrl}${basePath}/${apiVersion}/docs/errors/${options.code}`,
      type: `${baseUrl}${basePath}/${apiVersion}/docs/errors`,
    };
  }
}
