const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const path = require("path"); 

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
const PORT = process.env.PORT || 3003;
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
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

app.get('/cart', auth, async (req, res) => {
  const key = `cart:${req.user.sub}`;
  const data = await redis.get(key);
  res.json({ items: data ? JSON.parse(data) : [] });
});

app.post('/cart/add', auth, async (req, res) => {
  const key = `cart:${req.user.sub}`;
  const cart = JSON.parse(await redis.get(key) || "[]");
  cart.push(req.body.item);
  await redis.set(key, JSON.stringify(cart));
  res.json({ items: cart });
});

app.post('/cart/remove', auth, async (req, res) => {
  const key = `cart:${req.user.sub}`;
  const cart = JSON.parse(await redis.get(key) || "[]");
  cart.splice(req.body.index, 1);
  await redis.set(key, JSON.stringify(cart));
  res.json({ items: cart });
});

app.listen(PORT, () => console.log(`cart-service ${PORT}`));
