// CommonJS 버전 (Render 호환)
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Helmet + CSP (인라인 스타일 허용)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", 'data:'],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', extensions: ['html'] }));

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// DB 초기화
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      nick TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
  `);
}
initDb().catch((e) => {
  console.error('DB init error:', e);
  process.exit(1);
});

// 레이트 리밋 (글쓰기 남용 방지)
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// 유틸
function sanitizeTrim(s) { return (s ?? '').toString().trim(); }
function validatePost({ title, nick, content }) {
  const t = sanitizeTrim(title);
  const n = sanitizeTrim(nick);
  const c = sanitizeTrim(content);
  if (!t || !n || !c) return '모든 항목은 필수입니다.';
  if (t.length > 80) return '제목은 최대 80자입니다.';
  if (n.length > 24) return '닉네임은 최대 24자입니다.';
  if (c.length > 5000) return '내용은 최대 5000자입니다.';
  return null;
}

// 목록 (cursor 기반 페이지네이션)
app.get('/api/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
  const cursor = parseInt(req.query.cursor || '0', 10);

  try {
    let query = 'SELECT id, title, nick, content, created_at FROM posts';
    const params = [];
    if (cursor > 0) {
      query += ' WHERE id < $1';
      params.push(cursor);
    }
    query += ' ORDER BY id DESC LIMIT $' + (params.length + 1);
    params.push(limit + 1);

    const { rows } = await pool.query(query, params);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({ items: data, nextCursor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '목록을 불러오지 못했습니다.' });
  }
});

// 작성
app.post('/api/posts', createLimiter, async (req, res) => {
  const { title, nick, content } = req.body || {};
  const err = validatePost({ title, nick, content });
  if (err) return res.status(400).json({ error: err });

  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    const { rows } = await pool.query(
      'INSERT INTO posts (title, nick, content, ip) VALUES ($1,$2,$3,$4) RETURNING id, title, nick, content, created_at',
      [title.trim(), nick.trim(), content.trim(), ip]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '글을 저장하지 못했습니다.' });
  }
});

// 헬스체크
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Shared board (PostgreSQL) running: http://localhost:${PORT}`);
});
