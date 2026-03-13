// ============================================================
// TRADING JOURNAL - SHARED CONFIGURATION
// Update SPREADSHEET_ID and APPS_SCRIPT_URL before deployment
// ============================================================

const CONFIG = {
  // Google Spreadsheet ID (from the URL of your Google Sheet)
  SPREADSHEET_ID: 'https://docs.google.com/spreadsheets/d/1pTmXMWpOHhNMcFS71umrTqz3HIzhm7l_TpE3utKHr9k/edit?usp=sharing',
  
  // Google Apps Script Web App URL (deploy from your Apps Script)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwpgCeGd3pi0EV6JP9eecVOt-jXg2xISidwxJBiezN02PEGJxDk7vnXhHCTBBuM8lPaOw/exec',
  
  // Sheet names (must match exactly)
  SHEETS: {
    DAILY: 'Daily',
    DEALS: 'Deals',
    BACKTESTS: 'Backtests',
    TICKERS: 'Tickers'
  },

  // Account colors for charts
  ACCOUNT_COLORS: {
    'А Финам': '#c65454',
    'С Финам': '#931c10',
    'A Bybit':  '#ff7f27',
    'С Bybit':  '#bd5815',
    'С Форекс': '#a81fb3'
  },

  // Password for index page
  PASSWORD: 'x-3O9744',

  // Form accent colors
  COLORS: {
    DAILY:    '#4587f3',
    BACKTEST: '#9382fa',
    DEAL:     '#00ac47',
    HOME:     '#1a1a2e'
  }
};

// ============================================================
// THEME MANAGEMENT
// ============================================================
function initTheme() {
  const saved = localStorage.getItem('journal-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('journal-theme', next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================================
// API CALLS TO GOOGLE APPS SCRIPT
// ============================================================
async function apiCall(action, data = {}) {
  try {
    const params = new URLSearchParams({ action, ...data });
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    throw e;
  }
}

async function appendRow(sheet, rowData) {
  return apiCall('append', { sheet, data: JSON.stringify(rowData) });
}

async function getRows(sheet) {
  return apiCall('getRows', { sheet });
}

async function updateRow(sheet, rowIndex, rowData) {
  return apiCall('update', { sheet, rowIndex, data: JSON.stringify(rowData) });
}

// ============================================================
// SHARED NAVIGATION BAR
// ============================================================
function renderNavbar(activePage, accentColor) {
  const journalUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}`;
  return `
    <nav class="navbar" style="--accent: ${accentColor || '#4587f3'}">
      <div class="nav-left">
        <button class="nav-btn theme-btn" id="themeBtn" onclick="toggleTheme()" title="Переключить тему">🌙</button>
        <a href="index.html" class="nav-btn ${activePage==='home'?'active':''}">🏠 Главная</a>
        <a href="${journalUrl}" target="_blank" class="nav-btn journal-btn">📊 Journal</a>
      </div>
      <div class="nav-center">
        <span class="nav-title">${getPageTitle(activePage)}</span>
      </div>
      <div class="nav-right">
        <a href="analytics.html" class="nav-btn ${activePage==='analytics'?'active':''}">📈 Analytics</a>
      </div>
    </nav>`;
}

function getPageTitle(page) {
  const titles = { home: 'Trading Journal', daily: 'Daily', backtest: 'Backtest', deal: 'Deal', analytics: 'Analytics' };
  return titles[page] || 'Trading Journal';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============================================================
// DATE/TIME UTILS
// ============================================================
function formatDateTime(date) {
  if (!date) date = new Date();
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  return `${d}.${m}.${y} ${hh}:${mm}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
