/**
 * simulator.js — Core simulation engine
 *
 * Reads/writes App.simData, App.currentStep, App.selectedAlgo,
 *              App.tableVisible  via window.App (defined in utils.js).
 * Calls startAutoPlay/stopAutoPlay from playback.js.
 */

/* ── Algorithm selector ──────────────────────────────────────────── */
function selectAlgo(algo) {
  App.selectedAlgo = algo;
  document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${algo}`)?.classList.add('active');
}

/* ── Run simulation ──────────────────────────────────────────────── */
async function runSimulation() {
  const pages  = parsePages();
  const frames = parseInt(document.getElementById('frameSlider').value);

  if (pages.length < 2)  { showToast('⚠ Please enter at least 2 page numbers'); return; }
  if (pages.length > 30) { showToast('⚠ Max 30 pages allowed'); return; }

  resetSim(false);
  showToast(`🚀 Running ${App.selectedAlgo.toUpperCase()} simulation...`);

  try {
    const res = await fetch(`${API}/api/simulate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pages, frames, algorithm: App.selectedAlgo }),
    });
    if (!res.ok) { const e = await res.json(); showToast(`❌ ${e.error}`); return; }

    App.simData     = await res.json();
    App.currentStep = -1;

    buildTimeline(App.simData.pages);
    buildFrameBoxes(frames);
    buildTable(App.simData, frames);

    document.getElementById('totalSteps').textContent     = App.simData.steps.length;
    document.getElementById('playbackCtrl').style.display = 'flex';
    document.getElementById('statusBar').style.display    = 'flex';
    document.getElementById('tablePanel').style.display   = 'block';

    startAutoPlay();
  } catch (e) {
    showToast('❌ Server error. Is the Node.js server running?');
    console.error(e);
  }
}

/* ── Build timeline strip ────────────────────────────────────────── */
function buildTimeline(pages) {
  const track = document.getElementById('timelineTrack');
  track.innerHTML = '';
  pages.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.id        = `tl-${i}`;
    el.innerHTML = `${p}<div class="step-dot"></div>`;
    track.appendChild(el);
  });
}

/* ── Build frame boxes ───────────────────────────────────────────── */
function buildFrameBoxes(count) {
  const row = document.getElementById('framesRow');
  row.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const box = document.createElement('div');
    box.className = 'frame-box frame-empty';
    box.id        = `frame-${i}`;
    box.innerHTML = `<div class="frame-num">F${i+1}</div><div class="frame-val">—</div>`;
    row.appendChild(box);
  }
}

/* ── Build step-trace table ──────────────────────────────────────── */
function buildTable(data, frameCount) {
  document.getElementById('tableFrameHeaders').innerHTML =
    Array.from({ length: frameCount }, (_, i) => `<th>F${i+1}</th>`).join('');

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  data.steps.forEach((step, idx) => {
    const tr = document.createElement('tr');
    tr.id = `row-${idx}`;
    const cells = step.frames.map((val, i) => {
      const isHit   = !step.fault && step.hitIdx === i;
      const isFault =  step.fault && step.replaceIdx === i;
      return `<td style="${isHit ? 'color:var(--green)' : isFault ? 'color:var(--red)' : ''}">${val ?? '—'}</td>`;
    }).join('');
    tr.innerHTML = `
      <td style="color:var(--text-muted)">${step.step}</td>
      <td class="cell-page">${step.page}</td>
      ${cells}
      <td class="${step.fault ? 'cell-fault' : 'cell-hit'}">${step.fault ? '✗ FAULT' : '✓ HIT'}</td>
      <td style="color:var(--text-dim)">${step.replaced ?? '—'}</td>`;
    tbody.appendChild(tr);
  });
}

/* ── Show a single step ──────────────────────────────────────────── */
function showStep(idx) {
  if (!App.simData || idx < 0 || idx >= App.simData.steps.length) return;
  App.currentStep = idx;
  const step = App.simData.steps[idx];

  // Step counter
  document.getElementById('stepNum').textContent = idx + 1;

  // Cumulative stats
  let faults = 0, hits = 0;
  for (let i = 0; i <= idx; i++) App.simData.steps[i].fault ? faults++ : hits++;
  document.getElementById('liveFaults').textContent = faults;
  document.getElementById('liveHits').textContent   = hits;
  document.getElementById('liveEff').textContent    = ((hits / (idx + 1)) * 100).toFixed(0) + '%';

  // Timeline — scroll inside strip, never the page
  const tlScroll = document.querySelector('.timeline-scroll');
  document.querySelectorAll('.timeline-item').forEach((el, i) => {
    el.classList.remove('current', 'hit', 'fault', 'done');
    if (i < idx)      el.classList.add('done', App.simData.steps[i].fault ? 'fault' : 'hit');
    else if (i === idx) {
      el.classList.add('current');
      if (tlScroll) tlScroll.scrollLeft = Math.max(0, el.offsetLeft - tlScroll.offsetWidth / 2 + el.offsetWidth / 2);
    }
  });

  // Memory frames
  for (let i = 0; i < App.simData.frameCount; i++) {
    const box = document.getElementById(`frame-${i}`);
    if (!box) continue;
    box.classList.remove('hit', 'fault', 'replaced', 'frame-empty');
    const val = step.frames[i];
    box.querySelector('.frame-val').textContent = val ?? '—';
    if      (val === null)                                  box.classList.add('frame-empty');
    else if (!step.fault && step.hitIdx === i)              box.classList.add('hit');
    else if  (step.fault && step.replaceIdx === i)          box.classList.add(step.replaced !== null ? 'replaced' : 'fault');
  }

  // Status bar
  const sb = document.getElementById('statusBar');
  if (step.fault) {
    const detail = step.replaced !== null
      ? `<div class="status-chip chip-info"><span class="chip-action">🔁</span> Replaced page ${step.replaced} → ${step.page}</div>`
      : `<div class="status-chip chip-info"><span class="chip-action">✚</span> Loaded page ${step.page} into empty frame</div>`;
    sb.innerHTML = `<div class="status-chip chip-fault"><span class="chip-action">💥</span> PAGE FAULT — Page ${step.page} not in memory</div>${detail}`;
  } else {
    sb.innerHTML = `<div class="status-chip chip-hit"><span class="chip-action">✅</span> PAGE HIT — Page ${step.page} found in Frame ${step.hitIdx + 1}</div>`;
  }

  // Reasoning panel
  renderReasoning(step);

  // Table — scroll inside container only
  document.querySelectorAll('tbody tr').forEach(r => r.classList.remove('row-active'));
  const row = document.getElementById(`row-${idx}`);
  if (row) {
    row.classList.add('row-active');
    const ts = document.querySelector('.table-scroll');
    if (ts) {
      const rowTop = row.offsetTop, rowH = row.offsetHeight, tsH = ts.offsetHeight;
      if (rowTop < ts.scrollTop || rowTop + rowH > ts.scrollTop + tsH)
        ts.scrollTop = rowTop - tsH / 2 + rowH / 2;
    }
  }
}

/* ── Reasoning panel (LRU / Optimal) ────────────────────────────── */
function renderReasoning(step) {
  const panel  = document.getElementById('reasonPanel');
  const main   = document.getElementById('reasonMain');
  const frames = document.getElementById('reasonFrames');
  if (!panel) return;

  const isLRU     = App.selectedAlgo === 'lru';
  const isOptimal = App.selectedAlgo === 'optimal';
  const isClock   = App.selectedAlgo === 'clock';
  if (!isLRU && !isOptimal && !isClock) { panel.style.display = 'none'; return; }

  panel.style.display = 'block';
  main.textContent    = step.reason || '';
  frames.innerHTML    = '';

  step.frames.forEach((f, fi) => {
  if (f === null) return;
  const chip      = document.createElement('div');
  const isEvicted = step.fault && step.replaceIdx === fi;
  chip.className  = `reason-frame-chip ${isEvicted ? 'evicted' : 'kept'}`;
  const evictTag  = isEvicted ? '<span style="opacity:.7">← evicted</span>' : '';
  
  if (isLRU && step.lruAges) {
    const age    = step.lruAges[fi];
    const ageStr = age === 0 ? 'just used' : `${age} step${age !== 1 ? 's' : ''} ago`;
    chip.innerHTML = `<span class="rfc-label">F${fi+1}&thinsp;P${f}</span><span class="rfc-val">${ageStr}</span>${evictTag}`;
  } else if (isOptimal && step.nextUseAt) {
    const nu    = step.nextUseAt[fi];
    const nuStr = (!nu || nu >= 1e9) ? 'never again' : `step ${nu + 1}`;
    chip.innerHTML = `<span class="rfc-label">F${fi+1}&thinsp;P${f}</span><span class="rfc-val">next@${nuStr}</span>${evictTag}`;
  } else if (isClock && step.referenceBits) {
    const bit    = step.referenceBits[fi];
    const bitStr = bit === 1 ? 'bit=1 🟢 safe' : 'bit=0 🔴 evictable';
    const isHand = step.handPosition === fi;
    chip.innerHTML = `<span class="rfc-label">F${fi+1}&thinsp;P${f}</span><span class="rfc-val">${bitStr}${isHand ? ' 👈 hand' : ''}</span>${evictTag}`;
  }
  if (chip.innerHTML) frames.appendChild(chip);
});
}

/* ── Reset ───────────────────────────────────────────────────────── */
function resetSim(clearData = true) {
  stopAutoPlay();
  if (clearData) App.simData = null;
  App.currentStep = -1;

  document.getElementById('stepNum').textContent    = '0';
  document.getElementById('totalSteps').textContent = '0';
  document.getElementById('liveFaults').textContent = '—';
  document.getElementById('liveHits').textContent   = '—';
  document.getElementById('liveEff').textContent    = '—';

  document.getElementById('framesRow').innerHTML = `
    <div class="welcome-state">
      <div class="welcome-icon">💾</div>
      <h3>Memory frames will appear here</h3>
      <p>Enter a page sequence and hit Run Simulation</p>
    </div>`;

  document.getElementById('statusBar').style.display    = 'none';
  document.getElementById('playbackCtrl').style.display = 'none';
  document.getElementById('tablePanel').style.display   = 'none';
  const rp = document.getElementById('reasonPanel');
  if (rp) rp.style.display = 'none';

  document.getElementById('timelineTrack').innerHTML =
    `<div class="timeline-item" style="color:var(--text-muted);font-size:12px;width:auto;padding:0 16px;">
       Configure &amp; run simulation to see the timeline
     </div>`;
}

/* ── Toggle table ─────────────────────────────────────────────────── */
function toggleTable() {
  App.tableVisible = !App.tableVisible;
  document.getElementById('tableBody').parentElement.parentElement.style.display =
    App.tableVisible ? 'block' : 'none';
}
