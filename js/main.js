// Do grão à xícara: sequência de imagens guiada pelo scroll + transição final sticky.
(() => {
  "use strict";

  const FRAME_COUNT = 372;
  const INTRO_SPAN = 0.035; // fração inicial do scroll em que o título sai de cena
  const framePath = (i) => `assets/images/frame_${String(i + 1).padStart(4, "0")}.webp`;

  // Ponto de foco horizontal (0 a 1) ao longo do filme. Em telas verticais o
  // recorte segue o assunto: a panela, o fio de café, a xícara.
  const FOCUS = [
    [0, 0.5], [114, 0.5], [130, 0.46], [201, 0.46],
    [215, 0.48], [270, 0.48], [286, 0.4], [371, 0.4],
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const film = document.querySelector(".film");
  const canvas = film.querySelector(".film__canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const intro = film.querySelector(".film__intro");
  const rail = film.querySelector(".film__rail");
  const railLinks = [...rail.querySelectorAll("a")];
  const loadingEl = film.querySelector(".film__loading");
  const verses = [...film.querySelectorAll(".verse")].map((el) => ({
    el,
    from: Number(el.dataset.from),
    to: Number(el.dataset.to),
  }));
  const stage = film.querySelector(".film__stage");

  // O scroll da seção tem duas partes: o filme e, no fim, o trecho em que o
  // mesmo quadro encolhe até virar um retrato (--closing-length no CSS).
  function scrollSpans() {
    const total = film.offsetHeight - window.innerHeight;
    const closingPx = Math.min(window.innerHeight * 1.5, total * 0.4);
    return { filmPx: total - closingPx, closingPx };
  }

  /* ---------- Carregamento progressivo dos quadros ---------- */

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;

  // Primeiro quadro, depois um a cada 24, depois a cada 6, depois todos:
  // o scroll funciona cedo (com saltos) e vai ficando contínuo.
  const queue = (() => {
    const order = [];
    const seen = new Set();
    for (const step of [FRAME_COUNT, 24, 6, 1]) {
      for (let i = 0; i < FRAME_COUNT; i += step) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    return order;
  })();

  let inFlight = 0;
  const MAX_PARALLEL = 6;

  function pump() {
    while (inFlight < MAX_PARALLEL && queue.length) {
      const i = queue.shift();
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      inFlight++;
      img.decode().then(
        () => finish(i, img),
        () => finish(i, null),
      );
    }
  }

  function finish(i, img) {
    inFlight--;
    if (img) {
      images[i] = img;
      loadedCount++;
      needsDraw = true;
      requestTick();
    }
    updateLoading();
    pump();
  }

  function updateLoading() {
    const pending = queue.length + inFlight;
    loadingEl.textContent = pending
      ? `Carregando o filme: ${Math.round((loadedCount / FRAME_COUNT) * 100)}%`
      : "";
  }

  function nearestLoaded(target) {
    if (images[target]) return target;
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (target - d >= 0 && images[target - d]) return target - d;
      if (target + d < FRAME_COUNT && images[target + d]) return target + d;
    }
    return -1;
  }

  /* ---------- Desenho no canvas ---------- */

  function focusAt(frame) {
    for (let k = 1; k < FOCUS.length; k++) {
      const [f1, x1] = FOCUS[k];
      if (frame <= f1) {
        const [f0, x0] = FOCUS[k - 1];
        return x0 + ((x1 - x0) * (frame - f0)) / (f1 - f0 || 1);
      }
    }
    return FOCUS[FOCUS.length - 1][1];
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    needsDraw = true;
  }

  function draw(frame) {
    const idx = nearestLoaded(frame);
    if (idx < 0) return;
    const img = images[idx];
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = clamp(cw / 2 - focusAt(frame) * dw, cw - dw, 0);
    ctx.drawImage(img, dx, (ch - dh) / 2, dw, dh);
  }

  /* ---------- Scroll ---------- */

  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawn = -1;
  let needsDraw = true;
  let ticking = false;

  function onScroll() {
    const { filmPx, closingPx } = scrollSpans();
    const scrolled = -film.getBoundingClientRect().top;
    const p = clamp(scrolled / filmPx, 0, 1);
    targetFrame = p * (FRAME_COUNT - 1);

    const introOut = clamp(1 - p / INTRO_SPAN, 0, 1);
    intro.style.setProperty("--intro", introOut.toFixed(3));
    intro.style.visibility = introOut === 0 ? "hidden" : "visible";
    rail.style.setProperty("--progress", p.toFixed(4));

    // Fechamento, no mesmo quadro: primeiro somem versos e trilho, depois o
    // quadro encolhe (até 75% do trecho) e por fim o texto entra.
    const cp = clamp((scrolled - filmPx) / closingPx, 0, 1);
    const shrink = clamp((cp - 0.08) / 0.67, 0, 1);
    const eased = shrink * shrink * (3 - 2 * shrink);
    stage.style.setProperty("--ui", clamp(1 - cp / 0.1, 0, 1).toFixed(3));
    stage.style.setProperty("--p", eased.toFixed(4));
    stage.style.setProperty("--reveal", clamp((cp - 0.55) / 0.3, 0, 1).toFixed(3));

    requestTick();
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }

  function tick() {
    ticking = false;

    // Suaviza o avanço dos quadros; com movimento reduzido, vai direto.
    if (reduceMotion.matches) currentFrame = targetFrame;
    else currentFrame += (targetFrame - currentFrame) * 0.22;
    if (Math.abs(targetFrame - currentFrame) < 0.05) currentFrame = targetFrame;

    const frame = Math.round(currentFrame);
    if (frame !== lastDrawn || needsDraw) {
      draw(frame);
      lastDrawn = frame;
      needsDraw = false;
      updateVerses(frame);
    }

    if (currentFrame !== targetFrame) requestTick();
  }

  function updateVerses(frame) {
    let active = -1;
    verses.forEach((v, i) => {
      const isLast = i === verses.length - 1;
      const on = frame >= v.from && (isLast ? frame <= v.to : frame < v.to);
      v.el.classList.toggle("is-active", on);
      if (on) active = i;
    });
    // o trilho marca a etapa em que o filme está, mesmo entre versos
    let step = 0;
    verses.forEach((v, i) => { if (frame >= v.from - 14) step = i; });
    railLinks.forEach((a, i) => {
      if (i === (active >= 0 ? active : step)) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
    });
  }

  // Clique no trilho leva ao quadro da etapa
  railLinks.forEach((a) => {
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const frame = Number(a.dataset.frame);
      const top = film.offsetTop + (frame / (FRAME_COUNT - 1)) * scrollSpans().filmPx;
      window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { resizeCanvas(); onScroll(); });

  resizeCanvas();
  onScroll();
  updateLoading();
  pump();
})();
