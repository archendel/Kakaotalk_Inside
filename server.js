// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL 연결 (Render 환경 변수 사용)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// DB 초기화 (테이블 없으면 생성)
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// 글 목록 가져오기
app.get("/posts", async (req, res) => {
  const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
  res.json(result.rows);
});

// 글 추가하기
app.post("/posts", async (req, res) => {
  const { title, nickname, content } = req.body;
  if (!title || !nickname || !content) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  const result = await pool.query(
    "INSERT INTO posts (title, nickname, content) VALUES ($1, $2, $3) RETURNING *",
    [title, nickname, content]
  );
  res.json(result.rows[0]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
