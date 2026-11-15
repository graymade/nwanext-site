// Sends a signup or tip to the form endpoint (a Google Apps Script web app that writes to a Google Sheet).
// no-cors: Apps Script answers through a redirect the browser won't let us read, so a finished request
// counts as sent. The endpoint drops anything with the hidden `website` field filled (bots).
export async function sendForm(action: string, data: Record<string, string>): Promise<boolean> {
  try {
    await fetch(action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ ...data, page: location.pathname }) });
    return true;
  } catch {
    return false;
  }
}
