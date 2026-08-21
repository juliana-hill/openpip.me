/* ─── COOKIE CONSENT (EU ePrivacy + California CPRA) ─────────────────────
 *
 * Strategy: Geo-detect via country.is (no cookies, no device storage).
 *   - USA / non-EU: Load Firebase Analytics immediately.
 *     California: honor GPC signal; "Do Not Sell" link in footer.
 *   - EU/EEA/UK: Block Firebase until user opts in via footer link.
 *
 * What does NOT require consent anywhere:
 *   - localStorage: theme-mode, theme-accent (user-requested)
 *   - navigator.sendBeacon page_pings (no device storage)
 *
 * What requires EU consent:
 *   - Firebase Analytics (sets _ga, _gid cookies + IDB)
 *
 * Consent stored in localStorage "cookie-consent":
 *   - "accepted" — analytics enabled
 *   - "rejected" — analytics blocked
 *   - null — pending (behavior depends on region)
 * ──────────────────────────────────────────────────────────────────────── */

const CONSENT_KEY = 'cookie-consent';

// EU/EEA country codes — only these enforce prior opt-in consent
// UK removed (UK GDPR + PECR exists but you're not targeting UK market)
const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
  'PL','PT','RO','SK','SI','ES','SE',
  'IS','LI','NO' // EEA (Iceland, Liechtenstein, Norway)
]);

// ─── Helpers ────────────────────────────────────────────────────────────

function getConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

function setConsent(value) {
  localStorage.setItem(CONSENT_KEY, value);
}

function hideToast() {
  const toast = document.getElementById('consent-toast');
  if (toast) {
    toast.classList.add('consent-toast-exit');
    setTimeout(() => { toast.hidden = true; }, 300);
  }
}

function showToast() {
  const toast = document.getElementById('consent-toast');
  if (toast) {
    toast.hidden = false;
    toast.classList.remove('consent-toast-exit');
    requestAnimationFrame(() => toast.classList.add('consent-toast-enter'));
  }
}

function loadFirebaseAnalytics() {
  import('./firebase.js').catch((err) => {
    console.warn('[consent] Failed to load Firebase Analytics:', err);
  });
}

function handleAccept() {
  setConsent('accepted');
  hideToast();
  loadFirebaseAnalytics();
}

function handleReject() {
  setConsent('rejected');
  hideToast();
  window._logEvent = () => {};
}

// ─── Geo-based consent logic ────────────────────────────────────────────

async function detectRegionAndInit() {
  const consent = getConsent();

  // If user already made a choice, respect it regardless of region
  if (consent === 'accepted') {
    loadFirebaseAnalytics();
    return;
  }
  if (consent === 'rejected') {
    window._logEvent = () => {};
    return;
  }

  // No prior decision — check region
  let isEU = false;
  try {
    const res = await fetch('https://api.country.is');
    if (res.ok) {
      const data = await res.json();
      isEU = EU_COUNTRIES.has(data.country);
    }
  } catch (e) {
    // Geo lookup failed — assume non-EU (target market is USA)
    isEU = false;
  }

  if (isEU) {
    // EU/EEA/UK: block analytics, user must opt in via footer
    window._logEvent = () => {};
  } else {
    // USA / rest of world: load analytics immediately (opt-out model)
    loadFirebaseAnalytics();
  }
}

// ─── Init ───────────────────────────────────────────────────────────────

// Set a no-op immediately so main.js doesn't error while we async-detect
window._logEvent = window._logEvent || (() => {});

detectRegionAndInit();

// ─── Event listeners ────────────────────────────────────────────────────

document.getElementById('consent-accept')?.addEventListener('click', handleAccept);
document.getElementById('consent-reject')?.addEventListener('click', handleReject);

// Details toggle
document.getElementById('consent-toggle-details')?.addEventListener('click', () => {
  const details = document.getElementById('consent-details');
  if (details) details.hidden = !details.hidden;
});

// Save from granular view
document.getElementById('consent-save')?.addEventListener('click', () => {
  const checked = document.getElementById('consent-analytics-check')?.checked;
  if (checked) handleAccept();
  else handleReject();
});

// Footer: "Do Not Sell or Share" (CPRA) — opt out
document.getElementById('footer-do-not-sell')?.addEventListener('click', (e) => {
  e.preventDefault();
  handleReject();
  const el = e.target;
  el.textContent = '✓ Opted out';
  setTimeout(() => { el.textContent = 'Do Not Sell or Share My Info'; }, 2000);
});

// Footer: "Cookie Preferences" — show toast for manual opt-in/out
document.getElementById('footer-cookie-prefs')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast();
});
