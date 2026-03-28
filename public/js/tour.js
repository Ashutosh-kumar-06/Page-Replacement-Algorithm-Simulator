

const TOUR_STEPS = [
  {
    target: null,
    title: "👋 Welcome to MemOS!",
    pos: "center",
    desc: "This simulator helps you visualize FIFO, LRU, and Optimal page replacement — core OS concepts. Let me show you around!",
  },
  {
    target: "#pageInput",
    title: "📝 Page Reference String",
    pos: "right",
    desc: "Enter page numbers separated by spaces, e.g. 7 0 1 2 0 3 0 4. This is the sequence the CPU requests from memory.",
  },
  {
    target: "#frameSlider",
    title: "🗂️ Number of Frames",
    pos: "right",
    desc: "Drag to set how many memory frames are available. Fewer frames = more page faults.",
  },
  {
    target: ".algo-buttons",
    title: "⚙️ Choose Algorithm",
    pos: "right",
    desc: "FIFO = oldest page out. LRU = least recently used replaced. Optimal = theoretical best.",
  },
  {
    target: "#runBtn",
    title: "▶ Run Simulation",
    pos: "right",
    desc: "Click to start! Frames animate step-by-step. Green = hit. Red = fault. Yellow = replacement.",
  },
  {
    target: "#framesRow",
    title: "🧱 Memory Frames",
    pos: "top",
    desc: "Live memory state. Green glow = hit, red shake = fault, yellow swap = replacement.",
  },
  {
    target: "#timelineTrack",
    title: "📍 Page Timeline",
    pos: "bottom",
    desc: "Your full sequence. Current step = cyan. Past = green (hit) or red (fault).",
  },
  {
    target: "#compareBtn",
    title: "📊 Compare Algorithms",
    pos: "right",
    desc: "Run all three algorithms at once and compare page fault counts side-by-side.",
  },
];

let tourStep = 0;
let _tourLastEl = null; 

function startTour() {
  tourStep = 0;
  document.getElementById("tour-overlay").style.display = "block";
  showTourStep(0);
}

function showTourStep(i) {
  const step = TOUR_STEPS[i];
  document.getElementById("tour-step-badge").textContent =
    `Step ${i + 1} of ${TOUR_STEPS.length}`;
  document.getElementById("tour-title").textContent = step.title;
  document.getElementById("tour-desc").textContent = step.desc;
  document.getElementById("tour-next").textContent =
    i === TOUR_STEPS.length - 1 ? "Finish 🎉" : "Next →";

  const card = document.getElementById("tour-card");
  card.className = "tour-card-anim";

  if (_tourLastEl) {
    _tourLastEl.style.zIndex = _tourLastEl._tourOrigZ || "";
    _tourLastEl = null;
  }

  if (!step.target) {
    document.getElementById("tour-spotlight").style.cssText = "display:none";
    card.style.cssText =
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:440px;width:90%;";
    return;
  }

  const el = document.querySelector(step.target);
  if (!el) {
    showTourStep(i + 1);
    return;
  }

  el._tourOrigZ = el.style.zIndex || "";
  el.style.zIndex = "8001";
  _tourLastEl = el;

  const rect = el.getBoundingClientRect(),
    pad = 14;

  document.getElementById("tour-spotlight").style.cssText =
    `display:block;position:fixed;` +
    `left:${rect.left - pad}px;top:${rect.top - pad}px;` +
    `width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;` +
    `border-radius:12px;` +
    `box-shadow:0 0 0 9999px rgba(0,0,0,.78),` +
    `0 0 0 2px rgba(0,200,255,.85),` +
    `0 0 28px rgba(0,200,255,.4);` +
    `transition:all .35s ease;`;

  const cw = 350,
    ch = 200;
  let top, left;
  if (step.pos === "right") {
    left = rect.right + pad + 10;
    top = rect.top + rect.height / 2 - ch / 2;
  } else if (step.pos === "top") {
    top = rect.top - ch - 18;
    left = rect.left + rect.width / 2 - cw / 2;
  } else {
    top = rect.bottom + 18;
    left = rect.left + rect.width / 2 - cw / 2;
  }
  left = Math.max(10, Math.min(left, window.innerWidth - cw - 10));
  top = Math.max(10, Math.min(top, window.innerHeight - ch - 10));
  card.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${cw}px;`;
}

function tourNext() {
  if (tourStep >= TOUR_STEPS.length - 1) {
    tourSkip();
    return;
  }
  tourStep++;
  const t = TOUR_STEPS[tourStep].target;

  if (t) {
    const el = document.querySelector(t);
    if (el) {
  
      el.scrollIntoView({ behavior: "instant", block: "center" });
    }
  }
  setTimeout(() => showTourStep(tourStep), 60);
}

function tourSkip() {
  // Clean up any elevated element before hiding
  if (_tourLastEl) {
    _tourLastEl.style.zIndex = _tourLastEl._tourOrigZ || "";
    _tourLastEl = null;
  }
  document.getElementById("tour-overlay").style.display = "none";
  localStorage.setItem("memos_tour_done", "1");
}
