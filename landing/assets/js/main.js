/* ─── SCROLL ANIMATIONS ─────────────────────────────────────────────────── */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
      observer.unobserve(el);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.slide-in').forEach((el) => observer.observe(el));

/* ─── TYPING ANIMATION ──────────────────────────────────────────────────── */

const names = ['OpenPip', 'Pippy', 'Aria', 'Cosmo', 'Remi', 'Max', 'Sage', 'Trippy'];
let nameIdx = 0;
let charIdx = 0;
let deleting = false;
let typingTimeout;

function getTypingEl()  { return document.getElementById('typing-name'); }
function getMockupName() { return document.getElementById('mockup-agent-name'); }

function tick() {
  const el = getTypingEl();
  if (!el) return;

  const current = names[nameIdx];

  if (!deleting) {
    charIdx++;
    const text = current.slice(0, charIdx);
    el.textContent = text;
    const m = getMockupName(); if (m) m.textContent = text || '…';
    if (charIdx === current.length) {
      deleting = true;
      typingTimeout = setTimeout(tick, nameIdx === names.length - 1 ? 2400 : 1600);
      return;
    }
    typingTimeout = setTimeout(tick, 80 + Math.random() * 40);
  } else {
    charIdx--;
    const text = current.slice(0, charIdx);
    el.textContent = text;
    const m = getMockupName(); if (m) m.textContent = text || '…';
    if (charIdx === 0) {
      deleting = false;
      nameIdx = (nameIdx + 1) % names.length;
      typingTimeout = setTimeout(tick, 300);
      return;
    }
    typingTimeout = setTimeout(tick, 45 + Math.random() * 20);
  }
}

tick();

/* ─── THEME TOGGLE ──────────────────────────────────────────────────────── */
// Uses the same localStorage keys as the frontend app (theme-mode, theme-accent)
// so user preferences carry over seamlessly.

const html = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function applyMode(mode) {
  const isDark = mode === 'system' ? mq.matches : mode === 'dark';
  html.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('theme-mode', mode);
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeSet === mode);
  });
  const color = isDark ? '#1a1816' : '#fff5f3';
  let tc = document.querySelector('meta[name="theme-color"]');
  if (!tc) {
    tc = document.createElement('meta');
    tc.name = 'theme-color';
    document.head.appendChild(tc);
  }
  tc.setAttribute('content', color);
}

function applyAccent(accent) {
  html.setAttribute('data-accent', accent);
  localStorage.setItem('theme-accent', accent);
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.accentSet === accent);
  });
}

// system preference change — keep in sync when mode is "system"
mq.addEventListener('change', () => {
  if (localStorage.getItem('theme-mode') === 'system') applyMode('system');
});

// restore persisted prefs (matches frontend defaults)
const savedMode   = localStorage.getItem('theme-mode')   ?? 'system';
const savedAccent = localStorage.getItem('theme-accent')  ?? 'coral';
applyMode(savedMode);
applyAccent(savedAccent);

document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyMode(btn.dataset.themeSet);
    if (window._logEvent) window._logEvent('theme_mode_selected', { mode: btn.dataset.themeSet });
  });
});

document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyAccent(btn.dataset.accentSet);
    if (window._logEvent) window._logEvent('theme_accent_selected', { accent: btn.dataset.accentSet });
  });
});

/* ─── CTA CLICKS ────────────────────────────────────────────────────────── */

document.querySelector('.nav-cta')
  ?.addEventListener('click', () => window._logEvent?.('cta_clicked', { position: 'nav' }));

document.querySelector('.btn-lg')
  ?.addEventListener('click', () => window._logEvent?.('cta_clicked', { position: 'hero' }));
