// ============================================================
// GOOGLE APPS SCRIPT - Trading Journal Backend
// Deploy as Web App: Execute as Me, Access: Anyone
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    const params = e.parameter || {};
    const action = params.action;
    let result;

    switch (action) {
      case 'append':
        result = appendRowToSheet(params.sheet, JSON.parse(params.data));
        break;
      case 'getRows':
        result = getRowsFromSheet(params.sheet);
        break;
      case 'update':
        result = updateRowInSheet(params.sheet, parseInt(params.rowIndex), JSON.parse(params.data));
        break;
      case 'getTickers':
        result = getTickersData();
        break;
      case 'saveTicker':
        result = saveTickerData(params.ticker, parseFloat(params.lotCost));
        break;
      case 'getLastDailyBalances':
        result = getLastDailyBalances();
        break;
      case 'getLastDeals':
        result = getLastDeals(parseInt(params.count) || 3);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- APPEND ROW ----
function appendRowToSheet(sheetName, rowData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  
  sheet.appendRow(rowData);
  
  // Auto-format after append
  formatSheet(sheet, sheetName);
  
  // Sort by date descending (column A)
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    range.sort({ column: 1, ascending: false });
  }
  
  return { success: true, rowsCount: sheet.getLastRow() };
}

// ---- GET ROWS ----
function getRowsFromSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { headers: data[0] || [], rows: [] };
  
  return {
    headers: data[0],
    rows: data.slice(1).map((row, i) => ({ rowIndex: i + 2, data: row }))
  };
}

// ---- UPDATE ROW ----
function updateRowInSheet(sheetName, rowIndex, rowData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  
  const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
  range.setValues([rowData]);
  
  // Re-sort after update
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    const sortRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    sortRange.sort({ column: 1, ascending: false });
  }
  
  return { success: true };
}

// ---- GET TICKERS ----
function getTickersData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Tickers');
  if (!sheet) return { tickers: [] };
  
  const data = sheet.getDataRange().getValues();
  const tickers = data.slice(1)
    .filter(row => row[0])
    .map(row => ({ ticker: row[0], lotCost: row[1] }));
  
  return { tickers };
}

// ---- SAVE TICKER ----
function saveTickerData(ticker, lotCost) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Tickers');
  if (!sheet) return { error: 'Tickers sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  
  // Check if ticker exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ticker) {
      sheet.getRange(i + 1, 2).setValue(lotCost);
      sortTickersAlphabetically(sheet);
      return { success: true, updated: true };
    }
  }
  
  // Add new ticker
  sheet.appendRow([ticker, lotCost]);
  sortTickersAlphabetically(sheet);
  return { success: true, added: true };
}

function sortTickersAlphabetically(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    sheet.getRange(2, 1, lastRow - 1, 2).sort({ column: 1, ascending: true });
  }
}

// ---- GET LAST DAILY BALANCES ----
function getLastDailyBalances() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Daily');
  if (!sheet) return { balances: {} };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { balances: {} };
  
  const headers = data[0];
  const lastRow = data[1]; // Most recent (sorted descending)
  
  const balances = {};
  headers.forEach((h, i) => { if (lastRow[i] !== '') balances[h] = lastRow[i]; });
  
  return { balances, headers };
}

// ---- GET LAST DEALS ----
function getLastDeals(count) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Deals');
  if (!sheet) return { deals: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { deals: [] };
  
  const headers = data[0];
  const pnlCol = headers.indexOf('PnL');
  
  const deals = data.slice(1, count + 1).map(row => ({
    pnl: pnlCol >= 0 ? row[pnlCol] : '',
    data: row
  }));
  
  return { deals, headers };
}

// ---- FORMAT SHEET ----
function formatSheet(sheet, sheetName) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return;
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // All cells: top-left alignment
  sheet.getRange(2, 1, lastRow - 1, lastCol)
    .setVerticalAlignment('top')
    .setHorizontalAlignment('left');
  
  if (sheetName === 'Daily') {
    // Column A: date format
    sheet.getRange(2, 1, lastRow - 1, 1)
      .setNumberFormat('dd.mm.yyyy hh:mm');
    
    // Account balance columns: number format
    const accountCols = ['А Финам', 'С Финам', 'A Bybit', 'С Bybit', 'С Форекс', 'J2T'];
    headers.forEach((h, i) => {
      if (accountCols.includes(h)) {
        sheet.getRange(2, i + 1, lastRow - 1, 1).setNumberFormat('#,##0.00');
      } else if (i > 0) {
        sheet.getRange(2, i + 1, lastRow - 1, 1).setNumberFormat('@');
      }
    });
    
  } else if (sheetName === 'Backtests' || sheetName === 'Deals') {
    headers.forEach((h, i) => {
      const col = i + 1;
      const colName = h.toLowerCase();
      if (colName.includes('время') || colName.includes('time') || colName.includes('выход')) {
        sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
      } else if (['stop loss','entry','target','closed price','price','rr','lot size','lots','pnl'].includes(colName)) {
        sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('#,##0.####');
      } else {
        sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('@');
      }
    });
  }
}

// ---- CHECK DAILY EXISTS ----
function checkDailyExists(dateStr) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Daily');
  if (!sheet) return { exists: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), 'UTC', 'yyyy-MM-dd');
    if (rowDate === dateStr) {
      return { exists: true, rowIndex: i + 1, data: data[i] };
    }
  }
  return { exists: false };
}
