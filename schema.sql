-- Create orders table with Mastercard-restricted payment options
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items TEXT,
  total REAL,
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'Pending Payment',
  card_last4 TEXT,
  created_at TEXT
);

-- Administrative configurations block e.g. toggles for accepted payments
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Pre-populate admin settings with Mastercard payments active by default
INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('mastercard_payments_enabled', 'true');
