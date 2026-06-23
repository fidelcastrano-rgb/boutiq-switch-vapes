/**
 * Self-tuning helper to guarantee that all required columns 
 * and supplemental tables exist in Cloudflare D1 / D1 SQLite dynamically.
 */
export async function ensureDbTuned(db: any) {
  if (!db || typeof db.prepare !== 'function') return;
  
  try {
    // 1. Create email_logs table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        customer_email TEXT,
        timestamp TEXT,
        subject TEXT,
        message TEXT,
        is_live INTEGER,
        response TEXT
      )
    `).run();
    console.log('Database verification: email_logs table is checked and active.');
  } catch (err) {
    console.warn('Could not ensure email_logs table creation:', err);
  }

  // 2. Add missing columns to orders table
  const columnsToAdd = [
    { name: 'shipping_method', type: 'TEXT' },
    { name: 'coupon_code', type: 'TEXT' },
    { name: 'discount_percentage', type: 'REAL' },
    { name: 'discount_amount', type: 'REAL' },
    { name: 'crypto_discount', type: 'REAL' },
    { name: 'customer_country', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      await db.prepare(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`).run();
      console.log(`Database self-tuning: added missing column "${col.name}" to orders table.`);
    } catch (err: any) {
      // Ignore if column already exists
      if (err.message && (err.message.includes('duplicate column name') || err.message.includes('already exists'))) {
        // Expected
      } else {
        console.warn(`Attempted adding column "${col.name}" to orders:`, err.message || err);
      }
    }
  }
}
