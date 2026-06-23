CREATE TABLE orders (
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

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent REAL NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Coupon
INSERT INTO coupons (id, code, discount_percent, active) 
VALUES ('welcome-10-id', 'WELCOME10', 10.0, TRUE);
