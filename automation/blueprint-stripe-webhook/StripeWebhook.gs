/**
 * Stripe -> Apps Script webhook for The Blueprint (TM) PDF product line.
 *
 * Paste this into a new script file inside "The Co.LLab Infrastructure System"
 * Apps Script project (the one bound to spreadsheet 1aVZm8Xtfd2eDbqCfEMwF-p4aWqOHENPdDUoqxxFxF7A).
 * It's a separate file (not merged into the existing Code.gs) because that
 * project currently has no doPost() at all -- it's driven entirely by
 * onFormSubmit/onPhaseSubmit triggers. Adding doPost() here just adds the
 * Stripe entry point; nothing in the existing Code.gs needs to change.
 *
 * Reuses logEvent() and clean() from Code.gs (same project, same global scope).
 *
 * IMPORTANT -- read this before wiring it to Stripe:
 * Apps Script web apps cannot read arbitrary HTTP request headers. The doPost(e)
 * event object only exposes postData, parameter/parameters and the query string --
 * there is no e.headers, so the "Stripe-Signature" header Stripe sends can't be
 * read here, and the standard HMAC-over-header verification Stripe recommends is
 * not implementable in stock Apps Script. (This is a long-standing Apps Script
 * platform limitation, not something specific to this script.)
 *
 * Instead, this verifies authenticity by re-fetching the event from Stripe's API
 * using the event id in the posted body, authenticated with your own secret key
 * (fetchVerifiedStripeEvent). An attacker can POST any JSON they like to this URL,
 * but they can't make Stripe's API hand back a real event for an id they made up,
 * so nothing is processed unless Stripe itself confirms the event exists. That's
 * a legitimate, commonly-used alternative to signature verification for platforms
 * that can't access request headers -- but two things follow from it:
 *   1. STRIPE_SECRET_KEY must be a RESTRICTED key (Events: Read, Checkout Sessions:
 *      Read only) -- never your full secret key -- in case Script Properties leak.
 *   2. Set WEBHOOK_SHARED_SECRET too and put it in the endpoint URL Stripe calls
 *      (?key=...). It's not a substitute for the step above, but it stops random
 *      internet traffic from burning Stripe API calls against this endpoint.
 */

const BLUEPRINT_MAP = {
  "price_1U7aSuAK6n3ctuR9l90HwyP5": {
    title: "The Blueprint™ — Welcome (Issue 00)",
    fileId: "13svjVaXqycmgYvnmWycNAssHFzid6yDE"
  },
  "price_1U7aTAAK6n3ctuR99S4YmR56": {
    title: "The Blueprint™ — Phase One: Foundations (Issue 01)",
    fileId: "1QZiOH2bdV2iUSsBYycDp9496NpxAuCjg"
  },
  "price_1U7aTPAK6n3ctuR97GWx9dmW": {
    title: "The Blueprint™ — Phase Two: Infrastructure Planning (Issue 02)",
    fileId: "1So0FU_7PJVieoCTEmgyAo58rYFClKLue"
  },
  "price_1U7aTdAK6n3ctuR9TlxJ4Mzf": {
    title: "The Blueprint™ — Phase Three: Internal Operating Systems (Issue 03)",
    fileId: "13s-RKX2R2aNhpAEa72NYI7c4E-O3hewW"
  },
  "price_1U7aTsAK6n3ctuR90SycsLmg": {
    title: "The Blueprint™ — Phase Four: Preservation (Issue 04)",
    fileId: "1hFznYubGFbZPMxNt6hb9Wg_z92BNEOCY"
  },
  "price_1U7aU7AK6n3ctuR9rxOzHC0A": {
    title: "The Blueprint™ — Complete Edition (All 5 Issues)",
    fileId: "1tHCZGOSlyXrepAyjqDjtW8WOQPCZeaO0"
  }
};

/* =========================
   WEBHOOK ENTRY POINT
========================= */
function doPost(e) {
  try {
    if (!verifyWebhookSharedSecret(e)) {
      return ContentService.createTextOutput("Forbidden");
    }

    const body = JSON.parse(e.postData.contents);
    const eventId = body.id;

    if (!eventId) {
      logEvent("WEBHOOK_REJECTED", "Missing event id in payload");
      return ContentService.createTextOutput("Ignored");
    }

    // Stripe retries on anything other than a fast 2xx, so guard against
    // processing the same event twice.
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty("evt_" + eventId)) {
      return ContentService.createTextOutput("Duplicate ignored");
    }

    const event = fetchVerifiedStripeEvent(eventId);
    if (!event) {
      logEvent("WEBHOOK_REJECTED", "Stripe could not verify event " + eventId);
      return ContentService.createTextOutput("Unverified");
    }

    props.setProperty("evt_" + eventId, "processed");

    if (event.type === "checkout.session.completed") {
      handleCheckoutCompleted(event.data.object);
    }

    return ContentService.createTextOutput("Success");

  } catch (err) {
    logEvent("WEBHOOK_ERROR", err.toString());
    return ContentService.createTextOutput("Error: " + err.message);
  }
}

/* =========================
   VERIFICATION
========================= */
function verifyWebhookSharedSecret(e) {
  const required = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SHARED_SECRET");
  if (!required) return true; // not configured yet -- falls back to event verification alone
  return e.parameter && e.parameter.key === required;
}

function fetchVerifiedStripeEvent(eventId) {
  const secretKey = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set in Script Properties");

  const resp = UrlFetchApp.fetch(
    "https://api.stripe.com/v1/events/" + encodeURIComponent(eventId),
    {
      method: "get",
      headers: { Authorization: "Bearer " + secretKey },
      muteHttpExceptions: true
    }
  );

  if (resp.getResponseCode() !== 200) return null;
  return JSON.parse(resp.getContentText());
}

/* =========================
   CHECKOUT HANDLING
========================= */
function handleCheckoutCompleted(session) {
  const email = clean(session.customer_details ? session.customer_details.email : "");
  const name = clean(session.customer_details ? session.customer_details.name : "") || "there";

  if (!email) {
    logEvent("CHECKOUT_NO_EMAIL", session.id);
    return;
  }

  const priceIds = getLineItemPriceIds(session.id);

  if (priceIds.length === 0) {
    logEvent("CHECKOUT_NO_LINE_ITEMS", email + " | " + session.id);
    return;
  }

  priceIds.forEach(function (priceId) {
    const product = BLUEPRINT_MAP[priceId];
    if (!product) {
      logEvent("NO_PRODUCT_MATCH", email + " | " + priceId);
      return;
    }
    deliverBlueprintPdf(email, name, product);
  });
}

function getLineItemPriceIds(sessionId) {
  const secretKey = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");

  const resp = UrlFetchApp.fetch(
    "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId) + "/line_items?limit=100",
    {
      method: "get",
      headers: { Authorization: "Bearer " + secretKey },
      muteHttpExceptions: true
    }
  );

  if (resp.getResponseCode() !== 200) return [];

  const data = JSON.parse(resp.getContentText());
  return data.data.map(function (li) { return li.price.id; });
}

/* =========================
   DELIVERY
========================= */
function deliverBlueprintPdf(email, name, product) {
  try {
    DriveApp.getFileById(product.fileId).addViewer(email);
  } catch (err) {
    logEvent("SHARE_ERROR", email + " | " + product.title + " | " + err.message);
  }

  const link = "https://drive.google.com/file/d/" + product.fileId + "/view";

  MailApp.sendEmail({
    to: email,
    subject: "Your copy of " + product.title,
    htmlBody:
      "<div style='font-family:Arial'>" +
      "<p>Hi " + name + ",</p>" +
      "<p>Thank you for your purchase. Here is your copy of <strong>" + product.title + "</strong>:</p>" +
      "<p><a href='" + link + "'>" + link + "</a></p>" +
      "</div>"
  });

  logEvent("BLUEPRINT_SENT", email + " | " + product.title);
}
