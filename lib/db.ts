import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

// Types for Cloudflare D1 bindings in production env
interface D1Database {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<any[]>;
}

interface D1PreparedStatement {
  bind: (...params: any[]) => D1PreparedStatement;
  all: <T = any>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean; results?: any[] }>;
}

let localDb: any = null;

// Helper to get local database and initialize with schema if it is brand new
function getLocalDb() {
  if (localDb) return localDb;
  
  const dbPath = join(process.cwd(), 'd1.db');
  const isNew = !existsSync(dbPath);
  
  localDb = new Database(dbPath);
  
  if (isNew) {
    try {
      const schemaPath = join(process.cwd(), 'schema.sql');
      if (existsSync(schemaPath)) {
        const schema = readFileSync(schemaPath, 'utf8');
        localDb.exec(schema);
        
        // Add abandoned_carts table to trace users who leave checkouts incomplete
        localDb.exec(`
          CREATE TABLE IF NOT EXISTS abandoned_carts (
            id TEXT PRIMARY KEY,
            customer_email TEXT NOT NULL,
            customer_name TEXT,
            cart_data TEXT NOT NULL,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            email_1h_sent INTEGER DEFAULT 0,
            email_24h_sent INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }
    } catch (err) {
      console.error('Error initializing SQLite local schema:', err);
    }
  } else {
    try {
      localDb.exec(`
        CREATE TABLE IF NOT EXISTS abandoned_carts (
          id TEXT PRIMARY KEY,
          customer_email TEXT NOT NULL,
          customer_name TEXT,
          cart_data TEXT NOT NULL,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          email_1h_sent INTEGER DEFAULT 0,
          email_24h_sent INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {
      // already exists or failed
    }
  }
  
  return localDb;
}

/**
 * Execute a SQL query that retrieves zero or more rows.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const cloudflareD1 = (process.env as any).DB as D1Database | undefined;
  
  if (cloudflareD1) {
    const stmt = cloudflareD1.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results || [];
  } else {
    const db = getLocalDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE).
 */
export async function execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: any }> {
  const cloudflareD1 = (process.env as any).DB as D1Database | undefined;
  
  if (cloudflareD1) {
    const stmt = cloudflareD1.prepare(sql).bind(...params);
    const result = await stmt.run();
    return { changes: 1, lastInsertRowid: null };
  } else {
    const db = getLocalDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    };
  }
}
