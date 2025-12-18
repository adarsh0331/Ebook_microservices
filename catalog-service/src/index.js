const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).end();
  try {
    req.user = jwt.verify(h.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).end();
  }
}

app.get('/v1/catalog', async (req, res) => {
  await pool.query(`CREATE TABLE IF NOT EXISTS ebooks(id serial primary key,title text,author text,price numeric,sku text)`);
  const r = await pool.query('SELECT * FROM ebooks');
  res.json(r.rows);
});

app.post('/v1/catalog', auth, async (req, res) => {
  const { title, author, price, sku } = req.body;
  await pool.query(
    'INSERT INTO ebooks(title,author,price,sku) VALUES($1,$2,$3,$4)',
    [title, author, price, sku]
  );
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`catalog-service ${PORT}`));
