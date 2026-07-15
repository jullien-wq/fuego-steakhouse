/**************************************************************************
 * FUEGO STEAKHOUSE & BAR — Website form submissions -> Google Sheet + email
 * --------------------------------------------------------------------------
 * One spreadsheet, one tab per form type, plus an "All Submissions" master.
 * Runs as YOU, so email backup sends with no third-party activation step.
 *
 * Setup: see SETUP-Google-Sheet.txt. Short version:
 *   1) Sheets.google.com -> new blank sheet -> Extensions -> Apps Script
 *   2) Paste this whole file, Save.
 *   3) Run "testInsert" once and authorize.
 *   4) Deploy -> New deployment -> Web app -> Execute as: Me,
 *      Who has access: Anyone -> copy the /exec URL.
 *   5) Paste that URL into the site (app.js -> SHEET_ENDPOINT).
 **************************************************************************/

/* Where email notifications go. Add more addresses comma-separated. */
var NOTIFY_EMAIL = 'info@fuegosteakhouse.com';

/* Brand color for the header row. */
var BRAND = '#c89a52';

/* Base columns every tab starts with, in order. */
var BASE_COLS = ['Submitted', 'Form', 'Location', 'Form ID'];

/* ------------------------------------------------------------------ */
/* Web endpoint the website posts to.                                  */
/* ------------------------------------------------------------------ */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    var saved = handleSubmission(data);
    return json({ ok: true, row: saved.row });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* Simple GET so visiting the URL in a browser confirms it's live. */
function doGet() {
  return json({ ok: true, service: 'Fuego forms endpoint' });
}

/* ------------------------------------------------------------------ */
/* Core: write to master + per-form tab, then email.                   */
/* ------------------------------------------------------------------ */
function handleSubmission(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var formName = String(data.form || 'Other').trim() || 'Other';
  var when = data.submitted ? new Date(data.submitted) : new Date();
  var location = data.location || '';
  var formId = data.formId || '';

  // Fields = everything the visitor sent, minus the routing keys.
  var reserved = { form: 1, submitted: 1, location: 1, formId: 1 };
  var fields = {};
  Object.keys(data).forEach(function (k) {
    if (!reserved[k.toLowerCase ? k.toLowerCase() : k] && !reserved[k]) {
      if (k !== 'form' && k !== 'submitted' && k !== 'location' && k !== 'formId') {
        fields[prettyLabel(k)] = data[k];
      }
    }
  });

  var base = {
    'Submitted': Utilities.formatDate(when, ss.getSpreadsheetTimeZone() || 'America/New_York', 'yyyy-MM-dd HH:mm:ss'),
    'Form': formName,
    'Location': location,
    'Form ID': formId
  };

  writeRow(ss, 'All Submissions', base, fields);
  var res = writeRow(ss, formName, base, fields);

  sendEmail(formName, location, base, fields);
  sendConfirmation(formName, fields);
  return res;
}

/* Write one row to a named tab, adding columns as new fields appear.  */
function writeRow(ss, tabName, base, fields) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(BASE_COLS.slice());
    styleHeader(sheet);
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Ensure a column exists for every incoming field.
  Object.keys(fields).forEach(function (label) {
    if (headers.indexOf(label) === -1) {
      headers.push(label);
      sheet.getRange(1, headers.length).setValue(label);
    }
  });
  styleHeader(sheet);

  // Build the row aligned to header order.
  var all = {};
  Object.keys(base).forEach(function (k) { all[k] = base[k]; });
  Object.keys(fields).forEach(function (k) { all[k] = fields[k]; });

  var row = headers.map(function (h) { return all[h] !== undefined ? all[h] : ''; });

  // Newest on top (insert at row 2, just under header).
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, row.length).setValues([row]);
  return { row: 2, tab: tabName };
}

function styleHeader(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var h = sheet.getRange(1, 1, 1, lastCol);
  h.setBackground(BRAND).setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function sendEmail(formName, location, base, fields) {
  if (!NOTIFY_EMAIL) return;
  var subject = 'New ' + formName + ' — Fuego Steakhouse' + (location ? ' (' + location + ')' : '');
  var lines = [];
  lines.push(formName + ' submission');
  if (location) lines.push('Location: ' + location);
  lines.push('Submitted: ' + base['Submitted']);
  lines.push('');
  Object.keys(fields).forEach(function (k) {
    lines.push(k + ': ' + fields[k]);
  });
  var body = lines.join('\n');
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1207">' +
    '<h2 style="color:' + BRAND + ';margin:0 0 10px">New ' + escapeHtml(formName) + ' request</h2>' +
    (location ? '<p style="margin:0 0 4px"><b>Location:</b> ' + escapeHtml(location) + '</p>' : '') +
    '<p style="margin:0 0 12px"><b>Submitted:</b> ' + escapeHtml(base['Submitted']) + '</p>' +
    '<table cellpadding="6" style="border-collapse:collapse">' +
    Object.keys(fields).map(function (k) {
      return '<tr><td style="border:1px solid #e0d8c8;background:#faf6ee"><b>' + escapeHtml(k) +
        '</b></td><td style="border:1px solid #e0d8c8">' + escapeHtml(String(fields[k])) + '</td></tr>';
    }).join('') +
    '</table></div>';
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body, htmlBody: html });
}

/* Auto-reply confirmation to the person who submitted the form.        */
function sendConfirmation(formName, fields) {
  var to = fields['Email'];
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(to).trim())) return;
  var firstName = (String(fields['Full Name'] || '').trim().split(' ')[0]) || 'there';

  var COPY = {
    'Reservations': { subject: 'We received your reservation request — Fuego Steakhouse', line: "Thank you for your reservation request. Our team will confirm your table by phone or email shortly." },
    'Private Events': { subject: 'We received your event request — Fuego Steakhouse', line: "Thank you for your interest in hosting with us. Our events team will reach out shortly to plan your celebration." },
    'Contact': { subject: 'We received your message — Fuego Steakhouse', line: "Thank you for reaching out. A member of our team will get back to you shortly." },
    'Newsletter': { subject: "You're on the list — Fuego Steakhouse", line: "Thanks for subscribing! You'll be the first to hear about events, specials and more." }
  };
  var c = COPY[formName] || { subject: 'Thank you — Fuego Steakhouse', line: "Thank you for contacting us. We'll be in touch shortly." };

  var summaryRows = Object.keys(fields).map(function (k) {
    return '<tr><td style="border:1px solid #e0d8c8;background:#faf6ee"><b>' + escapeHtml(k) +
      '</b></td><td style="border:1px solid #e0d8c8">' + escapeHtml(String(fields[k])) + '</td></tr>';
  }).join('');

  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1207;max-width:560px">' +
    '<h2 style="color:' + BRAND + ';margin:0 0 6px">Thank you, ' + escapeHtml(firstName) + '.</h2>' +
    '<p style="margin:0 0 16px;line-height:1.6">' + escapeHtml(c.line) + '</p>' +
    (summaryRows ? '<p style="margin:0 0 8px;font-weight:bold;color:' + BRAND + '">Your details</p><table cellpadding="6" style="border-collapse:collapse;margin-bottom:18px">' + summaryRows + '</table>' : '') +
    '<p style="margin:0;line-height:1.6">Fuego Steakhouse &amp; Bar<br>921 John F. Kennedy Blvd, North Bergen, NJ 07047<br>(201) 724-4662</p>' +
    '</div>';
  var body = c.line + '\n\nFuego Steakhouse & Bar\n921 John F. Kennedy Blvd, North Bergen, NJ 07047\n(201) 724-4662';

  MailApp.sendEmail({ to: String(to).trim(), subject: c.subject, body: body, htmlBody: html, name: 'Fuego Steakhouse & Bar' });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function prettyLabel(key) {
  var map = {
    name: 'Full Name', email: 'Email', phone: 'Phone', date: 'Date',
    time: 'Time', party: 'Party Size', guests: 'Estimated Guests',
    message: 'Message', occasion: 'Occasion'
  };
  if (map[key]) return map[key];
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Run this once from the editor to authorize + verify logging works.  */
function testInsert() {
  handleSubmission({
    form: 'Reservations',
    location: 'North Bergen',
    formId: 'test',
    submitted: new Date().toISOString(),
    name: 'Test Guest',
    email: 'test@example.com',
    phone: '(201) 000-0000',
    date: '2026-08-01',
    time: '7:00 PM',
    party: '4'
  });
}
