window.App = {
  simData: null, // full result from /api/simulate
  currentStep: -1, // step index currently displayed (-1 = none)
  selectedAlgo: "fifo", // 'fifo' | 'lru' | 'optimal'
  tableVisible: true, // whether the step-trace table is shown
  isPlaying: false, // true while auto-play is running
  playInterval: null, // setInterval ID for auto-play
  playSpeed: 1000, // ms between auto-play steps
};

const API = "";

/* ── Toast notification ─────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

/* ── Animated counter ───────────────────────────────────────────── */
function animateCounter(id, target, delay = 30) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 20));
  const iv = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(iv);
  }, delay);
}

/* ── Scroll-reveal observer ─────────────────────────────────────── */
function initScrollObserver() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("show");
      });
    },
    { threshold: 0.15 },
  );
  document
    .querySelectorAll(".fade-el, .algo-card, .compare-card")
    .forEach((el) => obs.observe(el));
}

/* ── Smooth scroll to section ───────────────────────────────────── */
function scrollToSection(selector) {
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
}

/* ── Parse page-input field into number array ───────────────────── */
function parsePages() {
  return document
    .getElementById("pageInput")
    .value.trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0);
}

/* ── Sync frame-count label with slider ─────────────────────────── */
function updateFrameVal() {
  document.getElementById("frameVal").textContent =
    document.getElementById("frameSlider").value;
}
