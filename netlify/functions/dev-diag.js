// Temporary diagnostic endpoint — reports whether Netlify's Blobs runtime
// context is actually present in this function's environment, without
// leaking secret values. Gated by DEV_SETUP_SECRET. Safe to delete once the
// MissingBlobsEnvironmentError investigation is done.
exports.handler = async (event, context) => {
  const params = event.queryStringParameters || {};
  const expected = process.env.DEV_SETUP_SECRET;
  if (!expected || params.secret !== expected) {
    return { statusCode: 401, body: 'Unauthorized.' };
  }

  const contextKeys = context ? Object.keys(context) : null;
  const clientContextKeys = context && context.clientContext ? Object.keys(context.clientContext) : null;
  const custom = context && context.clientContext ? context.clientContext.custom : null;
  const customKeys = custom ? Object.keys(custom) : null;

  let decodedNetlifyCustom = null;
  let decodeError = null;
  if (custom && custom.netlify) {
    try {
      decodedNetlifyCustom = JSON.parse(Buffer.from(custom.netlify, 'base64').toString('utf8'));
    } catch (e) {
      decodeError = e.message;
    }
  }

  const info = {
    contextKeys,
    clientContextKeys,
    customKeys,
    decodedNetlifyCustom,
    decodeError,
    purgeApiTokenPresent: !!(custom && custom.purge_api_token),
    purgeApiTokenLength: custom && custom.purge_api_token ? String(custom.purge_api_token).length : 0,
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
