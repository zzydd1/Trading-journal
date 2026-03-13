// ============================================================
// TRADER JOURNAL — Shared JavaScript Utilities
// ============================================================

// ---- CONFIG ----
const CONFIG = {
  // Замени на URL твоего Apps Script Web App после публикации
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwpgCeGd3pi0EV6JP9eecVOt-jXg2xISidwxJBiezN02PEGJxDk7vnXhHCTBBuM8lPaOw/exec',
  // Замени на URL твоей Google Таблицы
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1pTmXMWpOHhNMcFS71umrTqz3HIzhm7l_TpE3utKHr9k/edit?usp=sharing',
  PASSWORD: 'x-3O9744', // Пароль для входа — измени!
};

// ---- THEME ----
function initTheme() {
  const saved = localStorage.getItem('journal-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('journal-theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

// ---- AUTH ----
function checkAuth() {
  const authed = sessionStorage.getItem('journal-auth');
  if (!authed && window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
    window.location.href = 'index.html';
  }
}

function setAuth() {
  sessionStorage.setItem('journal-auth', '1');
}

// ---- API ----
async function apiCall(action, data = {}) {
  const payload = { action, ...data };
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch(e) {
    console.error('API Error:', e);
    return { error: e.toString() };
  }
}

// ---- TOAST ----
function showToast(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ---- TABS ----
function initTabs(containerId) {
  const container = document.getElementById(containerId) || document;
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.classList.add('active');
    });
  });
  
  // Activate first tab
  if (tabBtns[0]) tabBtns[0].click();
}

// ---- RADIO GROUPS ----
function initRadioGroups() {
  document.querySelectorAll('.radio-group').forEach(group => {
    group.querySelectorAll('.radio-option').forEach(option => {
      option.addEventListener('click', () => {
        const input = option.querySelector('input[type="radio"]');
        if (!input) return;
        
        // Clear group
        group.querySelectorAll('.radio-option').forEach(o => {
          o.classList.remove('selected');
        });
        
        // Handle "other" input
        const otherInput = group.querySelector('.other-input');
        if (input.value === 'other') {
          option.classList.add('selected');
          input.checked = true;
          if (otherInput) otherInput.style.display = 'block';
        } else {
          option.classList.add('selected');
          input.checked = true;
          if (otherInput) otherInput.style.display = 'none';
        }
      });
    });
  });
}

// ---- FORM DATA ----
function getFormValue(name) {
  const el = document.querySelector(`[name="${name}"]`);
  if (!el) return '';
  if (el.type === 'radio') {
    const checked = document.querySelector(`[name="${name}"]:checked`);
    if (!checked) return '';
    if (checked.value === 'other') {
      const other = document.querySelector(`[name="${name}_other"]`);
      return other ? other.value : '';
    }
    return checked.value;
  }
  return el.value;
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  if (!checked) return '';
  if (checked.value === 'other') {
    const other = document.querySelector(`input[name="${name}_other"]`);
    return other ? other.value : 'Другое';
  }
  return checked.value;
}

// ---- DATE/TIME ----
function getCurrentDateTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    datetime: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
    dayOfWeek: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'][now.getDay()],
    formatted: `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}

// ---- PNL CALCULATION ----
function calcPnL(entry, closePrice, lots, lotCost, direction) {
  if (!entry || !closePrice || !lots || !lotCost) return null;
  const e = parseFloat(entry), c = parseFloat(closePrice), l = parseFloat(lots), lc = parseFloat(lotCost);
  if (isNaN(e) || isNaN(c) || isNaN(l) || isNaN(lc)) return null;
  const diff = direction === 'Short' ? e - c : c - e;
  return diff * l * lc;
}

// ---- RISK REWARD ----
function calcRR(entry, sl, target) {
  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(target);
  if (isNaN(e) || isNaN(s) || isNaN(t) || s === e) return null;
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  return (reward / risk).toFixed(2);
}

// ---- LOT SIZE ----
function calcLotSize(balance, riskPercent, entry, sl, lotCost) {
  const b = parseFloat(balance), r = parseFloat(riskPercent) / 100;
  const e = parseFloat(entry), s = parseFloat(sl), lc = parseFloat(lotCost);
  if (isNaN(b) || isNaN(r) || isNaN(e) || isNaN(s) || isNaN(lc) || lc === 0) return null;
  const riskMoney = b * r;
  const priceDiff = Math.abs(e - s);
  return (riskMoney / (priceDiff * lc)).toFixed(2);
}

// ---- DIRECTION ----
function getDirection(entry, sl) {
  const e = parseFloat(entry), s = parseFloat(sl);
  if (isNaN(e) || isNaN(s)) return null;
  return e > s ? 'Long' : 'Short';
}

// ---- NUMBER FORMAT ----
function fmt(n, dec = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ---- TABLE RENDER ----
function renderTable(headers, rows, container) {
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="loading">Нет данных</div>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'data-table';
  
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = headers.map(h => {
      const val = row[h] !== undefined ? row[h] : '';
      const cls = h === 'PnL' ? (parseFloat(val) >= 0 ? 'pnl-positive' : 'pnl-negative') : '';
      return `<td class="${cls}">${val}</td>`;
    }).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'data-table-wrap';
  wrap.appendChild(table);
  container.appendChild(wrap);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
});
