// Google Apps Script: Orders Webhook -> Google Sheet
// 1) Create a Google Sheet and get its ID from the URL
// 2) Paste this script into Apps Script (Extensions > Apps Script)
// 3) Set the SHEET_ID and SHEET_NAME below
// 4) Deploy > New deployment > Web app: execute as Me, Who has access: Anyone
// 5) Put the Web app URL into your app as ORDERS_WEBHOOK_URL

const SHEET_ID = '1o0sW7opX9BRf9PY9rYqPPhIbu3ABsL6LTIabV4kGNJg';
const SHEET_NAME = 'Orders';
const USERS_SHEET_NAME = 'Users';

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  ensureHeader_(sheet);
  return sheet;
}

function getUsersSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(USERS_SHEET_NAME) || ss.insertSheet(USERS_SHEET_NAME);
  ensureUsersHeader_(sheet);
  return sheet;
}

function ensureHeader_(sheet) {
  const header = [
    'order_id',
    'timestamp',
    'server_timestamp',
    'user_id',
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
  const existing = sheet.getRange(1, 1, 1, Math.max(header.length, sheet.getLastColumn() || header.length)).getValues()[0];
  let needsUpdate = false;
  if (!existing || existing.length === 0) {
    needsUpdate = true;
  } else {
    // If length differs or any label mismatches at the same position, update
    if (existing.length !== header.length) needsUpdate = true;
    for (let i = 0; i < header.length && !needsUpdate; i++) {
      if (String(existing[i] || '') !== header[i]) needsUpdate = true;
    }
  }
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

function ensureUsersHeader_(sheet) {
  const header = [
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
  const existing = sheet.getRange(1, 1, 1, Math.max(header.length, sheet.getLastColumn() || header.length)).getValues()[0];
  let needsUpdate = false;
  if (!existing || existing.length === 0) needsUpdate = true; else if (existing.length !== header.length) needsUpdate = true; else {
    for (let i = 0; i < header.length; i++) if (String(existing[i] || '') !== header[i]) { needsUpdate = true; break; }
  }
  if (needsUpdate) sheet.getRange(1, 1, 1, header.length).setValues([header]);
}

function upsertUserProfile_(profile) {
  if (!profile || !profile.telegram_user_id) return;
  const sheet = getUsersSheet_();
  const data = sheet.getDataRange().getValues();
  const header = data[0] || [];
  const idCol = header.indexOf('telegram_user_id');
  const countCol = header.indexOf('orders_count');
  const lastOrderIdCol = header.indexOf('last_order_id');
  const lastOrderTsCol = header.indexOf('last_order_timestamp');
  const createdAtCol = header.indexOf('created_at');
  const updatedAtCol = header.indexOf('updated_at');
  let rowIndex = -1;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(profile.telegram_user_id)) { rowIndex = r; break; }
  }
  const now = new Date();
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
    const rng = sheet.getRange(rowIndex + 1, 1, 1, header.length);
    const values = rng.getValues()[0];
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
  const now = new Date();
  const dd = ('0' + now.getDate()).slice(-2);
  const mm = ('0' + (now.getMonth() + 1)).slice(-2);
  const dayKey = dd + mm;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'seq_' + dayKey;
    const current = Number(props.getProperty(key) || '0');
    const next = current + 1;
    props.setProperty(key, String(next));
    const seq = ('0' + next).slice(-2); // 01..99
    return dayKey + seq;
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const q = (e && e.parameter) || {};
    if (q.userProfile == '1' || q.userProfile === 'true') {
      const uSheet = getUsersSheet_();
      const uData = uSheet.getDataRange().getValues();
      if (!uData || uData.length < 2) return json_(200, { ok: true, user: null });
      const uHeader = uData[0];
      const uid = q.telegramUserId || q.userId || '';
      for (let r = 1; r < uData.length; r++) {
        if (String(uData[r][0]) === String(uid)) {
          const obj = {};
          for (let c = 0; c < uHeader.length; c++) obj[String(uHeader[c] || '')] = uData[r][c];
          return json_(200, { ok: true, user: obj });
        }
      }
      return json_(200, { ok: true, user: null });
    }

    const sheet = getSheet_();
    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return json_(200, []);
    }
    const header = data[0];
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.length === 0) continue;
      var obj = {};
      for (let c = 0; c < header.length; c++) {
        obj[String(header[c] || '')] = row[c];
      }
      rows.push(obj);
    }
    const userId = q.telegramUserId || q.userId || '';
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

    const contentType = (e.postData.type || '').toLowerCase();
    const body = e.postData.contents;
    let data;

    if (contentType.indexOf('application/json') !== -1) {
      data = JSON.parse(body);
    } else if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
      const params = e.parameter || {};
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

    const items = data.items || [];
    const customer = data.customer || {};
    const delivery = data.delivery || {};
    const address = delivery.address || {};
    const telegramUserId = data.telegramUserId || '';
    const telegramUsername = data.telegramUsername || '';
    const telegramFirstName = data.telegramFirstName || '';
    const telegramLastName = data.telegramLastName || '';

    const itemsCount = items.reduce(function (sum, it) { return sum + (Number(it.quantity) || 0); }, 0);

    const sheet = getSheet_();
    const orderId = generateOrderId_();
    const serverTs = new Date();

    // Build rows: one row per item, same orderId
    const rows = [];
    if (items.length === 0) {
      rows.push([
        orderId,
        data.timestamp || new Date().toISOString(),
        serverTs,
        telegramUserId,
        // customer_name now stored in Users sheet
        // customer_phone now stored in Users sheet
        // customer_email now stored in Users sheet
        // language now stored in Users sheet
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
      for (let i = 0; i < items.length; i++) {
        const it = items[i] || {};
        const itemName = (typeof it.name === 'string') ? it.name : (it.name && it.name['en']) || '';
        rows.push([
          orderId,
          data.timestamp || new Date().toISOString(),
          serverTs,
          telegramUserId,
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
    const lastRow = sheet.getLastRow();
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
