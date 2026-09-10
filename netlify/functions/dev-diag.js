// Temporary diagnostic endpoint — reports whether Netlify's Blobs runtime
// context is actually present in this function's environment, without
// leaking secret values. Gated by DEV_SETUP_SECRET. Safe to delete once the
// MissingBlobsEnvironmentError investigation is done.
exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const expected = process.env.DEV_SETUP_SECRET;
  if (!expected || params.secret !== expected) {
    return { statusCode: 401, body: 'Unauthorized.' };
  }

  const info = {
    hasNetlifyBlobsContext: typeof process.env.NETLIFY_BLOBS_CONTEXT === 'string',
    netlifyBlobsContextLength: (process.env.NETLIFY_BLOBS_CONTEXT || '').length,
    SITE_ID: process.env.SITE_ID || null,
    NETLIFY: process.env.NETLIFY || null,
    CONTEXT: process.env.CONTEXT || null,
    DEPLOY_ID: process.env.DEPLOY_ID || null,
    URL: process.env.URL || null,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
  };

  let blobsError = null;
  let blobsWorked = false;
  try {
    const { getStore } = require('@netlify/blobs');
    const s = getStore('collab-customers');
    await s.get('meta/member-id-seq.json', { type: 'json' });
    blobsWorked = true;
  } catch (e) {
    blobsError = { name: e.name, message: e.message };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ info, blobsWorked, blobsError }, null, 2),
  };
};
