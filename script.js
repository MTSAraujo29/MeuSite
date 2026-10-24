/* ═══════════════════════════════════════════════════════════════
   MATHEUS ARAUJO · PORTFÓLIO
   Tema, navegação, revelações, filtros de projeto, cópia de e-mail
   e visualização do diploma.
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ───────────────────────── Tema ───────────────────────── */

  const themeToggle = $('#theme-toggle');
  const themeMeta = $('#theme-color');
  const THEME_KEY = 'theme';
  const THEME_COLORS = { dark: '#0c0d0f', light: '#f0f0ec' };

  function applyTheme(theme, persist) {
    const isLight = theme === 'light';
    root.dataset.theme = isLight ? 'light' : 'dark';

    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.setAttribute('aria-label', isLight ? 'Alternar para tema escuro' : 'Alternar para tema claro');
    }

    if (themeMeta) {
      themeMeta.setAttribute('content', isLight ? THEME_COLORS.light : THEME_COLORS.dark);
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
      } catch (error) {
        /* armazenamento indisponível — o tema ainda vale para a sessão */
      }
    }
  }

  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
    });
  }

  /* ───────────────────── Header ao rolar ───────────────────── */

  const header = $('[data-header]');
  let scrollTicking = false;

  function onScrollFrame() {
    scrollTicking = false;
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    updateScrollspy();
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  /* ───────────────────── Menu mobile ───────────────────── */

  const menuToggle = $('#menu-toggle');
  const nav = $('#primary-nav');
  const body = document.body;
  const desktopMedia = window.matchMedia('(min-width: 901px)');

  function isMenuOpen() {
    return body.classList.contains('menu-open');
  }

  function setMenu(open, { restoreFocus = false } = {}) {
    if (!menuToggle) return;

    body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');

    if (open) {
      const firstLink = $('.nav-link', nav);
      // O overlay entra com uma transição; espera a visibilidade
      // estabilizar antes de mover o foco para dentro do menu.
      window.setTimeout(() => {
        if (isMenuOpen() && firstLink) firstLink.focus({ preventScroll: true });
      }, 120);
    } else if (restoreFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      setMenu(!isMenuOpen());
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setMenu(false);
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!isMenuOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, { restoreFocus: true });
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = $$(
      '.site-header a[href], .site-header button:not([disabled])',
      header
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (typeof desktopMedia.addEventListener === 'function') {
    desktopMedia.addEventListener('change', (event) => {
      if (event.matches && isMenuOpen()) {
        setMenu(false);
      }
    });
  }

  // Ao navegar por âncoras no próprio menu, o scroll precisa acontecer
  // depois que o overlay deixa de bloquear a página.
  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (isMenuOpen()) {
        setMenu(false);
      }
    });
  });

  const brand = $('.brand');
  if (brand) {
    brand.addEventListener('click', () => {
      if (isMenuOpen()) setMenu(false);
    });
  }

  /* ───────────────────── Retrato em pontos → avatar do header ───────────────────── */

  const portrait = $('[data-portrait]');
  const portraitFrame = $('[data-portrait-frame]');
  const portraitCanvas = $('[data-portrait-canvas]');
  const brandAvatar = $('[data-brand-avatar]');

  if (portrait && portraitFrame && brandAvatar && header) {
    const compactQuery = window.matchMedia('(max-width: 900px)');
    const INK = '#0c0d0f';
    const INK_RGB = [12, 13, 15];
    const PAPER = '#e8e8e3';
    const TAU = Math.PI * 2;
    const clamp = (value, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, value));

    const dotsSupported =
      !reduceMotion.matches &&
      portraitCanvas &&
      typeof portraitCanvas.getContext === 'function' &&
      typeof window.Path2D === 'function';

    let mode = dotsSupported ? 'loading' : 'static';
    let docked = false;
    let ticking = false;

    // Estado do retrato em pontos
    let sourceImage = null;
    let dots = [];
    let buckets = [];
    let W = 0;
    let H = 0;
    let maxR = 3;
    let ready = false;
    let ctx = null;
    let fly = null;
    let fctx = null;
    let fp = 0;
    let target = 0;
    let raf = 0;
    let lastFrame = 0;
    let physics = false;
    let pointer = null;
    let hovering = false;
    let focused = false;
    let colorTarget = 0;
    let colorMix = 0;
    let resizeTimer = 0;

    function setDocked(next) {
      if (docked === next) return;
      docked = next;
      portrait.classList.toggle('is-docked', next);
      header.classList.toggle('is-docked', next);
    }

    /* Fallback: sem canvas ou com movimento reduzido, o retrato troca
       de estado instantaneamente, sem voo. */
    function updateStatic() {
      const rect = portraitFrame.getBoundingClientRect();
      const limit = header.offsetHeight;
      const compact = compactQuery.matches;
      const next =
        window.scrollY >= 8 &&
        (compact ? rect.bottom <= limit : rect.top <= limit + 2);
      setDocked(next);
    }

    function queueUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        if (mode === 'dots') {
          if (pointer) {
            pointer = null;
            if (fp === 0) {
              physics = true;
              startLoop();
            }
          }
          updateDots();
        } else {
          updateStatic();
        }
      });
    }

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    window.setTimeout(() => {
      if (mode !== 'dots') updateStatic();
    }, 120);

    function sizeFlightCanvas() {
      if (!fly) {
        fly = document.createElement('canvas');
        fly.className = 'portrait-fly';
        fly.setAttribute('aria-hidden', 'true');
        document.body.appendChild(fly);
        fctx = fly.getContext('2d');
      }
      if (!fctx) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      fly.width = Math.max(1, Math.round(window.innerWidth * ratio));
      fly.height = Math.max(1, Math.round(window.innerHeight * ratio));
      fctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    function clearFlight() {
      if (fctx) fctx.clearRect(0, 0, window.innerWidth + 2, window.innerHeight + 2);
    }

    /* Amostra a foto em uma grade de pontos e guarda cor, brilho e
       tamanho de cada ponto. A grade fica em coordenadas locais. */
    function build() {
      if (!sourceImage || !sourceImage.naturalWidth || !portraitCanvas) return false;
      const rect = portraitCanvas.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (!width || !height) return false;

      W = width;
      H = height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      portraitCanvas.width = Math.max(1, Math.round(W * ratio));
      portraitCanvas.height = Math.max(1, Math.round(H * ratio));
      ctx = portraitCanvas.getContext('2d');
      if (!ctx) return false;

      const space = clamp(W / 84, 3.3, 6.5);
      const cols = Math.max(8, Math.floor(W / space));
      const rows = Math.max(8, Math.floor(H / space));
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return false;
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';

      // recorte equivalente a object-fit: cover; object-position: center 24%
      const imageWidth = sourceImage.naturalWidth;
      const imageHeight = sourceImage.naturalHeight;
      const targetRatio = W / H;
      let cropX = 0;
      let cropY = 0;
      let cropW = imageWidth;
      let cropH = imageHeight;
      if (imageWidth / imageHeight > targetRatio) {
        cropW = imageHeight * targetRatio;
        cropX = (imageWidth - cropW) / 2;
      } else {
        cropH = imageWidth / targetRatio;
        cropY = (imageHeight - cropH) * 0.24;
      }
      offCtx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, cols, rows);

      let data;
      try {
        data = offCtx.getImageData(0, 0, cols, rows).data;
      } catch (error) {
        return false;
      }

      const total = cols * rows;
      const lum = new Float32Array(total);
      for (let i = 0; i < total; i += 1) {
        const p = i * 4;
        lum[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
      }

      // nitidez local, como no retrato de referência
      const sharp = new Float32Array(total);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy += 1) {
            const ny = y + dy;
            if (ny < 0 || ny >= rows) continue;
            for (let dx = -1; dx <= 1; dx += 1) {
              const nx = x + dx;
              if (nx < 0 || nx >= cols) continue;
              sum += lum[ny * cols + nx];
              count += 1;
            }
          }
          const index = y * cols + x;
          sharp[index] = clamp(lum[index] + 0.85 * (lum[index] - sum / count));
        }
      }

      const sorted = Array.from(sharp).sort((a, b) => a - b);
      const low = sorted[Math.floor(total * 0.02)];
      const high = sorted[Math.min(total - 1, Math.floor(total * 0.98))];
      const span = Math.max(0.03, high - low);

      // paleta curta: os pontos coloridos aparecem no hover
      const counts = new Uint32Array(216);
      const sums = new Float32Array(216 * 3);
      const keys = new Uint16Array(total);
      for (let i = 0; i < total; i += 1) {
        const p = i * 4;
        const red = data[p];
        const green = data[p + 1];
        const blue = data[p + 2];
        const key = ((red / 51) | 0) * 36 + ((green / 51) | 0) * 6 + ((blue / 51) | 0);
        keys[i] = key;
        counts[key] += 1;
        sums[key * 3] += red;
        sums[key * 3 + 1] += green;
        sums[key * 3 + 2] += blue;
      }

      const bucketOfKey = new Int16Array(216).fill(-1);
      buckets = [];
      for (let key = 0; key < 216; key += 1) {
        if (!counts[key]) continue;
        const count = counts[key];
        bucketOfKey[key] = buckets.length;
        buckets.push([
          (sums[key * 3] / count) * 0.82 + INK_RGB[0] * 0.18,
          (sums[key * 3 + 1] / count) * 0.82 + INK_RGB[1] * 0.18,
          (sums[key * 3 + 2] / count) * 0.82 + INK_RGB[2] * 0.18,
        ]);
      }

      maxR = space * 0.62;
      const originX = (W - cols * space) / 2 + space / 2;
      const originY = (H - rows * space) / 2 + space / 2;
      const nextDots = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x;
          const value = clamp((sharp[index] - low) / span);
          const darkness = 1 - value;
          const radius = maxR * (0.16 + 0.84 * Math.pow(darkness, 1.1));
          if (radius < 0.28) continue;
          const px = originX + x * space;
          const py = originY + y * space;
          nextDots.push({
            hx: px,
            hy: py,
            x: px,
            y: py,
            vx: 0,
            vy: 0,
            r: radius,
            b: bucketOfKey[keys[index]],
            seed: Math.random(),
            fe: 0,
          });
        }
      }

      dots = nextDots;
      pointer = null;
      physics = false;
      return dots.length > 0;
    }

    function renderPortrait() {
      if (!ctx || !W || !H) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!ready || fp >= 1) return;

      if (colorMix < 0.01) {
        const path = new Path2D();
        for (let i = 0; i < dots.length; i += 1) {
          const dot = dots[i];
          if (fp > 0 && dot.fe > 0) continue;
          if (dot.r < 0.2) continue;
          path.moveTo(dot.x + dot.r, dot.y);
          path.arc(dot.x, dot.y, dot.r, 0, TAU);
        }
        ctx.fillStyle = INK;
        ctx.fill(path);
        return;
      }

      const paths = [];
      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        if (fp > 0 && dot.fe > 0) continue;
        if (dot.r < 0.2) continue;
        let path = paths[dot.b];
        if (!path) {
          path = new Path2D();
          paths[dot.b] = path;
        }
        path.moveTo(dot.x + dot.r, dot.y);
        path.arc(dot.x, dot.y, dot.r, 0, TAU);
      }

      for (let i = 0; i < paths.length; i += 1) {
        const path = paths[i];
        if (!path) continue;
        const color = buckets[i];
        const red = Math.round(INK_RGB[0] + (color[0] - INK_RGB[0]) * colorMix);
        const green = Math.round(INK_RGB[1] + (color[1] - INK_RGB[1]) * colorMix);
        const blue = Math.round(INK_RGB[2] + (color[2] - INK_RGB[2]) * colorMix);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fill(path);
      }
    }

    function drawFlight() {
      if (!fctx || !ready) return;
      fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (fp <= 0 || fp >= 1) return;

      const slot = brandAvatar.getBoundingClientRect();
      if (!slot.width || !slot.height) return;
      const pad = 2.5;
      const k = Math.min(
        (slot.width - pad * 2) / W,
        (slot.height - pad * 2) / H
      );
      const boxX = slot.left + (slot.width - W * k) / 2;
      const boxY = slot.top + (slot.height - H * k) / 2;
      const origin = portraitCanvas.getBoundingClientRect();
      const alpha = fp > 0.86 ? 1 - (fp - 0.86) / 0.14 : 1;
      const flightInk =
        root.getAttribute('data-theme') === 'light' ? '#0e0e0f' : PAPER;
      const onCard = new Path2D();
      const offCard = new Path2D();

      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        const delay = (dot.hy / H) * 0.4 + dot.seed * 0.08;
        const progress = clamp((fp - delay) / 0.52);
        const eased = 1 - Math.pow(1 - progress, 3);
        dot.fe = eased;
        if (eased <= 0) continue;

        let x = boxX + dot.hx * k;
        let y = boxY + dot.hy * k;
        let radius = Math.max(0.1, dot.r * k * 2);

        if (eased < 1) {
          const startX = origin.left + dot.x;
          const startY = origin.top + dot.y;
          x = startX + (x - startX) * eased + Math.sin(eased * Math.PI) * (dot.seed - 0.5) * 46;
          y = startY + (y - startY) * eased - Math.sin(eased * Math.PI) * (15 + dot.seed * 32);
          radius = dot.r + (radius - dot.r) * eased;
        }

        if (radius < 0.14) continue;
        // Sobre o cartão claro o ponto continua tinta; ao cruzar a borda
        // ele acende na cor do papel para não sumir no fundo escuro.
        // Quando o cartão já se dissolveu, tudo voa aceso.
        const inside =
          fp <= 0.72 &&
          x > origin.left && x < origin.right &&
          y > origin.top && y < origin.bottom;
        const path = inside ? onCard : offCard;
        path.moveTo(x + radius, y);
        path.arc(x, y, radius, 0, TAU);
      }

      fctx.globalAlpha = clamp(alpha);
      fctx.fillStyle = INK;
      fctx.fill(onCard);
      fctx.fillStyle = flightInk;
      fctx.fill(offCard);
      fctx.globalAlpha = 1;
    }

    function stepPhysics(dt) {
      const spring = 55;
      const damp = Math.pow(0.8, dt * 60);
      const radius = clamp(W * 0.22, 54, 88);
      const radiusSq = radius * radius;
      const force = 5200;
      let metric = 0;

      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        let ax = (dot.hx - dot.x) * spring;
        let ay = (dot.hy - dot.y) * spring;

        if (pointer) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < radiusSq && distanceSq > 0.01) {
            const distance = Math.sqrt(distanceSq);
            const falloff = 1 - distance / radius;
            ax += (dx / distance) * falloff * falloff * force;
            ay += (dy / distance) * falloff * falloff * force;
          }
        }

        dot.vx = (dot.vx + ax * dt) * damp;
        dot.vy = (dot.vy + ay * dt) * damp;
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;

        const speed = Math.abs(dot.vx) + Math.abs(dot.vy);
        if (pointer) {
          if (speed > metric) metric = speed;
        } else {
          const offset = Math.hypot(dot.hx - dot.x, dot.hy - dot.y);
          if (speed + offset > metric) metric = speed + offset;
        }
      }

      return metric;
    }

    function startLoop() {
      if (raf) return;
      lastFrame = performance.now();
      raf = window.requestAnimationFrame(stepFrame);
    }

    function stopLoop() {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    }

    function settle() {
      stopLoop();
      physics = false;
      portrait.classList.remove('is-flying', 'is-clearing');
      if (!ready) return;
      if (fp >= 1) {
        fp = 1;
        renderPortrait();
        clearFlight();
        setDocked(true);
      } else {
        fp = 0;
        clearFlight();
        setDocked(false);
        renderPortrait();
      }
    }

    function stepFrame(now) {
      raf = 0;
      const dt = clamp((now - lastFrame) / 1000, 0.001, 0.05);
      lastFrame = now;
      let active = false;
      let heroDirty = false;

      if (fp !== target) {
        const duration = target > fp ? 1.1 : 0.85;
        const delta = dt / duration;
        fp = target > fp ? Math.min(target, fp + delta) : Math.max(target, fp - delta);

        if (fp >= 1) {
          fp = 1;
          clearFlight();
          setDocked(true);
        } else if (fp <= 0) {
          fp = 0;
          clearFlight();
          setDocked(false);
        } else if (docked) {
          setDocked(false);
        }

        active = fp !== target;
        heroDirty = true;
      }

      if (fp > 0) {
        portrait.classList.add('is-flying');
      } else {
        portrait.classList.remove('is-flying', 'is-clearing');
      }
      portrait.classList.toggle('is-clearing', fp > 0.72);

      if (fp > 0 && fp < 1) {
        drawFlight();
        active = true;
      } else if (fp === 0) {
        clearFlight();
      }

      if (colorMix !== colorTarget) {
        const amount = Math.min(1, dt * 7);
        colorMix += (colorTarget - colorMix) * amount;
        if (Math.abs(colorTarget - colorMix) < 0.004) colorMix = colorTarget;
        active = true;
        heroDirty = true;
      }

      if (fp === 0 && physics) {
        const motionValue = stepPhysics(dt);
        heroDirty = true;
        if (motionValue < 0.35) physics = false;
        else active = true;
      }

      if (heroDirty) renderPortrait();
      if (active) raf = window.requestAnimationFrame(stepFrame);
    }

    function updateDots() {
      if (!ready) {
        updateStatic();
        return;
      }

      const rect = portraitFrame.getBoundingClientRect();
      const limit = header.offsetHeight;
      const compact = compactQuery.matches;
      let next;

      if (compact) {
        next =
          window.scrollY >= 8 &&
          (docked ? rect.bottom <= 0 : rect.bottom <= limit)
            ? 1
            : 0;
        if (next !== fp) {
          target = next;
          fp = next;
          settle();
          return;
        }
      } else {
        const near =
          window.scrollY >= 8 && rect.top <= limit + (fp > 0 ? 28 : 4);
        next = near ? 1 : 0;
      }

      if (reduceMotion.matches) {
        target = next;
        fp = next;
        settle();
        return;
      }

      target = next;
      if (fp !== target) startLoop();
    }

    function localPoint(event) {
      const rect = portraitCanvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function refreshColor() {
      if (mode !== 'dots' || !ready) return;
      colorTarget = hovering || focused ? 1 : 0;
      if (colorMix !== colorTarget) startLoop();
    }

    function onPointerMove(event) {
      if (mode !== 'dots' || !ready || fp > 0) return;
      if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
      hovering = true;
      pointer = localPoint(event);
      physics = true;
      refreshColor();
      startLoop();
    }

    function onPointerEnter(event) {
      if (mode !== 'dots' || !ready) return;
      if (event.pointerType === 'touch') return;
      hovering = true;
      refreshColor();
    }

    function onPointerLeave(event) {
      if (mode !== 'dots' || !ready || event.pointerType === 'touch') return;
      hovering = false;
      pointer = null;
      if (fp === 0) {
        physics = true;
        startLoop();
      }
      refreshColor();
    }

    function onFocus() {
      focused = true;
      refreshColor();
    }

    function onBlur() {
      focused = false;
      refreshColor();
    }

    function onViewportResize() {
      if (mode !== 'dots' || !ready) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sizeFlightCanvas();
        if (!build()) {
          fallback();
          return;
        }
        const wasDocked = docked;
        target = wasDocked ? 1 : 0;
        fp = target;
        settle();
        updateDots();
      }, 150);
    }

    function fallback() {
      ready = false;
      mode = 'static';
      portrait.classList.remove('is-flying', 'is-clearing');
      root.classList.remove('dots-ready');
      portraitFrame.classList.remove('is-dotty');
      stopLoop();
      if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
      fly = null;
      fctx = null;
      updateStatic();
    }

    function initialDotsSync() {
      const rect = portraitFrame.getBoundingClientRect();
      const limit = header.offsetHeight;
      const compact = compactQuery.matches;
      const shouldDock =
        window.scrollY >= 8 &&
        (compact ? rect.bottom <= limit : rect.top <= limit + 2);
      target = shouldDock ? 1 : 0;
      fp = target;
      settle();
      updateDots();
    }

    function initDots() {
      if (!dotsSupported) return;
      sourceImage = new Image();
      sourceImage.decoding = 'async';
      sourceImage.onload = () => {
        if (!build()) {
          fallback();
          return;
        }
        ready = true;
        sizeFlightCanvas();
        mode = 'dots';
        root.classList.add('dots-ready');
        portraitFrame.classList.add('is-dotty');
        initialDotsSync();
      };
      sourceImage.onerror = fallback;
      sourceImage.src = 'img/retrato.webp';

      portraitFrame.addEventListener('pointermove', onPointerMove, { passive: true });
      portraitFrame.addEventListener('pointerenter', onPointerEnter, { passive: true });
      portraitFrame.addEventListener('pointerleave', onPointerLeave, { passive: true });
      portraitFrame.addEventListener('focus', onFocus);
      portraitFrame.addEventListener('blur', onBlur);
      window.addEventListener('resize', onViewportResize, { passive: true });

      if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', (event) => {
          if (mode !== 'dots' || !event.matches) return;
          pointer = null;
          hovering = false;
          focused = false;
          physics = false;
          colorTarget = 0;
          colorMix = 0;
          renderPortrait();
          updateDots();
        });
      }

      window.setTimeout(() => {
        if (mode === 'loading') updateStatic();
      }, 120);
    }

    initDots();
  }

  /* ───────────────────── Scrollspy ───────────────────── */

  const navLinks = $$('.nav-link');
  const spySections = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      return id && id.startsWith('#') ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean);

  function updateScrollspy() {
    if (!spySections.length) return;

    const headerHeight = header ? header.offsetHeight : 0;
    const probe = window.scrollY + headerHeight + Math.min(window.innerHeight * 0.32, 280);
    let currentId = '';

    spySections.forEach((section) => {
      if (section.offsetTop <= probe) currentId = section.id;
    });

    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    if (atBottom) currentId = spySections[spySections.length - 1].id;

    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  onScrollFrame();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    requestScrollUpdate();
    updateScrollspy();
  });

  /* ───────────────────── Revelações ───────────────────── */

  const revealElements = $$('.reveal');

  function revealAll() {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealAll();
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  /* ───────────────────── Projetos ───────────────────── */

  const projectList = $('[data-projects-list]');
  const projectRows = projectList ? $$('.project-row', projectList) : [];
  const stageCards = $$('.stage-card');
  const filterButtons = $$('.filter');
  const prefersHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  function setActiveProject(projectId) {
    if (!projectId) return;

    projectRows.forEach((row) => {
      row.classList.toggle('is-active', row.dataset.project === projectId);
    });

    stageCards.forEach((card) => {
      const active = card.dataset.stage === projectId;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-hidden', String(!active));

      if (!active) {
        card.setAttribute('inert', '');
      } else {
        card.removeAttribute('inert');
      }
    });
  }

  function currentProject() {
    const activeRow = projectRows.find(
      (row) => row.classList.contains('is-active') && !row.classList.contains('is-filtered-out')
    );
    const firstVisible = projectRows.find((row) => !row.classList.contains('is-filtered-out'));
    return activeRow || firstVisible || projectRows[0];
  }

  projectRows.forEach((row) => {
    const activate = () => {
      if (row.classList.contains('is-filtered-out')) return;
      setActiveProject(row.dataset.project);
    };

    row.addEventListener('focusin', activate);

    if (prefersHover.matches) {
      row.addEventListener('mouseenter', activate);
    }
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';

      filterButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });

      projectRows.forEach((row) => {
        const categories = (row.dataset.categories || '').split(/\s+/).filter(Boolean);
        const visible = filter === 'all' || categories.includes(filter);
        row.classList.toggle('is-filtered-out', !visible);
      });

      const next = currentProject();
      setActiveProject(next ? next.dataset.project : null);
    });
  });

  if (projectRows.length) {
    setActiveProject(projectRows.find((row) => row.classList.contains('is-active'))?.dataset.project || 'p1');
  }

  /* ───────────────────── E-mail: copiar ───────────────────── */

  let toastTimer = null;

  function showToast(message) {
    const toast = $('[data-toast]');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function legacyCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-1000px';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    field.remove();
    return copied;
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        /* tenta o caminho legado */
      }
    }
    return legacyCopy(text);
  }

  $$('[data-copy]').forEach((button) => {
    const label = button.querySelector('span');
    const originalLabel = label ? label.textContent : '';

    button.addEventListener('click', async () => {
      const text = button.dataset.copy || '';
      if (!text) return;

      const copied = await copyToClipboard(text);

      if (copied) {
        showToast('E-mail copiado para a área de transferência.');
        if (label) {
          label.textContent = 'Copiado';
          window.setTimeout(() => {
            label.textContent = originalLabel;
          }, 2000);
        }
      } else {
        showToast('Não foi possível copiar. Selecione o e-mail manualmente.');
      }
    });
  });

  /* ───────────────────── Diálogo de documentos ───────────────────── */

  const docDialog = $('#doc-dialog');
  const docOpeners = $$('[data-doc-open]');

  if (docDialog && docOpeners.length) {
    const docFrame = $('[data-doc-iframe]', docDialog);
    const docTitle = $('[data-doc-title]', docDialog);
    const docExternal = $('[data-doc-external]', docDialog);
    const docFallback = $('[data-doc-fallback]', docDialog);
    const docClosers = $$('[data-doc-close]', docDialog);
    let lastOpener = null;

    docOpeners.forEach((opener) => {
      opener.addEventListener('click', () => {
        const source = opener.dataset.docOpen;
        if (!source) return;
        const title = opener.dataset.docTitle || 'Documento · Matheus Ferreira de Araujo';
        const viewer = `${source}#view=FitH&navpanes=0`;

        if (docTitle) docTitle.textContent = title;
        if (docExternal) docExternal.href = source;
        if (docFallback) docFallback.href = source;
        if (docFrame) docFrame.src = viewer;

        lastOpener = opener;

        if (typeof docDialog.showModal === 'function') {
          if (!docDialog.open) docDialog.showModal();
          document.body.classList.add('dialog-open');
        } else {
          window.open(source, '_blank', 'noopener');
        }
      });
    });

    docClosers.forEach((button) => {
      button.addEventListener('click', () => {
        if (typeof docDialog.close === 'function') {
          docDialog.close();
        } else {
          docDialog.removeAttribute('open');
          document.body.classList.remove('dialog-open');
        }
      });
    });

    // Clique no backdrop (fora do conteúdo) fecha a visualização.
    docDialog.addEventListener('click', (event) => {
      if (event.target === docDialog) {
        docDialog.close();
      }
    });

    docDialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (lastOpener && typeof lastOpener.focus === 'function') {
        lastOpener.focus({ preventScroll: true });
      }
    });

    docDialog.addEventListener('cancel', () => {
      document.body.classList.remove('dialog-open');
    });
  }

  /* ───────────────────── Rolagem para âncoras ───────────────────── */

  // Garante que o menu fechado não mantenha a página travada ao
  // navegar pelo teclado ou por links externos.
  window.addEventListener('hashchange', () => {
    if (isMenuOpen()) setMenu(false);
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) revealAll();
    });
  }
})();
