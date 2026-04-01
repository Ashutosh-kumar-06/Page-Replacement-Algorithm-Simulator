/**
 * comparison.js — Algorithm comparison feature
 * Uses App.selectedAlgo (via window.App), API (utils.js),
 * parsePages / showToast / animateCounter (utils.js).
 */

const ALGO_META = [
  {
    key: "fifo",
    name: "FIFO",
    icon: "📦",
    color: "var(--cyan)",
    barColor: "#00c8ff",
  },
  {
    key: "lru",
    name: "LRU",
    icon: "🔁",
    color: "var(--purple)",
    barColor: "#a855f7",
  },
  {
    key: "optimal",
    name: "Optimal",
    icon: "🎯",
    color: "var(--green)",
    barColor: "#00ff88",
  },
  {
    key: "clock",
    name: "Clock",
    icon: "🕐",
    color: "var(--yellow)",
    barColor: "#ffcc00",
  },
  {
    key: "lfu",
    name: "LFU",
    icon: "🔄",
    color: "var(--red)",
    barColor: "#ff3366",
  },
];

async function runComparison() {
  const pages = parsePages();
  const frames = parseInt(document.getElementById("frameSlider").value);
  if (pages.length < 2) {
    showToast("⚠ Please enter at least 2 page numbers");
    return;
  }

  showToast("📊 Comparing all algorithms...");
  const emptyState = document.getElementById("compareEmptyState");
  if (emptyState) emptyState.style.display = "none";

  try {
    const res = await fetch(`${API}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, frames }),
    });
    renderComparison(await res.json(), pages.length);
  } catch (e) {
    showToast("❌ Server error. Is the Node.js server running?");
    console.error(e);
  }
}

function renderComparison(data, total) {
  const grid = document.getElementById("compareGrid");
  grid.innerHTML = "";
  const maxFaults = Math.max(
    ...ALGO_META.map((a) => data.results[a.key].faults),
  );

  ALGO_META.forEach((a, i) => {
    const r = data.results[a.key];
    const isWinner = a.key === data.winner;
    const card = document.createElement("div");
    card.className = `compare-card fade-el${isWinner ? " winner" : ""}`;
    card.style.transitionDelay = `${i * 0.1}s`;
    card.innerHTML = `
      ${isWinner ? '<div class="winner-badge">🏆 BEST ALGORITHM</div>' : '<div style="height:28px"></div>'}
      <div class="card-algo-name" style="color:${a.color}">${a.icon} ${a.name}</div>
      <div class="card-faults-big" style="color:${a.color}" id="ctr-${a.key}">0</div>
      <div class="card-fault-label">Page Faults</div>
      <div class="card-bar"><div class="card-bar-fill" id="bar-${a.key}" style="background:${a.barColor}"></div></div>
      <div class="card-stats">
        <div class="mini-stat"><span class="val" style="color:var(--green)">${r.hits}</span><span class="lbl">Hits</span></div>
        <div class="mini-stat"><span class="val" style="color:var(--cyan)">${r.efficiency}%</span><span class="lbl">Hit Rate</span></div>
        <div class="mini-stat"><span class="val" style="color:var(--text)">${total}</span><span class="lbl">Total</span></div>
      </div>`;
    grid.appendChild(card);
    setTimeout(
      () => {
        card.classList.add("show");
        animateCounter(`ctr-${a.key}`, r.faults, 50);
        setTimeout(() => {
          const bar = document.getElementById(`bar-${a.key}`);
          bar.style.width = `${(r.faults / maxFaults) * 100}%`;
          bar.textContent = r.faults;
        }, 300);
      },
      100 + i * 150,
    );
  });

  renderBarChart(data, maxFaults);
  showToast(
    `🏆 Winner: ${data.winner.toUpperCase()} with ${data.results[data.winner].faults} faults!`,
  );
}

function renderBarChart(data, maxFaults) {
  const bc = document.getElementById("barChart");
  bc.style.display = "block";
  const chartBars = document.getElementById("chartBars");
  chartBars.innerHTML = "";
  ALGO_META.forEach((a, i) => {
    const r = data.results[a.key];
    const row = document.createElement("div");
    row.className = "chart-bar-row";
    row.innerHTML = `
      <div class="chart-bar-name">${a.name}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" id="cb-${a.key}" style="background:${a.barColor};width:0"></div>
      </div>`;
    chartBars.appendChild(row);
    setTimeout(
      () => {
        const fill = document.getElementById(`cb-${a.key}`);
        fill.style.width = `${(r.faults / maxFaults) * 100}%`;
        fill.textContent = `${r.faults} faults`;
      },
      400 + i * 150,
    );
  });
}
