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
  
  // Use /tmp for reliable writable storage in serverless/container environments
  const dbPath = join('/tmp', 'd1.db');
  
  localDb = new Database(dbPath);
  
  try {
    localDb.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        country TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping_cost REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        coupon_code TEXT,
        payment_method TEXT NOT NULL,
        order_total REAL NOT NULL,
        order_status TEXT DEFAULT 'Pending Payment',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_percent REAL NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO coupons (id, code, discount_percent, active) 
      VALUES ('welcome-10-id', 'WELCOME10', 10.0, TRUE);

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
    console.error('Error initializing SQLite local schema:', err);
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
