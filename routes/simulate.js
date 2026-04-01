/**
 * routes/simulate.js — POST /api/simulate
 *
 * PURPOSE:
 *   Receives a page reference string, a frame count, and an algorithm name
 *   from the browser. Runs the chosen algorithm and returns the full
 *   step-by-step simulation result as JSON.
 *
 * REQUEST BODY (JSON):
 *   {
 *     pages:     number[]   — e.g. [7, 0, 1, 2, 0, 3]
 *     frames:    number     — e.g. 3  (must be 1–8)
 *     algorithm: string     — "fifo" | "lru" | "optimal" | "clock" | "lfu"
 *   }
 *
 * RESPONSE (JSON):
 *   {
 *     algorithm: string,
 *     frameCount: number,
 *     pages: number[],
 *     steps: Step[],      — one object per page reference
 *     faults: number,
 *     hits: number
 *   }
 */

// Import each algorithm as a standalone function.
const fifo    = require('../algorithms/fifo');
const lru     = require('../algorithms/lru');
const optimal = require('../algorithms/optimal');
const clock   = require('../algorithms/clock');
const lfu     = require('../algorithms/lfu');  // ── NEW: LFU algorithm

// Map algorithm name strings → actual functions.
// To add a new algorithm: just add one line here.
const ALGORITHMS = { fifo, lru, optimal, clock, lfu };

/**
 * Express route handler — called when a POST request hits /api/simulate.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function simulateRoute(req, res) {
  const { pages, frames, algorithm } = req.body;

  // ── Validate input ──
  // pages must be an array, frames must be a sensible number.
  if (!Array.isArray(pages) || !frames || frames < 1 || frames > 8) {
    return res.status(400).json({ error: 'Invalid input: pages must be an array, frames 1–8' });
  }

  // Cap sequence length so the UI doesn't get overwhelmed.
  if (pages.length < 1 || pages.length > 30) {
    return res.status(400).json({ error: 'Page sequence must be 1–30 pages' });
  }

  // Look up the requested algorithm by name.
  const run = ALGORITHMS[algorithm];
  if (!run) {
    return res.status(400).json({ error: `Unknown algorithm: ${algorithm}` });
  }

  // Run the algorithm — returns { steps, totalFaults, totalHits }.
  const result = run(pages, frames);

  // Normalise field names — lfu returns totalFaults/totalHits,
  // older algorithms return faults/hits. Support both shapes.
  const faults = result.totalFaults ?? result.faults;
  const hits   = result.totalHits   ?? result.hits;

  // Send the full result back to the browser.
  res.json({ algorithm, frameCount: frames, pages, steps: result.steps, faults, hits });
}

module.exports = simulateRoute;
