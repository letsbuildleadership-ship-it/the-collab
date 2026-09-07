// PDFs live in content/library/*.pdf and are shipped to the function via
// netlify.toml's `included_files`. Netlify's bundlers have varied slightly
// in exactly where included files land at runtime, so this tries the
// documented/observed candidate locations rather than assuming one.
const fs = require('fs');
const path = require('path');

function resolvePdfFile(filename) {
  const candidates = [
    path.join(__dirname, '..', '..', 'content', 'library', filename),
    path.join(process.cwd(), 'content', 'library', filename),
    process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'content', 'library', filename) : null,
    process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, filename) : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

module.exports = { resolvePdfFile };
