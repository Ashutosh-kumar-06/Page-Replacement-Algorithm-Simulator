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
  const subtitleMessages = prefersReducedMotion
    ? ["Initializing simulator..."]
    : [
        "Initializing simulator...",
        "Loading algorithms...",
        "Preparing simulation frames...",
      ];

  const logLines = prefersReducedMotion
    ? [
        { text: "> Booting memory management system...", delay: 0 },
        { text: "> Ready.", delay: 100 },
      ]
    : [
        { text: "> Booting memory management system...", delay: 0 },
        { text: "> Loading FIFO module...", delay: 220 },
        { text: "> Loading LRU module...", delay: 440 },
        { text: "> Loading Optimal module...", delay: 660 },
        { text: "> Initializing frames...", delay: 880 },
      ];

  const timing = prefersReducedMotion
    ? {
        initialDelay: 0,
        progressDuration: 180,
        exitDuration: 220,
        postProgressDelay: 20,
        overlapDelay: 0,
      }
    : {
        initialDelay: 60,
        progressDuration: 1450,
        exitDuration: 980,
        postProgressDelay: 80,
        overlapDelay: 0,
      };

  let hasRevealed = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function progressLabel(percent) {
    const blocks = 10;
    const filled = Math.round((percent / 100) * blocks);
    const bar = `${"█".repeat(filled)}${"░".repeat(blocks - filled)}`;
    return `[${bar}] ${percent}%`;
  }

  async function typeText(el, text, charDelay) {
    if (!el) return;
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      if (hasRevealed) return;
      el.textContent += text[i];
      await wait(charDelay);
    }
  }

  async function animateSubtitle() {
    if (!subtitle) return;
    subtitle.classList.add("is-typing");

    if (prefersReducedMotion) {
      subtitle.textContent = subtitleMessages[0];
      return;
    }

    let idx = 0;
    while (!hasRevealed) {
      await typeText(subtitle, subtitleMessages[idx], 26);
      await wait(220);
      idx = (idx + 1) % subtitleMessages.length;
    }
  }

  function typeLines() {
    if (!terminal) return;
    terminal.innerHTML = "";

    logLines.forEach(({ text, delay }) => {
      setTimeout(() => {
        if (hasRevealed) return;
        const line = document.createElement("div");
        line.className = "boot-line";
        terminal.appendChild(line);

        typeText(line, text, prefersReducedMotion ? 4 : 18);
      }, delay);
    });
  }

  function animateBar() {
    const startedAt = performance.now();
    const holdAt = prefersReducedMotion ? 100 : 78;
    const holdStart = prefersReducedMotion ? 0 : 650;
    const holdDuration = prefersReducedMotion ? 0 : 180;
    const endRampDuration = prefersReducedMotion
      ? timing.progressDuration
      : 420;

    function tick(now) {
      const elapsed = now - startedAt;
      let pct = 100;

      if (prefersReducedMotion) {
        pct = Math.min(100, (elapsed / timing.progressDuration) * 100);
      } else if (elapsed < holdStart) {
        pct = (elapsed / holdStart) * holdAt;
      } else if (elapsed < holdStart + holdDuration) {
        pct = holdAt;
      } else if (elapsed < holdStart + holdDuration + endRampDuration) {
        pct =
          holdAt +
          ((elapsed - holdStart - holdDuration) / endRampDuration) *
            (100 - holdAt);
      }

      pct = Math.min(100, pct);
      const wholePct = Math.floor(pct);
      if (barFill) barFill.style.width = `${wholePct}%`;
      if (barPct) barPct.textContent = progressLabel(wholePct);

      if (pct < 100) requestAnimationFrame(tick);
      else setTimeout(reveal, timing.postProgressDelay);
    }

    requestAnimationFrame(tick);
  }

  function reveal() {
    if (hasRevealed) return;
    hasRevealed = true;

    screen.classList.add("boot-exit");
    subtitle?.classList.remove("is-typing");

    // Reveal UI behind the boot curtain immediately as it starts sliding away.
    document.body.classList.remove("preboot");
    document.body.classList.add("site-ready");

    if (typeof initScrollObserver === "function") initScrollObserver();
    if (
      !localStorage.getItem("memos_tour_done") &&
      typeof startTour === "function"
    )
      startTour();

    setTimeout(() => {
      screen.style.display = "none";
    }, timing.exitDuration);
  }

  function run() {
    setTimeout(() => {
      animateSubtitle();
      typeLines();
      animateBar();
    }, timing.initialDelay);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", run);
  else run();
})();
