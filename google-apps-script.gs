/**
 * MESOGI ↔ Google Sheets bridge.
 * Deploy this file as a Google Apps Script Web App.
 * Set Script Properties: CATALOG_SPREADSHEET_ID and SYNC_TOKEN.
 */
const MATERIALS_SHEET = 'Материалы';

function doGet(e) {
  const request = e && e.parameter ? e.parameter : {};
  authorize_(request.token);
  if (request.action !== 'materials') return json_({ error: 'Unknown action' });

  const sheet = materialsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[2];
  const materials = values.slice(3)
    .filter(row => row[0] && row[1])
    .map(row => ({
      id: String(row[0]), name: String(row[1]), category: String(row[2] || 'Прочие материалы'),
      packaging: String(row[3] || ''), packQuantity: number_(row[4]), unit: String(row[5] || 'шт'),
      priceExVat: number_(row[6]), vat: number_(row[7]), priceIncVat: number_(row[8]),
      unitPriceIncVat: number_(row[9]), consumption: number_(row[10]), consumptionUnit: String(row[11] || ''),
      supplier: String(row[12] || ''), note: String(row[13] || '')
    }));
  return json_({ updatedAt: new Date().toISOString(), headers: headers, materials: materials });
}

function doPost(e) {
  const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  authorize_(request.token);
  if (request.action !== 'upsertMaterial' || !request.material) return json_({ error: 'Unknown action' });

  const sheet = materialsSheet_();
  const material = request.material;
  const id = material.id || nextId_(sheet);
  const last = Math.max(sheet.getLastRow(), 3);
  const ids = sheet.getRange(4, 1, Math.max(1, last - 3), 1).getValues().flat();
  const match = ids.findIndex(value => String(value) === String(id));
  const row = match >= 0 ? match + 4 : last + 1;

  sheet.getRange(row, 1, 1, 14).setValues([[
    id, material.name || '', material.category || 'Прочие материалы', material.packaging || '',
    number_(material.packQuantity), material.unit || 'шт', number_(material.priceExVat), number_(material.vat),
    '', '', number_(material.consumption), material.consumptionUnit || '', material.supplier || '', material.note || ''
  ]]);
  sheet.getRange(row, 9).setFormula(`=G${row}*(1+H${row})`);
  sheet.getRange(row, 10).setFormula(`=IFERROR(I${row}/E${row},0)`);
  return json_({ ok: true, id: id, row: row });
}

function materialsSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('CATALOG_SPREADSHEET_ID');
  if (!id) throw new Error('Set CATALOG_SPREADSHEET_ID in Script Properties');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(MATERIALS_SHEET);
  if (!sheet) throw new Error(`Sheet not found: ${MATERIALS_SHEET}`);
  return sheet;
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
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
