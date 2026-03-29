/**
 * algorithms/clock.js — Clock (Second Chance) Page Replacement Algorithm
 *
 * HOW IT WORKS:
 *   Think of memory frames arranged in a CIRCLE like a clock face.
 *   A "clock hand" points to the next candidate for eviction.
 *   Every page in memory has a reference bit (0 or 1).
 *
 *   When a page is LOADED or ACCESSED → its reference bit is set to 1
 *   (meaning "I was recently used, give me a second chance").
 *
 *   When eviction is needed, the clock hand sweeps forward:
 *     → If the hand points to a page with bit = 1:
 *         Clear the bit to 0 ("second chance given") and move the hand.
 *     → If the hand points to a page with bit = 0:
 *         Evict THIS page — it had its chance and wasn't used again.
 *
 * ANALOGY:
 *   Like a security guard doing rounds. If he finds you at your desk
 *   (bit=1), he stamps your card and moves on. If he finds your desk
 *   empty on the next round (bit=0), he reassigns your seat.
 *
 * WHY IT'S IMPORTANT:
 *   Clock is the real-world approximation of LRU used by actual operating
 *   systems (Linux, Windows). True LRU is too expensive in hardware,
 *   so Clock gives a great hit rate at very low cost.
 *
 * PROS:  Better than FIFO; cheap to implement; used in real OS kernels.
 * CONS:  Slightly worse than true LRU in some cases; order depends on hand.
 *
 * @param {number[]} pages      - The sequence of page numbers the CPU requests
 * @param {number}   frameCount - How many memory frames are available
 * @returns {{ steps, faults, hits }} - Full step-by-step trace + summary
 */
function clock(pages, frameCount) {

  // ── Input Validation ──────────────────────────────────────────────
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('Pages must be a non-empty array');
  }
  if (frameCount < 1) {
    throw new Error('Frame count must be at least 1');
  }

  // frames[] — pages currently loaded in memory (null = empty slot).
  const frames = new Array(frameCount).fill(null);

  // referenceBits[] — one bit per frame slot.
  //   1 → page was recently used ("second chance" protected)
  //   0 → page has NOT been used since its last chance → eviction candidate
  const referenceBits = new Array(frameCount).fill(0);

  // hand — index of the frame the clock hand is currently pointing at.
  // Starts at 0 and moves clockwise (wraps around using modulo).
  let hand = 0;

  const steps = [];   // step-by-step snapshots for the frontend
  let faults  = 0;    // total page fault count

  for (let i = 0; i < pages.length; i++) {
    const page     = pages[i];
    const inMemory = frames.includes(page);

    if (!inMemory) {
      // ── PAGE FAULT ── The page is not in memory — must load it.
      faults++;
      let replaced   = null;
      let replaceIdx = -1;

      // Check if any frame is still empty (early fill phase).
      const emptyIdx = frames.indexOf(null);

      if (emptyIdx !== -1) {
        // There is a free slot — place the page here directly.
        // No eviction needed; just load and set its reference bit to 1.
        replaceIdx              = emptyIdx;
        frames[replaceIdx]      = page;
        referenceBits[replaceIdx] = 1;

        // Advance the hand past the newly filled slot.
        hand = (replaceIdx + 1) % frameCount;

      } else {
        // All frames full — run the clock hand to find a victim.
        // Keep sweeping until we find a frame with reference bit = 0.
        while (true) {
          if (referenceBits[hand] === 0) {
            // Found our victim — evict the page in this frame.
            replaced              = frames[hand];
            replaceIdx            = hand;
            frames[hand]          = page;       // load new page
            referenceBits[hand]   = 1;          // new page gets a fresh chance
            hand                  = (hand + 1) % frameCount; // advance hand
            break;

          } else {
            // This page has a second chance — clear its bit and move on.
            referenceBits[hand] = 0;
            hand                = (hand + 1) % frameCount;
          }
        }
      }

      // ── Build clockState for the UI reasoning panel ──
      // Shows each frame's current reference bit so users can see
      // exactly WHY the clock hand stopped where it did.
      const clockState = frames.map((f, fi) => ({
        frame:        fi,
        page:         f,
        referenceBit: referenceBits[fi],
        isHandHere:   fi === replaceIdx,   // highlight the eviction slot
      }));

      // Human-readable explanation of this eviction decision.
      const reason = replaced !== null
        ? `Clock hand found Page ${replaced} with bit=0 in F${replaceIdx + 1} → evicted`
        : `Loaded into empty frame F${replaceIdx + 1}`;

      steps.push({
        step:       i + 1,
        page,
        frames:     [...frames],          // snapshot AFTER loading
        fault:      true,
        replaced,
        replaceIdx,
        hitIdx:     -1,
        clockState,                       // extra data for the reasoning panel
        referenceBits: [...referenceBits],// bit array after this step
        handPosition: replaceIdx,         // where the hand landed
        reason,
      });

    } else {
      // ── PAGE HIT ── Page is already in memory.
      // On a hit, boost the reference bit of the found page to 1.
      // This is the "second chance" refresh — it protected from recent eviction.
      const hitFrame          = frames.indexOf(page);
      referenceBits[hitFrame] = 1;   // refresh: "I was used again!"

      // Build clockState to show updated bits after the hit.
      const clockState = frames.map((f, fi) => ({
        frame:        fi,
        page:         f,
        referenceBit: referenceBits[fi],
        isHandHere:   false,    // hand doesn't move on a hit
      }));

      steps.push({
        step:       i + 1,
        page,
        frames:     [...frames],          // unchanged
        fault:      false,
        replaced:   null,
        replaceIdx: -1,
        hitIdx:     hitFrame,
        clockState,
        referenceBits: [...referenceBits],
        handPosition: hand,               // hand stays where it was
        reason: `Page ${page} found in F${hitFrame + 1} → reference bit set to 1 (refreshed)`,
      });
    }
  }

  // Return full trace plus totals — same shape as fifo / lru / optimal.
  return {
    steps,
    faults,
    hits: pages.length - faults,
  };
}

// Export so routes/simulate.js and routes/compare.js can require() this.
module.exports = clock;