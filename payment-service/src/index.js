const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require("path"); 

const app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../public")));
const PORT = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

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

app.post('/pay', auth, (req, res) => {
  res.json({
    success: true,
    tx: `tx-${Date.now()}`,
    amount: req.body.amount
  });
});

app.listen(PORT, () => console.log(`payment-service ${PORT}`));
