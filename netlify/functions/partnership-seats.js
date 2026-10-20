// Partnership seats. A tier's `seats` count includes the purchaser; the
// purchaser fills the rest with single-use invite links they share with a
// teammate. Nothing here sends email and the purchaser never sees a seat
// holder's access token.
//
//   GET                                  -> the caller's seat view (purchaser roster, or their own seat)
//   POST { action: 'invite' }            -> purchaser: create an invite link (if a seat is free)
//   POST { action: 'revoke-invite', code }
//   POST { action: 'remove', memberId }  -> purchaser: remove a seat holder (access ends immediately)
//   POST { action: 'claim', code, email? } -> teammate: claim a seat. Signed in: the seat goes on
//        that account. Not signed in: a NEW account is created for `email`; an email that already
//        has an account must sign in first (so an invite can never open someone else's account).
//
// Access itself is derived at read time by lib/access.js, never stored on the seat holder.
const crypto = require('crypto');
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { seatOwnerFor } = require('./lib/access');
const { json, tokenFromEvent, setTokenCookie } = require('./lib/http');

const INVITE_DAYS = 14;

function siteOrigin(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || 'wearethellab.com';
  return `https://${host}`;
}

function inviteLink(event, code) {
  return `${siteOrigin(event)}/pages/account.html?seat_invite=${encodeURIComponent(code)}`;
}

function liveInvites(p, nowIso) {
  return (p.invites || []).filter((i) => i.expiresAt > nowIso);
}

/** Seats still free for new invites: total minus purchaser, holders, and live invites. */
function freeSeats(p, nowIso) {
  return Math.max(0, (p.seats || 1) - 1 - (p.seatHolders || []).length - liveInvites(p, nowIso).length);
}

function ownerView(event, record, nowIso) {
  const p = record.partnership;
  const tier = pricing.entryForKey(p.key) || {};
  return {
    role: 'purchaser',
    tierLabel: p.tierLabel,
    seats: p.seats || 1,
    used: 1 + (p.seatHolders || []).length,
    free: freeSeats(p, nowIso),
    expiresAt: p.expiresAt,
    engagement: tier.engagement || null,
    holders: (p.seatHolders || []).map((h) => ({ email: h.email, memberId: h.memberId, addedAt: h.addedAt })),
    invites: liveInvites(p, nowIso).map((i) => ({ code: i.code, link: inviteLink(event, i.code), createdAt: i.createdAt, expiresAt: i.expiresAt })),
  };
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

exports._freeSeats = freeSeats;

exports.handler = async (event) => {
  const nowIso = new Date().toISOString();
  const token = tokenFromEvent(event);
  const record = token ? await store.getCustomerByToken(token) : null;

  if (event.httpMethod === 'GET') {
    if (!record) return json(401, { error: 'Not signed in.' });
    if (record.partnership) return json(200, ownerView(event, record, nowIso));
    const owner = await seatOwnerFor(record);
    if (owner) {
      return json(200, {
        role: 'seat',
        tierLabel: owner.partnership.tierLabel,
        expiresAt: owner.partnership.expiresAt,
        sponsorName: owner.name || null,
      });
    }
    return json(200, { role: 'none' });
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }
  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'claim') {
    const code = typeof body.code === 'string' ? body.code : '';
    const invite = await store.getSeatInvite(code);
    if (!invite || invite.expiresAt <= nowIso) return json(410, { error: 'This invite link has expired or was already used.' });

    const owner = await store.getCustomerByToken(invite.ownerToken);
    const p = owner && owner.partnership;
    if (!p || !(p.invites || []).some((i) => i.code === code)) {
      return json(410, { error: 'This invite link has expired or was already used.' });
    }
    if ((p.seatHolders || []).length >= (p.seats || 1) - 1) {
      return json(409, { error: 'All seats on this partnership are filled.' });
    }

    let claimer = record;
    let isNew = false;
    if (!claimer) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!isValidEmail(email)) return json(400, { error: 'Enter a valid email address.' });
      if (await store.getTokenByEmail(email)) {
        return json(409, { error: 'That email already has a Co.LLab™ account. Sign in first, then open the invite link again.', needsSignIn: true });
      }
      const created = await store.getOrCreateCustomerByEmail(email);
      claimer = created.record;
      isNew = true;
    }

    if (claimer.token === owner.token) return json(400, { error: 'You already hold this partnership as its purchaser.' });
    if (claimer.partnership) return json(409, { error: 'This account already holds its own partnership.' });
    const currentSeat = await seatOwnerFor(claimer);
    if (currentSeat) return json(409, { error: 'This account already holds a partnership seat.' });

    const addedAt = nowIso;
    claimer.seatOf = { ownerToken: owner.token, partnershipKey: p.key, addedAt };
    p.seatHolders = [...(p.seatHolders || []), { token: claimer.token, email: claimer.email, memberId: claimer.memberId || null, addedAt }];
    p.invites = (p.invites || []).filter((i) => i.code !== code);
    await store.saveCustomer(claimer);
    await store.saveCustomer(owner);
    await store.deleteSeatInvite(code);

    return json(
      200,
      { ok: true, tierLabel: p.tierLabel, expiresAt: p.expiresAt, memberId: claimer.memberId || null, isNew },
      isNew ? { 'Set-Cookie': setTokenCookie(claimer.token) } : undefined
    );
  }

  // Everything below is the purchaser managing their roster.
  if (!record) return json(401, { error: 'Not signed in.' });
  const p = record.partnership;
  if (!p) return json(403, { error: 'Only a partnership purchaser can manage seats.' });

  if (action === 'invite') {
    if (freeSeats(p, nowIso) < 1) return json(409, { error: 'No free seats left on this partnership.' });
    const code = crypto.randomBytes(18).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString();
    p.invites = [...liveInvites(p, nowIso), { code, createdAt: nowIso, expiresAt }];
    await store.saveSeatInvite(code, { ownerToken: record.token, partnershipKey: p.key, createdAt: nowIso, expiresAt });
    await store.saveCustomer(record);
    return json(200, ownerView(event, record, nowIso));
  }

  if (action === 'revoke-invite') {
    const code = typeof body.code === 'string' ? body.code : '';
    p.invites = (p.invites || []).filter((i) => i.code !== code);
    await store.deleteSeatInvite(code);
    await store.saveCustomer(record);
    return json(200, ownerView(event, record, nowIso));
  }

  if (action === 'remove') {
    const memberId = typeof body.memberId === 'string' ? body.memberId : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const holder = (p.seatHolders || []).find((h) => (memberId && h.memberId === memberId) || (!memberId && email && h.email === email));
    if (!holder) return json(404, { error: 'No seat holder found.' });
    p.seatHolders = p.seatHolders.filter((h) => h !== holder);
    await store.saveCustomer(record);
    const holderRecord = await store.getCustomerByToken(holder.token);
    if (holderRecord && holderRecord.seatOf && holderRecord.seatOf.ownerToken === record.token) {
      delete holderRecord.seatOf;
      await store.saveCustomer(holderRecord);
    }
    return json(200, ownerView(event, record, nowIso));
  }

  return json(400, { error: 'Unknown action.' });
};
