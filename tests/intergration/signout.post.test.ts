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

describe('Auth signout POST endpoint', () => {
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
  it('should respond with 204 when calling POST /projects', async () => {
    const res = await app.request(
      '/auth/signout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          Cookie: `${cookieContent}`,
        },
      },
      MOCK_ENV,
    );
    console.info(res);
    expect(res).not.toBeNull();
    expect(res.status).toBe(204);
    // expect(mock).toHaveBeenCalledWith({ id: '1', text: 'Buy milk' });
  });
});
