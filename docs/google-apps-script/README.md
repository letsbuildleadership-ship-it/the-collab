# Send the site's emails from your own Google Script (Docs for the text, Sheets for the log)

How it works: the website (Netlify) posts each email to your Apps Script web app. The script finds the pre-written
text in a Google Doc, fills it in, sends it from your Gmail, and writes a row in a Google Sheet. If anything is
missing it sends the website's built-in text, so mail never stops. Until you do these steps, the site keeps using SMTP
(or skips email if SMTP is not set).

## 1. Make the spreadsheet
1. Create a Google Sheet named "Co.LLab Email". Rename the first tab to `Templates`.
2. Row 1 headers: `key | docId | subject | enabled`.
3. Add rows: `verify-email`, `password-reset`, `purchase-confirmation` (docId and subject next, `enabled` = yes).
4. Copy the spreadsheet id from its address (the long string between `/d/` and `/edit`).
The script adds an `Email Log` tab by itself.

## 2. Make the Docs
One Google Doc per template, using the texts in `email-templates.md`. Put each Doc's id in the `docId` column.

## 3. Add the script
1. In the sheet: Extensions -> Apps Script. Replace the code with `Code.gs` from this folder. Save.
2. Project Settings -> Script properties: add `SECRET` (a long random string), `SPREADSHEET_ID`, and optionally `FROM_NAME`.
3. Deploy -> New deployment -> Web app. Execute as: **Me**. Who has access: **Anyone**. Authorize when asked.
4. Copy the Web app URL.

## 4. Tell the website
In Netlify -> Site configuration -> Environment variables add:
- `MAIL_WEBHOOK_URL` = the Web app URL
- `MAIL_WEBHOOK_SECRET` = the same string as `SECRET`
Then trigger a deploy. Test by signing up with a spare email: the confirmation arrives from your Gmail and a row appears in `Email Log`.

## Notes
- Gmail limits how many emails a Google account can send per day. The script stops cleanly and logs `failed` if the limit is hit.
- The secret is the only lock on the script. Keep it out of the repository and out of chats.
- To change wording later, edit the Google Doc. No code change or deploy is needed.
- Turn a template off by setting `enabled` to `no`; the website's built-in text is sent instead.
