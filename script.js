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

  /* ───────────────────── Retrato → avatar do header ───────────────────── */

  const portrait = $('[data-portrait]');
  const portraitFrame = $('[data-portrait-frame]');
  const brandAvatar = $('[data-brand-avatar]');

  if (portrait && portraitFrame && brandAvatar && header) {
    let docked = false;
    let flying = false;
    let portraitTicking = false;

    const compactQuery = window.matchMedia('(max-width: 900px)');
    const edge = () => header.offsetHeight;
    const noFlight = () => reduceMotion.matches;

    function flightClone(from) {
      const clone = document.createElement('div');
      clone.className = 'portrait-flight';
      clone.setAttribute('aria-hidden', 'true');

      const image = document.createElement('img');
      image.src = 'img/retrato-pixel.webp';
      image.alt = '';
      image.width = 640;
      image.height = 800;
      clone.appendChild(image);

      clone.style.left = `${from.left}px`;
      clone.style.top = `${from.top}px`;
      clone.style.width = `${from.width}px`;
      clone.style.height = `${from.height}px`;
      document.body.appendChild(clone);
      return clone;
    }

    // ida: destino fixo (avatar do header), animação declarativa
    function flight(from, to, duration) {
      if (noFlight() || typeof Element.prototype.animate !== 'function') return null;
      const clone = flightClone(from);

      const scaleX = to.width / from.width;
      const scaleY = to.height / from.height;
      const dx = to.left - from.left;
      const dy = to.top - from.top;
      const halfway = 0.55;
      const midScaleX = 1 - (1 - scaleX) * halfway;
      const midScaleY = 1 - (1 - scaleY) * halfway;
      const midX = dx * 0.32;
      const midY = dy * 0.55 - 26;

      const animation = clone.animate(
        [
          { transform: 'translate(0, 0) scale(1, 1)', borderRadius: '0px' },
          {
            transform: `translate(${midX}px, ${midY}px) scale(${midScaleX}, ${midScaleY})`,
            borderRadius: '2px',
            offset: 0.55,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, borderRadius: '1px' },
        ],
        {
          duration,
          easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
          fill: 'both',
        }
      );

      return { clone, animation };
    }

    // volta: o retrato está no fluxo da página e se move enquanto rolamos,
    // então o destino é lido a cada frame para o clone pousar no lugar certo.
    function flightBack(from, getTo, duration) {
      if (noFlight()) return null;
      const clone = flightClone(from);
      const started = performance.now();
      const bezier = (x1, y1, x2, y2) => {
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;
        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;
        const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
        const sampleY = (t) => ((ay * t + by) * t + cy) * t;
        const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
        return (x) => {
          let t = x;
          for (let i = 0; i < 6; i += 1) {
            const offset = sampleX(t) - x;
            const slope = sampleDX(t);
            if (Math.abs(offset) < 1e-5 || Math.abs(slope) < 1e-6) break;
            t -= offset / slope;
          }
          return sampleY(Math.min(1, Math.max(0, t)));
        };
      };
      const ease = bezier(0.76, 0, 0.24, 1);
      let resolve;
      const finished = new Promise((done) => { resolve = done; });

      const step = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = ease(progress);
        const to = getTo();
        const x = from.left + (to.left - from.left) * eased;
        const y = from.top + (to.top - from.top) * eased - Math.sin(Math.PI * eased) * 14;
        const width = from.width + (to.width - from.width) * eased;
        const height = from.height + (to.height - from.height) * eased;
        clone.style.transform =
          `translate(${x - from.left}px, ${y - from.top}px) ` +
          `scale(${width / from.width}, ${height / from.height})`;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          clone.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) ` +
            `scale(${to.width / from.width}, ${to.height / from.height})`;
          resolve();
        }
      };
      window.requestAnimationFrame(step);

      return { clone, finished };
    }

    function dock({ instant = false } = {}) {
      if (docked || flying) return;
      if (instant || noFlight()) {
        portrait.classList.add('is-docked');
        header.classList.add('is-docked');
        docked = true;
        return;
      }

      const from = portraitFrame.getBoundingClientRect();
      const to = brandAvatar.getBoundingClientRect();
      if (!from.width || !to.width) {
        portrait.classList.add('is-docked');
        header.classList.add('is-docked');
        docked = true;
        return;
      }

      flying = true;
      portrait.classList.add('is-departing');
      const move = flight(from, to, 950);
      const finish = () => {
        if (move) move.clone.remove();
        portrait.classList.remove('is-departing');
        portrait.classList.add('is-docked');
        header.classList.add('is-docked');
        docked = true;
        flying = false;
        queuePortraitUpdate();
      };

      if (!move) {
        finish();
      } else {
        move.animation.finished.then(finish).catch(finish);
      }
    }

    function undock({ instant = false } = {}) {
      if (!docked || flying) return;
      if (instant || noFlight()) {
        portrait.classList.remove('is-docked');
        header.classList.remove('is-docked');
        docked = false;
        return;
      }

      const from = brandAvatar.getBoundingClientRect();
      flying = true;
      const move = flightBack(from, () => portraitFrame.getBoundingClientRect(), 830);

      portrait.classList.remove('is-docked');
      portrait.classList.add('is-returning');

      // o clone decola do avatar; só então o logo reaparece no header
      const swapHeader = window.setTimeout(() => header.classList.remove('is-docked'), 280);

      const finish = () => {
        window.clearTimeout(swapHeader);
        portrait.classList.add('is-landed');
        portrait.classList.remove('is-returning');
        if (move) move.clone.remove();
        void portraitFrame.offsetWidth;
        portrait.classList.remove('is-landed');
        header.classList.remove('is-docked');
        docked = false;
        flying = false;
        queuePortraitUpdate();
      };

      if (!move) {
        finish();
      } else {
        move.finished.then(finish).catch(finish);
      }
    }

    function updatePortraitDock() {
      if (flying) return;
      if (window.scrollY < 8) {
        if (docked && portraitFrame.getBoundingClientRect().top > 0) {
          undock({ instant: true });
        }
        return;
      }

      const rect = portraitFrame.getBoundingClientRect();
      const limit = edge();
      const compact = compactQuery.matches;

      if (!docked) {
        // no mobile o retrato ocupa a largura toda: ele só "embarca"
        // no header depois de sair de cena, sem deixar um vão visível.
        if (rect.bottom <= (compact ? limit : limit + 4)) {
          dock({ instant: compact });
        } else if (!compact && rect.top <= limit) {
          dock();
        }
      } else if (compact ? rect.bottom > 0 : rect.top > limit + 28) {
        undock({ instant: compact });
      }
    }

    function queuePortraitUpdate() {
      if (portraitTicking) return;
      portraitTicking = true;
      window.requestAnimationFrame(() => {
        portraitTicking = false;
        updatePortraitDock();
      });
    }

    window.addEventListener('scroll', queuePortraitUpdate, { passive: true });
    window.addEventListener('resize', queuePortraitUpdate, { passive: true });
    // ao recarregar no meio da página, reflete o estado já rolado sem animação
    window.setTimeout(() => {
      if (window.scrollY < 8) return;
      const rect = portraitFrame.getBoundingClientRect();
      if (compactQuery.matches ? rect.bottom <= edge() : rect.top <= edge()) {
        dock({ instant: true });
      }
    }, 120);
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

  /* ───────────────────── Diálogo do diploma ───────────────────── */

  const diplomaDialog = $('#diploma-dialog');
  const diplomaOpeners = $$('[data-diploma-open]');

  if (diplomaDialog && diplomaOpeners.length) {
    const diplomaFrame = $('[data-diploma-iframe]', diplomaDialog);
    const diplomaClose = $$('[data-diploma-close]', diplomaDialog);
    const pdfSource = 'pdf/Meu%20diploma.pdf#view=FitH';

    diplomaOpeners.forEach((opener) => {
      opener.addEventListener('click', () => {
        if (diplomaFrame && !diplomaFrame.hasAttribute('src')) {
          diplomaFrame.setAttribute('src', pdfSource);
        }

        if (typeof diplomaDialog.showModal === 'function') {
          if (!diplomaDialog.open) diplomaDialog.showModal();
          document.body.classList.add('dialog-open');
        } else {
          window.open('pdf/Meu%20diploma.pdf', '_blank', 'noopener');
        }
      });
    });

    diplomaClose.forEach((button) => {
      button.addEventListener('click', () => {
        if (typeof diplomaDialog.close === 'function') {
          diplomaDialog.close();
        } else {
          diplomaDialog.removeAttribute('open');
          document.body.classList.remove('dialog-open');
        }
      });
    });

    // Clique no backdrop (fora do conteúdo) fecha a visualização.
    diplomaDialog.addEventListener('click', (event) => {
      if (event.target === diplomaDialog) {
        diplomaDialog.close();
      }
    });

    diplomaDialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
    });

    diplomaDialog.addEventListener('cancel', () => {
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
