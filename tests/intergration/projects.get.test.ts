import dotenv from 'dotenv';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../src';
import { createAuthCookieContent } from '../helpers/auth';
import { TestDatabase } from '../helpers/db';

// Load environment variables
dotenv.config({ path: '.test.vars' });

const kvStore = new Map();
const MOCK_ENV = {
  ...process.env,
  DB: null,
  KV: {
    get: (key) => kvStore.get(key),
    // list: () => {}
    put: (key, value) => kvStore.set(key, value),
    delete: (key) => kvStore.delete(key),
  },
};

describe('Projects GET endpoint', () => {
  let cookieContent = '';
  let db: TestDatabase = null;
  let entities = null;

  // Before all tests
  beforeAll(async () => {
    db = new TestDatabase();
    await db.setup();
    MOCK_ENV.DB = db.d1Instance;
  });
  // After all tests
  afterAll(async () => {
    await db.teardown();
  });

  // Before each test
  beforeEach(async () => {
    // Clear the database and populate with test data for each test
    await db.clear();
    entities = await db.seed();
    // Create a session for the user and return the cookie content
    cookieContent = await createAuthCookieContent(MOCK_ENV.KV, entities.users[0].id);
  });

  // Tests
  it('should respond with 200 when calling /projects', async () => {
    const queryParams = new URLSearchParams({ teamId: entities.teams[0].id });
    const res = await app.request(
      `/projects?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          Cookie: `${cookieContent}`,
        },
      },
      MOCK_ENV,
    );
    expect(res).not.toBeNull();
    expect(res.status).toBe(200);
  });

  it('should respond with 200 when calling /projects/id', async () => {
    const res = await app.request(
      `/projects/${entities.projects[0].id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          Cookie: `${cookieContent}`,
        },
      },
      MOCK_ENV,
    );

    expect(res).not.toBeNull();
    expect(res.status).toBe(200);
    // expect(mock).toHaveBeenCalledWith({ id: '1', text: 'Buy milk' });
  });
});
