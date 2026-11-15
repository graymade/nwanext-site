// NWA Next signups and tips: saves the site's forms into the "NWA Next signups" Google Sheet.
// Lives in that sheet (Extensions, Apps Script). Deployed as a web app: Execute as Me, Who has access Anyone.
// The web app URL goes in the CMS (Site settings: Newsletter, Signup endpoint URL, and Tips, Tip endpoint URL).
// After editing this code: Deploy, Manage deployments, edit, Version: New version (keeps the same URL).

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return out('ok'); // hidden field, only bots fill it
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  // Text starting with = + - @ would run as a formula in Sheets; prefix it so it stays text.
  const clean = (v, n) => String(v || '').trim().slice(0, n).replace(/^[=+\-@]/, "'$&");

  if (p.type === 'newsletter') {
    const email = String(p.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@=+]+@[^\s@]+\.[^\s@]+$/.test(email)) return out('bad email');
    const sh = tab(ss, 'Signups', ['Date', 'Email', 'Signed up on']);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const last = sh.getLastRow();
      const have = last > 1 ? sh.getRange(2, 2, last - 1, 1).getValues().flat().map(String) : [];
      if (!have.includes(email)) sh.appendRow([now, email, clean(p.page, 200)]);
    } finally {
      lock.releaseLock();
    }
    return out('ok');
  }

  if (p.type === 'tip') {
    if (!String(p.tip || '').trim()) return out('empty');
    const sh = tab(ss, 'Tips', ['Date', 'Tip', 'Source', 'Email', 'Sent from']);
    sh.appendRow([now, clean(p.tip, 5000), clean(p.source, 1000), clean(p.email, 254), clean(p.page, 200)]);
    return out('ok');
  }

  return out('unknown');
}

function tab(ss, name, head) {
  let sh = ss.getSheetByName(name);
  // The sheet was created with the Signups header on its first tab; adopt that tab.
  if (!sh && name === 'Signups' && ss.getSheets()[0].getRange('A1').getValue() === 'Date') {
    sh = ss.getSheets()[0].setName('Signups');
    sh.setFrozenRows(1);
  }
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
  }
  return sh;
}

function out(s) {
  return ContentService.createTextOutput(s);
}
