// alter.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS nick TEXT NOT NULL DEFAULT '익명';
    `);
    console.log("✅ 'nick' 컬럼 추가 완료!");
  } catch (err) {
    console.error("❌ 에러 발생:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
