/**
 * The Co.LLab™ mail relay (Google Apps Script web app).
 *
 * The website posts a message to this script. The script looks up a pre-written
 * template in a Google Doc (listed in your "Templates" sheet), fills in the
 * {{placeholders}}, sends it from your Gmail, and logs it in an "Email Log" sheet.
 * If no template matches, it sends the plain text the website supplied.
 *
 * Setup: docs/google-apps-script/README.md
 * Script properties (Project Settings -> Script properties):
 *   SECRET          a long random string; the website sends the same one (MAIL_WEBHOOK_SECRET)
 *   SPREADSHEET_ID  the id of the spreadsheet with the "Templates" and "Email Log" tabs
 *   FROM_NAME       optional, default "The Co.LLab™"
 */

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond_({ ok: false, error: 'bad request' });
  }
  if (!body.secret || body.secret !== props.getProperty('SECRET')) {
    return respond_({ ok: false, error: 'unauthorized' });
  }
  var to = String(body.to || '').trim();
  if (!EMAIL_RE.test(to)) return respond_({ ok: false, error: 'bad recipient' });

  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  var status = 'sent';
  var error = '';
  var subject = String(body.subject || '');
  var text = String(body.text || '');
  var html = body.html || null;
  var usedTemplate = '';

  try {
    var tpl = findTemplate_(ss, body.template);
    if (tpl) {
      var doc = DocumentApp.openById(tpl.docId);
      text = fill_(doc.getBody().getText(), body.vars);
      subject = fill_(tpl.subject || subject, body.vars);
      html = toHtml_(text);
      usedTemplate = tpl.key;
    }
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('daily email quota used up');
    var options = { name: props.getProperty('FROM_NAME') || 'The Co.LLab™' };
    if (html) options.htmlBody = html;
    if (body.replyTo && EMAIL_RE.test(body.replyTo)) options.replyTo = body.replyTo;
    GmailApp.sendEmail(to, subject, text, options);
  } catch (err) {
    status = 'failed';
    error = String(err && err.message ? err.message : err);
  }

  log_(ss, [new Date(), to, body.template || '', usedTemplate, subject, status, error]);
  return respond_({ ok: status === 'sent', error: error || undefined });
}

function findTemplate_(ss, key) {
  if (!key) return null;
  var sheet = ss.getSheetByName('Templates');
  if (!sheet) return null;
  var rows = sheet.getDataRange().getValues(); // header: key | docId | subject | enabled
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key && String(rows[i][3]).toLowerCase() !== 'no' && rows[i][1]) {
      return { key: key, docId: String(rows[i][1]).trim(), subject: String(rows[i][2] || '') };
    }
  }
  return null;
}

function fill_(template, vars) {
  vars = vars || {};
  return String(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, name) {
    return vars[name] === undefined || vars[name] === null ? '' : String(vars[name]);
  });
}

function toHtml_(text) {
  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var paras = esc(text).split(/\n{2,}/).map(function (p) {
    p = p.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, '<br>');
    return '<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#17301d;">' + p + '</p>';
  });
  return '<div style="max-width:560px;">' + paras.join('') + '</div>';
}

function log_(ss, row) {
  var sheet = ss.getSheetByName('Email Log') || ss.insertSheet('Email Log');
  if (sheet.getLastRow() === 0) sheet.appendRow(['time', 'to', 'template asked', 'template used', 'subject', 'status', 'error']);
  sheet.appendRow(row);
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
