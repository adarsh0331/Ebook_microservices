const express = require('express');
const bodyParser = require('body-parser');
const aws = require('aws-sdk');
const jwt = require('jsonwebtoken');
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
const PORT = process.env.PORT || 3002;

const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new aws.S3();
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

app.post('/upload', auth, (req, res) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: req.body.key,
    Expires: 300,
    ContentType: req.body.contentType
  };
  res.json({ uploadUrl: s3.getSignedUrl('putObject', params) });
});

app.get('/download/:key', auth, (req, res) => {
  const params = { Bucket: S3_BUCKET, Key: req.params.key, Expires: 300 };
  res.json({ downloadUrl: s3.getSignedUrl('getObject', params) });
});

app.listen(PORT, () => console.log(`ebooks-service ${PORT}`));
