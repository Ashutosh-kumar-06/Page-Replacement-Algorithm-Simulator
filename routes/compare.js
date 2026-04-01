/**
 * routes/compare.js — POST /api/compare
 *
 * PURPOSE:
 *   Runs FIFO, LRU, Optimal, Clock, and LFU on the SAME input simultaneously
 *   and returns a side-by-side summary so the browser can display who wins.
 *
 * REQUEST BODY (JSON):
 *   {
 *     pages:  number[]  — page reference sequence
 *     frames: number    — number of memory frames
 *   }
 *
 * RESPONSE (JSON):
 *   {
 *     results: {
 *       fifo:    { faults, hits, efficiency },
 *       lru:     { faults, hits, efficiency },
 *       optimal: { faults, hits, efficiency },
 *       clock:   { faults, hits, efficiency },
 *       lfu:     { faults, hits, efficiency }   ── NEW
 *     },
 *     winner: string,   — key of the algorithm with fewest faults
 *     total:  number,   — total page references
 *     frames: number
 *   }
 */

const fifo    = require('../algorithms/fifo');
const lru     = require('../algorithms/lru');
const optimal = require('../algorithms/optimal');
const clock   = require('../algorithms/clock');
const lfu     = require('../algorithms/lfu');  // ── NEW: LFU algorithm

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function compareRoute(req, res) {
  const { pages, frames } = req.body;

  // Basic validation — both fields are required.
  if (!Array.isArray(pages) || !frames) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Run all algorithms on the same pages + frames.
  const runs = {
    fifo:    fifo(pages, frames),
    lru:     lru(pages, frames),
    optimal: optimal(pages, frames),
    clock:   clock(pages, frames),
    lfu:     lfu(pages, frames),   // ── NEW
  };

  // Build a compact summary for each algorithm.
  // Normalise field names — lfu returns totalFaults/totalHits,
  // older algorithms return faults/hits. Support both shapes.
  const results = {};
  for (const [key, r] of Object.entries(runs)) {
    const faults = r.totalFaults ?? r.faults;
    const hits   = r.totalHits   ?? r.hits;
    results[key] = {
      faults,
      hits,
      // efficiency = hit rate as a percentage string, e.g. "73.3"
      efficiency: ((hits / pages.length) * 100).toFixed(1),
    };
  }

  // Find the winner — the algorithm with the FEWEST page faults.
  // If there is a tie, the first one found wins.
  const minFaults = Math.min(...Object.values(results).map(r => r.faults));
  const winner    = Object.keys(results).find(k => results[k].faults === minFaults);

  res.json({ results, winner, total: pages.length, frames });
}

module.exports = compareRoute;
