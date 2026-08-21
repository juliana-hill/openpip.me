import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyBcLuiZ9SrwzE4p9enOUZtuqtofjANEHPY",
  authDomain: "travel-agent-cam-julie.firebaseapp.com",
  projectId: "travel-agent-cam-julie",
  storageBucket: "travel-agent-cam-julie.firebasestorage.app",
  messagingSenderId: "534699736159",
  appId: "1:534699736159:web:c18f77a71ea2465a486fea",
  measurementId: "G-4QPNBFB5WR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

window._analytics = analytics;
window._logEvent = (name, params) => logEvent(analytics, name, params);

// Funnel event 1: page loaded
logEvent(analytics, 'landing_page_loaded');

// Funnel event 2: form interaction started (fires once on first input focus)
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('name');
let formStarted = false;
function onFormStart() {
  if (formStarted) return;
  formStarted = true;
  logEvent(analytics, 'form_started');
}
if (emailInput) emailInput.addEventListener('focus', onFormStart, { once: true });
if (nameInput) nameInput.addEventListener('focus', onFormStart, { once: true });

window.submitWaitlist = async function(name, email) {
  const existing = await getDocs(query(collection(db, 'waitlist'), where('email', '==', email)));
  if (!existing.empty) return;
  await addDoc(collection(db, 'waitlist'), { name, email, submittedAt: serverTimestamp() });
  // Funnel event 3: form successfully submitted
  logEvent(analytics, 'form_completed');
};
