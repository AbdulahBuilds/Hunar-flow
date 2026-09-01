require('dotenv').config();

const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname)));

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10
});
let jobsCol = null;
let dbConnecting = false;

function tryConnectDb() {
  if (dbConnecting) return;
  dbConnecting = true;
  client.connect()
    .then(function () {
      dbConnecting = false;
      jobsCol = client.db('hunar').collection('jobs');
      console.log('MongoDB connected (' + new Date().toISOString() + ')');
    })
    .catch(function (err) {
      dbConnecting = false;
      jobsCol = null;
      console.error('MongoDB connection failed (' + new Date().toISOString() + '):', err.message.slice(0, 180));
      setTimeout(tryConnectDb, 10000);
    });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: 'hunar', collection: 'jobs', connected: !!jobsCol });
});

app.get('/api/jobs', async (req, res) => {
  if (!jobsCol) return res.status(503).json({ error: 'Database is not connected yet.' });
  try {
    const docs = await jobsCol.find({}).toArray();
    docs.forEach(function (d) { delete d._id; });
    res.json({ jobs: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs', async (req, res) => {
  if (!jobsCol) return res.status(503).json({ error: 'Database is not connected yet.' });
  try {
    const arr = Array.isArray(req.body) ? req.body : (req.body && req.body.jobs) || [];
    await jobsCol.deleteMany({});
    if (arr.length) {
      await jobsCol.insertMany(arr.map(function (j) { return Object.assign({}, j, { updatedAt: new Date() }); }));
    }
    res.json({ ok: true, count: arr.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, function () {
  console.log('HUNAR running on http://localhost:' + PORT);
});
tryConnectDb();