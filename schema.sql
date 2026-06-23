CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items TEXT,
  total REAL,
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  created_at TEXT
);
