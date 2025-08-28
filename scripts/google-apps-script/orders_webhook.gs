// Google Apps Script: Orders Webhook -> Google Sheet
// 1) Create a Google Sheet and get its ID from the URL
// 2) Paste this script into Apps Script (Extensions > Apps Script)
// 3) Set the SHEET_ID and SHEET_NAME below
// 4) Deploy > New deployment > Web app: execute as Me, Who has access: Anyone
// 5) Put the Web app URL into your app as ORDERS_WEBHOOK_URL

var SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE';
var SHEET_NAME = 'Orders';

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  ensureHeader_(sheet);
  return sheet;
}

function ensureHeader_(sheet) {
  var header = [
    'order_id',
    'timestamp',
    'server_timestamp',
  'telegram_user_id',
    'customer_name',
    'customer_phone',
    'customer_email',
    'language',
    'delivery_method',
    'address_street',
    'address_number',
    'address_pincode',
    'address_city',
  'items_count',
  'item_id',
  'item_name',
  'item_price',
  'quantity',
  'notes',
    'total',
    'status',
    'review'
  ];
  var existing = sheet.getRange(1, 1, 1, Math.max(header.length, sheet.getLastColumn() || header.length)).getValues()[0];
  var needsUpdate = false;
  if (!existing || existing.length === 0) {
    needsUpdate = true;
  } else {
    // If length differs or any label mismatches at the same position, update
    if (existing.length !== header.length) needsUpdate = true;
    for (var i = 0; i < header.length && !needsUpdate; i++) {
      if (String(existing[i] || '') !== header[i]) needsUpdate = true;
    }
  }
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

function generateOrderId_() {
  // Format: DDMMNN (e.g., 190801, 190802), NN is daily sequence starting at 01
  var now = new Date();
  var dd = ('0' + now.getDate()).slice(-2);
  var mm = ('0' + (now.getMonth() + 1)).slice(-2);
  var dayKey = dd + mm;

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var props = PropertiesService.getScriptProperties();
    var key = 'seq_' + dayKey;
    var current = Number(props.getProperty(key) || '0');
    var next = current + 1;
    props.setProperty(key, String(next));
    var seq = ('0' + next).slice(-2); // 01..99
    return dayKey + seq;
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return json_(200, []);
    }

    var header = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.length === 0) continue;
      var obj = {};
      for (var c = 0; c < header.length; c++) {
        obj[String(header[c] || '')] = row[c];
      }
      rows.push(obj);
    }

    var q = (e && e.parameter) || {};
    var userId = q.telegramUserId || q.userId || '';
    if (userId) {
      rows = rows.filter(function (r) { return String(r['telegram_user_id'] || '') === String(userId); });
    }

    return json_(200, rows);
  } catch (err) {
    return json_(500, { ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_(400, { ok: false, error: 'No body' });
    }

    var contentType = (e.postData.type || '').toLowerCase();
    var body = e.postData.contents;
    var data;

    if (contentType.indexOf('application/json') !== -1) {
      data = JSON.parse(body);
    } else if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
      var params = e.parameter || {};
      data = JSON.parse(params.payload || body);
    } else {
      data = JSON.parse(body); // best-effort
    }

    // Payload shape expected:
    // {
    //   items: [{ id, name, price, quantity }],
    //   delivery: { method: 'pickup'|'delivery', address?: { street, number, pincode, city } },
  //   customer: { name, phone, email, language },
  //   telegramUserId,
    //   notes, total, timestamp
    // }

    var items = data.items || [];
  var customer = data.customer || {};
    var delivery = data.delivery || {};
    var address = delivery.address || {};
  var telegramUserId = data.telegramUserId || '';

    var itemsCount = items.reduce(function (sum, it) { return sum + (Number(it.quantity) || 0); }, 0);

  var sheet = getSheet_();
  var orderId = generateOrderId_();
    var serverTs = new Date();

    // Build rows: one row per item, same orderId
    var rows = [];
    if (items.length === 0) {
      rows.push([
        orderId,
        data.timestamp || new Date().toISOString(),
        serverTs,
        telegramUserId,
        customer.name || '',
        customer.phone || '',
        customer.email || '',
        customer.language || '',
        delivery.method || '',
        address.street || '',
        address.number || '',
        address.pincode || '',
        address.city || '',
        itemsCount,
        '',
        '',
        0,
        0,
        data.notes || '',
        Number(data.total) || 0,
        'new',
        ''
      ]);
    } else {
      for (var i = 0; i < items.length; i++) {
        var it = items[i] || {};
        var itemName = (typeof it.name === 'string') ? it.name : (it.name && it.name['en']) || '';
        rows.push([
          orderId,
          data.timestamp || new Date().toISOString(),
          serverTs,
          telegramUserId,
          customer.name || '',
          customer.phone || '',
          customer.email || '',
          customer.language || '',
          delivery.method || '',
          address.street || '',
          address.number || '',
          address.pincode || '',
          address.city || '',
          itemsCount,
          it.id || '',
          itemName,
          Number(it.price) || 0,
          Number(it.quantity) || 0,
          data.notes || '',
          Number(data.total) || 0,
          'new',
          ''
        ]);
      }
    }

    // Append all rows
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

    return json_(200, { ok: true, orderId: orderId });
  } catch (err) {
    return json_(500, { ok: false, error: String(err && err.message || err) });
  }
}

function json_(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
