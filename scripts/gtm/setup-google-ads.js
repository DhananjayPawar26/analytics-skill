/**
 * GTM Google Ads Setup — conversion linker + conversion tags
 *
 * Assumes the required GTM custom event triggers already exist.
 *
 * Creates:
 * - A Conversion Linker tag on All Pages
 * - One Google Ads conversion tag per configured event
 *
 * Usage:
 *   node setup-google-ads.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const GOOGLE_ADS_CONVERSION_ID = process.env.GOOGLE_ADS_CONVERSION_ID;
const GOOGLE_ADS_CURRENCY = process.env.GOOGLE_ADS_CURRENCY || "INR";
const GOOGLE_ADS_CONVERSION_LABELS = process.env.GOOGLE_ADS_CONVERSION_LABELS;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;

const REQUIRED_ENV = [
  "GTM_ACCOUNT_ID",
  "GTM_CONTAINER_ID",
  "GOOGLE_ADS_CONVERSION_ID",
  "GOOGLE_ADS_CONVERSION_LABELS",
  "SERVICE_ACCOUNT_KEY_PATH",
];

function failMissingEnv() {
  const missing = REQUIRED_ENV.filter(name => !process.env[name]);
  if (!missing.length) return;
  console.error("Missing required env vars:");
  missing.forEach(name => console.error(`- ${name}`));
  process.exit(1);
}

function parseConversionLabels(input) {
  const labels = new Map();

  for (const rawPair of input.split(",")) {
    const pair = rawPair.trim();
    if (!pair) continue;

    const sepIndex = pair.indexOf(":");
    if (sepIndex === -1) {
      throw new Error(`Invalid GOOGLE_ADS_CONVERSION_LABELS entry: ${pair}`);
    }

    const eventName = pair.slice(0, sepIndex).trim();
    const label = pair.slice(sepIndex + 1).trim();

    if (!eventName || !label) {
      throw new Error(`Invalid GOOGLE_ADS_CONVERSION_LABELS entry: ${pair}`);
    }

    labels.set(eventName, label);
  }

  if (!labels.size) {
    throw new Error("GOOGLE_ADS_CONVERSION_LABELS did not contain any event:label pairs");
  }

  return labels;
}

function findTrigger(triggers, eventName) {
  return triggers.find(trigger => {
    if (trigger.type !== "customEvent") return false;

    const eventParam = (trigger.customEventFilter || [])
      .flatMap(filter => filter.parameter || [])
      .find(param => param.key === "arg1");

    return eventParam?.value === eventName
      || trigger.name === `Trigger - ${eventName}`
      || trigger.name === `CE - ${eventName}`;
  });
}

function buildConversionLinkerTag() {
  return {
    name: "GADS - Conversion Linker",
    type: "gclidw",
    firingTriggerId: ["2147479553"],
  };
}

function buildGoogleAdsTag(eventName, conversionLabel, triggerId) {
  return {
    name: `GADS - ${eventName}`,
    type: "ads",
    parameter: [
      { type: "template", key: "conversionId", value: GOOGLE_ADS_CONVERSION_ID },
      { type: "template", key: "conversionLabel", value: conversionLabel },
      { type: "template", key: "currencyCode", value: GOOGLE_ADS_CURRENCY },
    ],
    firingTriggerId: [triggerId],
  };
}

async function main() {
  failMissingEnv();

  const conversionLabels = parseConversionLabels(GOOGLE_ADS_CONVERSION_LABELS);

  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/tagmanager.edit.containers"],
  });

  const gtm = google.tagmanager({ version: "v2", auth });
  const parent = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;
  const { data } = await gtm.accounts.containers.workspaces.list({ parent });
  const ws = data.workspace.find(w => w.name === "Default Workspace") || data.workspace[0];

  if (!ws) {
    throw new Error("No GTM workspace found");
  }

  console.log(`Workspace: ${ws.name}\n`);

  const [{ data: trigData }, { data: tagData }] = await Promise.all([
    gtm.accounts.containers.workspaces.triggers.list({ parent: ws.path }),
    gtm.accounts.containers.workspaces.tags.list({ parent: ws.path }),
  ]);

  const triggers = trigData.trigger || [];
  const tags = new Map((tagData.tag || []).map(tag => [tag.name, tag]));
  const triggerIds = new Map();

  console.log("── Existing Triggers ──");
  for (const eventName of conversionLabels.keys()) {
    const existing = findTrigger(triggers, eventName);
    if (!existing) {
      throw new Error(`Missing GTM trigger for event: ${eventName}`);
    }

    triggerIds.set(eventName, existing.triggerId);
    console.log(`  [found] Trigger - ${eventName} (ID: ${existing.triggerId})`);
  }

  console.log("\n── Tags ──");

  const conversionLinkerName = "GADS - Conversion Linker";
  if (tags.has(conversionLinkerName)) {
    console.log(`  [exists] ${conversionLinkerName}`);
  } else {
    await gtm.accounts.containers.workspaces.tags.create({
      parent: ws.path,
      requestBody: buildConversionLinkerTag(),
    });
    console.log(`  ✓ ${conversionLinkerName}`);
  }

  for (const [eventName, conversionLabel] of conversionLabels.entries()) {
    const tagName = `GADS - ${eventName}`;
    if (tags.has(tagName)) {
      console.log(`  [exists] ${tagName}`);
      continue;
    }

    await gtm.accounts.containers.workspaces.tags.create({
      parent: ws.path,
      requestBody: buildGoogleAdsTag(eventName, conversionLabel, triggerIds.get(eventName)),
    });

    console.log(`  ✓ ${tagName}`);
  }

  console.log("\n✅ Google Ads setup complete! Run `node publish.js` to publish.");
}

main().catch(err => {
  console.error("\nError:", err.response?.data || err.message);
  process.exit(1);
});
