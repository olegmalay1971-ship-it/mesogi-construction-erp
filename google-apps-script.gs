/**
 * MESOGI ↔ Google Sheets bridge.
 * Deploy this file as a Google Apps Script Web App.
 * Set Script Properties: CATALOG_SPREADSHEET_ID and SYNC_TOKEN.
 */
const MATERIALS_SHEET = 'Материалы';
const WORK_LOG_SHEET = 'Журнал работ';
const WORKS_SHEET = 'Работы';
const ESTIMATES_SHEET = 'Сметы';
const ESTIMATE_LINES_SHEET = 'Строки смет';

function doGet(e) {
  const request = e && e.parameter ? e.parameter : {};
  authorize_(request.token);
  if (request.action === 'upsertMaterial') {
    const material = JSON.parse(request.material || '{}');
    return upsertMaterial_(material, request.callback);
  }
  if (request.action === 'upsertWork') {
    const work = JSON.parse(request.work || '{}');
    return upsertWork_(work, request.callback);
  }
  if (request.action === 'works') return json_({ works: readWorks_() }, request.callback);
  if (request.action === 'workLog') {
    const sheet = workLogSheet_();
    const values = sheet.getDataRange().getValues();
    const entries = values.slice(1).filter(row => row[0]).map(row => ({
      id: String(row[0]), date: String(row[1] || ''), object: String(row[2] || ''),
      worker: String(row[3] || ''), work: String(row[4] || ''), hours: number_(row[5]),
      status: String(row[6] || ''), note: String(row[7] || '')
    }));
    return json_({ updatedAt: new Date().toISOString(), entries: entries }, request.callback);
  }
  if (request.action !== 'materials') return json_({ error: 'Unknown action' }, request.callback);

  const sheet = materialsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[2];
  const materials = values.slice(3)
    .map((row, index) => {
      if (!row[1]) return null;
      if (!row[0]) {
        row[0] = nextId_(sheet);
        sheet.getRange(index + 4, 1).setValue(row[0]);
      }
      return ({
      id: String(row[0]), name: String(row[1]), category: String(row[2] || 'Прочие материалы'),
      packaging: String(row[3] || ''), packQuantity: number_(row[4]), unit: String(row[5] || 'шт'),
      priceExVat: round2_(row[6]), vat: number_(row[7]), priceIncVat: round2_(row[8]),
      unitPriceIncVat: round2_(row[9]), consumption: number_(row[10]), consumptionUnit: String(row[11] || ''),
      supplier: String(row[12] || ''), note: String(row[13] || '')
      });
    })
    .filter(Boolean);
  return json_({ updatedAt: new Date().toISOString(), headers: headers, materials: materials }, request.callback);
}

function doPost(e) {
  const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  authorize_(request.token);
  if (request.action === 'upsertEstimate' && request.estimate) return upsertEstimate_(request.estimate, request.estimateSheetId);
  if (request.action === 'upsertWorkLog' && request.entry) return upsertWorkLog_(request.entry);
  if (request.action === 'upsertWork' && request.work) return upsertWork_(request.work);
  if (request.action !== 'upsertMaterial' || !request.material) return json_({ error: 'Unknown action' });
  return upsertMaterial_(request.material);
}

function estimatesSpreadsheet_(requestedId) {
  const id = String(requestedId || PropertiesService.getScriptProperties().getProperty('ESTIMATES_SPREADSHEET_ID') || '').trim();
  if (!id) throw new Error('Set estimate spreadsheet ID in application Settings');
  return SpreadsheetApp.openById(id);
}

function ensureEstimateSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertEstimate_(estimate, requestedId) {
  const spreadsheet = estimatesSpreadsheet_(requestedId);
  const summary = ensureEstimateSheet_(spreadsheet, ESTIMATES_SHEET, [
    'ID', 'Номер сметы', 'Объект', 'Клиент', 'Адрес', 'Статус', 'Маржа по умолчанию, %',
    'Работы клиенту', 'Материалы клиенту', 'Итого клиенту', 'НДС', 'Прибыль', 'Создано', 'Обновлено', 'Снимок JSON'
  ]);
  const lines = ensureEstimateSheet_(spreadsheet, ESTIMATE_LINES_SHEET, [
    'ID строки', 'ID сметы', 'Раздел', 'Работа', 'Ед.', 'Количество', 'Себестоимость / ед.', 'Маржа, %',
    'Цена клиенту / ед.', 'Материалы JSON', 'Комментарий', 'Обновлено'
  ]);
  const id = String(estimate.id || estimate.estimateNo || `EST-${Date.now()}`);
  const project = estimate.project || {};
  const totals = estimate.totals || {};
  const now = new Date().toISOString();
  const last = Math.max(summary.getLastRow(), 1);
  const ids = last > 1 ? summary.getRange(2, 1, last - 1, 1).getValues().flat() : [];
  const match = ids.findIndex(value => String(value) === id);
  const row = match >= 0 ? match + 2 : last + 1;
  const created = match >= 0 ? summary.getRange(row, 13).getValue() : now;
  summary.getRange(row, 1, 1, 15).setValues([[
    id, estimate.estimateNo || id, project.name || '', project.client || '', project.address || '', 'Черновик',
    number_(project.defaultMargin), round2_(totals.work), round2_(totals.materials), round2_(totals.total),
    round2_(totals.vat), round2_(totals.profit), created || now, now, JSON.stringify(estimate)
  ]]);

  const lineLast = lines.getLastRow();
  if (lineLast > 1) {
    const existing = lines.getRange(2, 1, lineLast - 1, 2).getValues();
    for (let i = existing.length - 1; i >= 0; i--) if (String(existing[i][1]) === id) lines.deleteRow(i + 2);
  }
  const rows = [];
  (estimate.sections || []).forEach(section => (section.works || []).forEach(work => rows.push([
    `${id}:${work.id || Utilities.getUuid()}`, id, section.name || '', work.name || '', work.unit || '', number_(work.qty),
    number_(work.workCost), number_(work.workMargin), number_(work.workSell), JSON.stringify(work.materials || []), work.comment || '', now
  ])));
  if (rows.length) lines.getRange(lines.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  return json_({ ok: true, id: id });
}

function upsertMaterial_(material, callback) {
  const sheet = materialsSheet_();
  const suppliedId = String(material.id || '');
  const id = /^MAT-\d+$/.test(suppliedId) ? suppliedId : nextId_(sheet);
  const last = Math.max(sheet.getLastRow(), 3);
  const ids = sheet.getRange(4, 1, Math.max(1, last - 3), 1).getValues().flat();
  const match = ids.findIndex(value => String(value) === String(id));
  const row = match >= 0 ? match + 4 : last + 1;

  sheet.getRange(row, 1, 1, 14).setValues([[
    id, material.name || '', material.category || 'Прочие материалы', material.packaging || '',
    number_(material.packQuantity), material.unit || 'шт', number_(material.priceExVat), number_(material.vat),
    '', '', number_(material.consumption), material.consumptionUnit || '', material.supplier || '', material.note || ''
  ]]);
  sheet.getRange(row, 9).setFormula(`=ROUND(G${row}*(1+H${row}),2)`);
  sheet.getRange(row, 10).setFormula(`=IFERROR(ROUND(I${row}/E${row},2),0)`);
  return json_({ ok: true, id: id, row: row }, callback);
}

function materialsSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('CATALOG_SPREADSHEET_ID');
  if (!id) throw new Error('Set CATALOG_SPREADSHEET_ID in Script Properties');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(MATERIALS_SHEET);
  if (!sheet) throw new Error(`Sheet not found: ${MATERIALS_SHEET}`);
  return sheet;
}

function workLogSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('CATALOG_SPREADSHEET_ID');
  if (!id) throw new Error('Set CATALOG_SPREADSHEET_ID in Script Properties');
  const spreadsheet = SpreadsheetApp.openById(id);
  let sheet = spreadsheet.getSheetByName(WORK_LOG_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(WORK_LOG_SHEET);
    sheet.getRange(1, 1, 1, 8).setValues([['ID', 'Дата', 'Объект', 'Сотрудник', 'Работа', 'Часы', 'Статус', 'Комментарий']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function worksSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('WORKS_SPREADSHEET_ID');
  if (!id) throw new Error('Set WORKS_SPREADSHEET_ID in Script Properties');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(WORKS_SHEET);
  if (!sheet) throw new Error(`Sheet not found: ${WORKS_SHEET}`);
  return sheet;
}

function readWorks_() {
  const sheet = worksSheet_();
  const values = sheet.getDataRange().getValues();
  return values.slice(4).filter(row => row[2]).map(row => ({
    id: String(row[0] || nextWorkId_(sheet)), category: String(row[1] || 'Дополнительные работы'),
    name: String(row[2] || ''), unit: String(row[3] || 'м²'), cost: number_(row[4]),
    sell: number_(row[5]), active: String(row[7] || 'Да').toLowerCase() !== 'нет', note: String(row[8] || '')
  }));
}

function upsertWork_(work, callback) {
  const sheet = worksSheet_();
  const suppliedId = String(work.id || '');
  const id = /^W-\d+$/.test(suppliedId) ? suppliedId : nextWorkId_(sheet);
  const last = Math.max(sheet.getLastRow(), 4);
  const ids = sheet.getRange(5, 1, Math.max(1, last - 4), 1).getValues().flat();
  const match = ids.findIndex(value => String(value) === id);
  const row = match >= 0 ? match + 5 : last + 1;
  const cost = number_(work.cost), sell = number_(work.sell);
  sheet.getRange(row, 1, 1, 9).setValues([[id, work.category || 'Дополнительные работы', work.name || '', work.unit || 'м²', cost, sell, '', work.active === false ? 'Нет' : 'Да', work.note || '']]);
  sheet.getRange(row, 7).setFormula(`=IFERROR(ROUND((F${row}-E${row})/F${row},4),0)`);
  return json_({ ok: true, id: id, row: row }, callback);
}

function nextWorkId_(sheet) {
  const ids = sheet.getRange(5, 1, Math.max(1, sheet.getLastRow() - 4), 1).getValues().flat();
  const max = ids.reduce((result, id) => Math.max(result, Number(String(id).replace('W-', '')) || 0), 0);
  return `W-${String(max + 1).padStart(4, '0')}`;
}

function upsertWorkLog_(entry) {
  const sheet = workLogSheet_();
  const id = String(entry.id || `LOG-${new Date().getTime()}`);
  const last = Math.max(sheet.getLastRow(), 1);
  const ids = sheet.getRange(2, 1, Math.max(1, last - 1), 1).getValues().flat();
  const match = ids.findIndex(value => String(value) === id);
  const row = match >= 0 ? match + 2 : last + 1;
  sheet.getRange(row, 1, 1, 8).setValues([[
    id, entry.date || '', entry.object || '', entry.worker || '', entry.work || '',
    number_(entry.hours), entry.status || 'Выполнено', entry.note || ''
  ]]);
  return json_({ ok: true, id: id, row: row });
}

function authorize_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('SYNC_TOKEN');
  if (!expected || token !== expected) throw new Error('Unauthorized');
}

function nextId_(sheet) {
  const ids = sheet.getRange(4, 1, Math.max(1, sheet.getLastRow() - 3), 1).getValues().flat();
  const max = ids.reduce((result, id) => Math.max(result, Number(String(id).replace('MAT-', '')) || 0), 0);
  return `MAT-${String(max + 1).padStart(4, '0')}`;
}

function number_(value) { return Number(value) || 0; }
function round2_(value) { return Math.round(number_(value) * 100) / 100; }
function json_(value, callback) {
  if (callback) {
    const safeCallback = String(callback).replace(/[^A-Za-z0-9_$]/g, '');
    return ContentService.createTextOutput(`${safeCallback}(${JSON.stringify(value)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
