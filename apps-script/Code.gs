/**
 * Ledger — Google Apps Script web app for writing to a sheet.
 *
 * SETUP (one-time):
 *   1. Open your Google Sheet (the public OR the real one — repeat for both).
 *   2. Extensions → Apps Script.
 *   3. Paste this file's contents into Code.gs, replacing whatever is there.
 *   4. Set WEBHOOK_SECRET below to a random string. Use the SAME value as
 *      VITE_SHEETS_WEBHOOK_SECRET in your .env.
 *   5. Click Deploy → New deployment → Type: Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *      Authorize when prompted. Copy the /exec URL.
 *   6. Paste the /exec URL into .env as VITE_PUBLIC_SHEETS_WEBHOOK
 *      (or VITE_REAL_SHEETS_WEBHOOK).
 *   7. Repeat for the other sheet, using a separate deployment.
 *
 * The script bound to a sheet has access to that sheet by default, so the
 * sheetId in the POST body is just used as a sanity check.
 */

const WEBHOOK_SECRET = 'CHANGE_ME_TO_MATCH_ENV';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== WEBHOOK_SECRET) {
      return json({ ok: false, error: 'bad_secret' });
    }
    const tab = String(body.tab || '');
    const values = body.values;
    if (!tab || !Array.isArray(values)) {
      return json({ ok: false, error: 'bad_payload' });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tab);
    if (!sheet) sheet = ss.insertSheet(tab);
    sheet.clear();
    if (values.length > 0) {
      const cols = Math.max(...values.map(r => r.length));
      const padded = values.map(r => {
        const row = r.slice();
        while (row.length < cols) row.push('');
        return row;
      });
      sheet.getRange(1, 1, padded.length, cols).setValues(padded);
    }
    return json({ ok: true, rows: values.length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, msg: 'Ledger webhook is alive. Use POST.' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
