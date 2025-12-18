const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Serve static UI (register + login page)
app.use(express.static(path.join(__dirname, "../public")));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'change-me-too';

// Postgres connection
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

/* ----------------------------
      REGISTER ( WORKING )
   ---------------------------- */
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      email text UNIQUE,
      password text
    )
  `);

  try {
    await pool.query(
      'INSERT INTO users(email,password) VALUES($1,$2)',
      [email, password]
    );
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: 'exists' });
  }
});

/* ----------------------------
          LOGIN
   ---------------------------- */
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const r = await pool.query(
    'SELECT * FROM users WHERE email=$1 AND password=$2',
    [email, password]
  );

  if (!r.rows.length)
    return res.status(401).json({ error: 'invalid' });

  const user = r.rows[0];

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

  res.json({ token, refresh });
});

/* ----------------------------
        REFRESH TOKEN
   ---------------------------- */
app.post('/auth/refresh', (req, res) => {
  try {
    const payload = jwt.verify(req.body.refresh, REFRESH_SECRET);
    const token = jwt.sign({ sub: payload.sub }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'invalid' });
  }
});

/* ----------------------------
          SIGNOUT
   ---------------------------- */
app.post('/auth/signout', (req, res) => res.json({ success: true }));

app.listen(PORT, () => console.log(`auth-service on ${PORT}`));
