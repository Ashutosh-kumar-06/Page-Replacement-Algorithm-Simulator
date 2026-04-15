/**
 * boot.js — Cinematic boot sequence
 * Calls initScrollObserver() and startTour() (utils.js / tour.js)
 * after reveal — both are guaranteed loaded before this file runs.
 */
(function Boot() {
  document.body?.classList.add("preboot");

  const screen = document.getElementById("boot-screen");
  if (!screen) return;

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  if (prefersReducedMotion) document.body?.classList.add("reduced-motion");

  const subtitle = document.getElementById("boot-subtitle");
  const terminal = document.getElementById("boot-terminal");
  const barFill = document.getElementById("boot-bar-fill");
  const barPct = document.getElementById("boot-bar-pct");
  const subtitleMessages = [
    "Initializing memory engine...",
    "Loading algorithms...",
    "Preparing simulation frames...",
    "Optimizing performance...",
  ];

  const logLines = [
    { text: "> Booting Page Replacement Engine...", delay: 0 },
    { text: "> Loading FIFO module...", delay: 540 },
    { text: "> Loading LRU module...", delay: 980 },
    { text: "> Loading Optimal module...", delay: 1320 },
    { text: "> Loading Clock and LFU modules...", delay: 1640 },
    { text: "> Ready.", delay: 1980 },
  ];

  const reducedLogLines = [
    { text: "> Initializing simulator...", delay: 0 },
    { text: "> Ready.", delay: 120 },
  ];

  const timing = prefersReducedMotion
    ? {
        initialDelay: 0,
        progressDuration: 180,
        exitDuration: 160,
        postProgressDelay: 20,
      }
    : {
        initialDelay: 80,
        progressDuration: 950,
        exitDuration: 320,
        postProgressDelay: 50,
      };

  const activeLogLines = prefersReducedMotion ? reducedLogLines : logLines;
  let hasRevealed = false;
  let subtitleTimer = null;

  function cycleSubtitle() {
    let idx = 0;
    if (!subtitle) return;

    subtitle.textContent = subtitleMessages[idx];
    subtitle.style.opacity = "1";

    if (prefersReducedMotion) return;

    subtitleTimer = setInterval(() => {
      idx = (idx + 1) % subtitleMessages.length;
      subtitle.style.opacity = "0";
      setTimeout(() => {
        subtitle.textContent = subtitleMessages[idx];
        subtitle.style.opacity = "1";
      }, 140);
    }, 1000);
  }

  function typeLines() {
    if (!terminal) return;
    terminal.innerHTML = "";

    activeLogLines.forEach(({ text, delay }) => {
      setTimeout(() => {
        const line = document.createElement("div");
        line.className = "boot-line";
        line.textContent = text;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
      }, delay);
    });
  }

  function animateBar() {
    const startedAt = performance.now();

    function tick(now) {
      const elapsed = now - startedAt;
      const pct = Math.min(100, (elapsed / timing.progressDuration) * 100);
      const wholePct = Math.floor(pct);
      if (barFill) barFill.style.width = `${wholePct}%`;
      if (barPct) barPct.textContent = `${wholePct}%`;

      if (pct < 100) requestAnimationFrame(tick);
      else setTimeout(reveal, timing.postProgressDelay);
    }

    requestAnimationFrame(tick);
  }

  function reveal() {
    if (hasRevealed) return;
    hasRevealed = true;

    screen.classList.add("boot-exit");
    if (subtitleTimer) clearInterval(subtitleTimer);

    setTimeout(() => {
      screen.style.display = "none";
      document.body.classList.remove("preboot");
      document.body.classList.add("site-ready");

      if (typeof initScrollObserver === "function") initScrollObserver();
      if (
        !localStorage.getItem("memos_tour_done") &&
        typeof startTour === "function"
      )
        startTour();
    }, timing.exitDuration);
  }

  function run() {
    setTimeout(() => {
      cycleSubtitle();
      typeLines();
      animateBar();
    }, timing.initialDelay);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", run);
  else run();
})();
