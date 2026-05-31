import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | undefined;

function lazyDb(): DB {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}

// Proxy defers initialization until first use so builds without DATABASE_URL don't fail.
export const db: DB = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return Reflect.get(lazyDb(), prop, lazyDb());
  },
});
