/**
 * server.js — MemOS Express Application Entry Point
 *
 * This file is intentionally SHORT. Its only job is to:
 *   1. Create the Express app
 *   2. Register middleware (CORS, JSON body parsing, static files)
 *   3. Wire up routes to their handler modules
 *   4. Start listening on a port
 *
 * All business logic lives in:
 *   algorithms/  — page replacement algorithms
 *   routes/      — API request handlers
 *   public/      — browser-facing HTML / CSS / JS
 *
 * USAGE:
 *   npm start         → node server.js
 *   npm run dev       → nodemon server.js (auto-restart on changes)
 *   Then open:        http://localhost:3000
 */
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

// Import route handlers — each file handles one endpoint.
const simulateRoute = require('./routes/simulate');
const compareRoute  = require('./routes/compare');

const app  = express();
const PORT = process.env.PORT || 3000;  // use env var in production, 3000 locally

// ── Middleware ────────────────────────────────────────────────────
// cors()         — allows browsers on other origins to call our API
// express.json() — parses incoming JSON request bodies automatically
// express.static — serves everything in /public as plain files
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────────
// POST /api/simulate — run one algorithm, get step-by-step result
app.post('/api/simulate', simulateRoute);

// POST /api/compare  — run all algorithms, get side-by-side summary
app.post('/api/compare',  compareRoute);

// ── Catch-all for the SPA root ─────────────────────────────────────
// Any GET to "/" sends the main HTML file (already handled by static
// middleware, but this makes it explicit).
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 MemOS running at http://localhost:${PORT}\n`);
});
