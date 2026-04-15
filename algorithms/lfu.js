/**
 * algorithms/lfu.js — LFU (Least Frequently Used) Page Replacement Algorithm
 *
 * HOW IT WORKS:
 *   Track how many times each page in memory has been accessed (its frequency).
 *   When a page fault occurs and all frames are full, evict the page that has
 *   been used the LEAST number of times overall.
 *
 *   - Every time a page is loaded into a frame      → its frequency starts at 1.
 *   - Every time an already-loaded page is accessed → its frequency increases by 1.
 *   - On eviction: find the page with the lowest frequency count and remove it.
 *
 * TIE-BREAKING:
 *   If two or more pages share the same (lowest) frequency, evict the one that
 *   arrived earliest in memory (FIFO order among ties). This is the standard
 *   tie-breaking rule used in OS textbooks and keeps the algorithm deterministic.
 *
 * ANALOGY:
 *   Imagine a librarian who tracks how often each book is borrowed. When the
 *   shelf is full and a new book arrives, the librarian removes whichever book
 *   has been borrowed the fewest times — it is clearly the least popular.
 *
 * WHY IT'S IMPORTANT:
 *   LFU rewards pages that are accessed repeatedly over the long term.
 *   Unlike LRU (which only looks at recency), LFU captures historical usage
 *   patterns, making it well-suited for workloads with stable "hot" pages.
 *
 * PROS:  Great hit rate for workloads with clear hot/cold page distinctions.
 * CONS:  Suffers from "cache pollution" — a page accessed many times long ago
 *        can block newer, more relevant pages from entering the cache (frequency
 *        bias problem). Often mitigated with frequency aging in real systems.
 *
 * TIME COMPLEXITY:  O(n) per reference  (n = number of frames)
 * SPACE COMPLEXITY: O(n) for frequency + order tracking
 *
 * @param {number[]} pages       - The reference string (sequence of page numbers).
 * @param {number}   frameCount  - Number of available physical memory frames.
 * @returns {{ steps: object[], totalFaults: number, totalHits: number }}
 */
function lfu(pages, frameCount) {
  // ─── State ────────────────────────────────────────────────────────────────
  const frames = new Array(frameCount).fill(null); // pages currently in memory
  const frequency = new Map(); // page → access count
  const loadOrder = new Map(); // page → index (position) when loaded, for tie-breaking

  let totalFaults = 0;
  let totalHits = 0;
  let loadCounter = 0; // monotonically increasing — tracks insertion order

  const steps = []; // one entry per reference, for the simulator UI

  // ─── Process each page reference ─────────────────────────────────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let fault = false;
    let replaced = null;
    let replaceIdx = -1;
    let hitIdx = -1;

    if (frames.includes(page)) {
      // ── HIT: page is already in memory ──────────────────────────────────
      totalHits++;
      frequency.set(page, frequency.get(page) + 1);
      hitIdx = frames.indexOf(page);
    } else {
      // ── MISS: page fault ─────────────────────────────────────────────────
      fault = true;
      totalFaults++;

      const emptyIdx = frames.indexOf(null);
      if (emptyIdx !== -1) {
        // There is a free frame — just load the page.
        replaceIdx = emptyIdx;
        frames[replaceIdx] = page;
      } else {
        // All frames are occupied — find the LFU victim.
        // Among pages with equal frequency, pick the one loaded earliest (lowest loadOrder).
        let victimPage = null;
        let minFreq = Infinity;
        let minOrder = Infinity;

        for (let fi = 0; fi < frames.length; fi++) {
          const f = frames[fi];
          const freq = frequency.get(f);
          const order = loadOrder.get(f);

          if (freq < minFreq || (freq === minFreq && order < minOrder)) {
            minFreq = freq;
            minOrder = order;
            victimPage = f;
          }
        }

        // Evict the victim.
        replaced = victimPage;
        replaceIdx = frames.indexOf(victimPage);
        frames[replaceIdx] = page;

        // Clean up tracking for the evicted page.
        frequency.delete(victimPage);
        loadOrder.delete(victimPage);
      }

      // Initialise tracking for the newly loaded page.
      frequency.set(page, 1);
      loadOrder.set(page, loadCounter++);
    }

    // ── Record this step for the simulator ──────────────────────────────────
    const lfuCounts = {};
    frames.forEach((f, fi) => {
      if (f !== null) lfuCounts[fi] = frequency.get(f) ?? 0;
    });

    const reason = fault
      ? replaced !== null
        ? `Page ${replaced} had the lowest frequency and was replaced by ${page}`
        : `Loaded into empty frame F${replaceIdx + 1}`
      : `Page ${page} hit in F${hitIdx + 1}; frequency increased to ${frequency.get(page)}`;

    steps.push({
      step: i + 1,
      page,
      frames: [...frames],
      fault,
      replaced,
      replaceIdx,
      hitIdx,
      lfuCounts,
      reason,
    });
  }

  // ─── Return summary ───────────────────────────────────────────────────────
  return {
    steps,
    totalFaults,
    totalHits,
  };
}

module.exports = lfu;
