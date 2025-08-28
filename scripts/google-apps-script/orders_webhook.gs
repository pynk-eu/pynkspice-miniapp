// Google Apps Script: Orders Webhook -> Google Sheet
// 1) Create a Google Sheet and get its ID from the URL
// 2) Paste this script into Apps Script (Extensions > Apps Script)
// 3) Set the SHEET_ID and SHEET_NAME below
// 4) Deploy > New deployment > Web app: execute as Me, Who has access: Anyone
// 5) Put the Web app URL into your app as ORDERS_WEBHOOK_URL

var SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE';
var SHEET_NAME = 'Orders';
var USERS_SHEET_NAME = 'Users';

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  ensureHeader_(sheet);
  return sheet;
}

function getUsersSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(USERS_SHEET_NAME) || ss.insertSheet(USERS_SHEET_NAME);
  ensureUsersHeader_(sheet);
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

function ensureUsersHeader_(sheet) {
  var header = [
    'telegram_user_id',
    'telegram_username',
    'telegram_first_name',
    'telegram_last_name',
    'customer_name',
    'customer_phone',
    'customer_email',
    'language',
    'orders_count',
    'last_order_id',
    'last_order_timestamp',
    'created_at',
    'updated_at'
  ];
  var existing = sheet.getRange(1, 1, 1, Math.max(header.length, sheet.getLastColumn() || header.length)).getValues()[0];
  var needsUpdate = false;
  if (!existing || existing.length === 0) needsUpdate = true; else if (existing.length !== header.length) needsUpdate = true; else {
    for (var i = 0; i < header.length; i++) if (String(existing[i] || '') !== header[i]) { needsUpdate = true; break; }
  }
  if (needsUpdate) sheet.getRange(1, 1, 1, header.length).setValues([header]);
}

function upsertUserProfile_(profile) {
  if (!profile || !profile.telegram_user_id) return;
  var sheet = getUsersSheet_();
  var data = sheet.getDataRange().getValues();
  var header = data[0] || [];
  var idCol = header.indexOf('telegram_user_id');
  var countCol = header.indexOf('orders_count');
  var lastOrderIdCol = header.indexOf('last_order_id');
  var lastOrderTsCol = header.indexOf('last_order_timestamp');
  var createdAtCol = header.indexOf('created_at');
  var updatedAtCol = header.indexOf('updated_at');
  var rowIndex = -1;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(profile.telegram_user_id)) { rowIndex = r; break; }
  }
  var now = new Date();
  if (rowIndex === -1) {
    sheet.appendRow([
      profile.telegram_user_id,
      profile.telegram_username || '',
      profile.telegram_first_name || '',
      profile.telegram_last_name || '',
      profile.customer_name || '',
      profile.customer_phone || '',
      profile.customer_email || '',
      profile.language || '',
      1,
      profile.last_order_id || '',
      profile.last_order_timestamp || '',
      now,
      now
    ]);
  } else {
    var rng = sheet.getRange(rowIndex + 1, 1, 1, header.length);
    var values = rng.getValues()[0];
    if (header.indexOf('telegram_username') !== -1 && profile.telegram_username) values[header.indexOf('telegram_username')] = profile.telegram_username;
    if (header.indexOf('telegram_first_name') !== -1 && profile.telegram_first_name) values[header.indexOf('telegram_first_name')] = profile.telegram_first_name;
    if (header.indexOf('telegram_last_name') !== -1 && profile.telegram_last_name) values[header.indexOf('telegram_last_name')] = profile.telegram_last_name;
    if (header.indexOf('customer_name') !== -1 && profile.customer_name) values[header.indexOf('customer_name')] = profile.customer_name;
    if (header.indexOf('customer_phone') !== -1 && profile.customer_phone) values[header.indexOf('customer_phone')] = profile.customer_phone;
    if (header.indexOf('customer_email') !== -1 && profile.customer_email) values[header.indexOf('customer_email')] = profile.customer_email;
    if (header.indexOf('language') !== -1 && profile.language) values[header.indexOf('language')] = profile.language;
    if (countCol !== -1) values[countCol] = Number(values[countCol] || 0) + 1;
    if (lastOrderIdCol !== -1 && profile.last_order_id) values[lastOrderIdCol] = profile.last_order_id;
    if (lastOrderTsCol !== -1 && profile.last_order_timestamp) values[lastOrderTsCol] = profile.last_order_timestamp;
    if (updatedAtCol !== -1) values[updatedAtCol] = now;
    rng.setValues([values]);
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
    var q = (e && e.parameter) || {};
    if (q.userProfile == '1' || q.userProfile === 'true') {
      var uSheet = getUsersSheet_();
      var uData = uSheet.getDataRange().getValues();
      if (!uData || uData.length < 2) return json_(200, { ok: true, user: null });
      var uHeader = uData[0];
      var uid = q.telegramUserId || q.userId || '';
      for (var r = 1; r < uData.length; r++) {
        if (String(uData[r][0]) === String(uid)) {
          var obj = {};
          for (var c = 0; c < uHeader.length; c++) obj[String(uHeader[c] || '')] = uData[r][c];
          return json_(200, { ok: true, user: obj });
        }
      }
      return json_(200, { ok: true, user: null });
    }

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
    var userId = q.telegramUserId || q.userId || '';
    if (userId) rows = rows.filter(function (r) { return String(r['telegram_user_id'] || '') === String(userId); });
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

  // Payload shapes:
  // 1) Registration: { action: 'registerUser', telegramUserId, telegramUsername, telegramFirstName, telegramLastName, customer?: { name, phone, email, language } }
  // 2) Order: {
  //      items: [{ id, name, price, quantity }],
  //      delivery: { method: 'pickup'|'delivery', address?: { street, number, pincode, city } },
  //      customer: { name, phone, email, language },
  //      telegramUserId,
  //      notes, total, timestamp
  //    }

    // Registration path
    if (data.action === 'registerUser') {
      upsertUserProfile_({
        telegram_user_id: data.telegramUserId || '',
        telegram_username: data.telegramUsername || '',
        telegram_first_name: data.telegramFirstName || '',
        telegram_last_name: data.telegramLastName || '',
        customer_name: (data.customer && data.customer.name) || '',
        customer_phone: (data.customer && data.customer.phone) || '',
        customer_email: (data.customer && data.customer.email) || '',
        language: (data.customer && data.customer.language) || ''
      });
      return json_(200, { ok: true, registered: true });
    }

    var items = data.items || [];
    var customer = data.customer || {};
    var delivery = data.delivery || {};
    var address = delivery.address || {};
    var telegramUserId = data.telegramUserId || '';
    var telegramUsername = data.telegramUsername || '';
    var telegramFirstName = data.telegramFirstName || '';
    var telegramLastName = data.telegramLastName || '';

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
  '', // customer_name now stored in Users sheet
  '', // customer_phone now stored in Users sheet
  '', // customer_email now stored in Users sheet
  '', // language now stored in Users sheet
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
          '',
          '',
          '',
          '',
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

    // Upsert user profile after writing order rows
    upsertUserProfile_({
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername,
      telegram_first_name: telegramFirstName,
      telegram_last_name: telegramLastName,
      customer_name: customer.name || '',
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      language: customer.language || '',
      last_order_id: orderId,
      last_order_timestamp: data.timestamp || new Date().toISOString()
    });

    return json_(200, { ok: true, orderId: orderId });
  } catch (err) {
    return json_(500, { ok: false, error: String(err && err.message || err) });
  }
}

function json_(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
