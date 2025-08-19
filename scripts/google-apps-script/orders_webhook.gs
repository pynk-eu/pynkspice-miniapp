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
    'items_summary',
    'items_json',
    'notes',
    'total'
  ];
  var range = sheet.getRange(1, 1, 1, header.length);
  var values = range.getValues();
  var firstRowEmpty = values[0].every(function (cell) { return cell === '';
  });
  if (firstRowEmpty) {
    range.setValues([header]);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
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
    //   notes, total, timestamp
    // }

    var items = data.items || [];
    var customer = data.customer || {};
    var delivery = data.delivery || {};
    var address = delivery.address || {};

    var itemsCount = items.reduce(function (sum, it) { return sum + (Number(it.quantity) || 0); }, 0);
    var itemsSummary = items.map(function (it) {
      var n = typeof it.name === 'string' ? it.name : (it.name && it.name['en']) || '';
      var price = Number(it.price) || 0;
      var qty = Number(it.quantity) || 0;
      return qty + 'x ' + n + ' (' + price.toFixed(2) + ')';
    }).join(', ');
    var itemsJson = JSON.stringify(items);

    var sheet = getSheet_();
    var orderId = Utilities.getUuid();
    var serverTs = new Date();

    var row = [
      orderId,
      data.timestamp || new Date().toISOString(),
      serverTs,
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
      itemsSummary,
      itemsJson,
      data.notes || '',
      Number(data.total) || 0
    ];

    sheet.appendRow(row);

    return json_(200, { ok: true, orderId: orderId });
  } catch (err) {
    return json_(500, { ok: false, error: String(err && err.message || err) });
  }
}

function json_(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
