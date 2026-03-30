/**
 * Bulk create Meta Pixel tags from gtm_all_tags.md
 *
 * Reads all clevertap.event.push() blocks from gtm_all_tags.md,
 * extracts event names and properties, then creates matching
 * GTM variables, triggers, a Meta base pixel tag, and Meta event tags.
 *
 * Usage:
 *   DRY_RUN=true node create-meta-tag.js   - preview without writing
 *   node create-meta-tag.js                - apply changes
 */

require("dotenv").config({ path: __dirname + "/.env" });
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH
  || path.join(__dirname, "service-account.json");
const SPEC_PATH = path.join(__dirname, "gtm_all_tags.md");
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";
const WRITE_DELAY_MS = Number(process.env.GTM_WRITE_DELAY_MS || 2300);
const RETRY_DELAY_MS = Number(process.env.GTM_RETRY_DELAY_MS || 65000);
const ALL_PAGES_TRIGGER_ID = "2147479553";
const META_BASE_TAG_NAME = "MP - Base Pixel";

if (!GTM_ACCOUNT_ID || !GTM_CONTAINER_ID || !META_PIXEL_ID || !SERVICE_ACCOUNT_KEY_PATH) {
  console.error("Missing required env vars in .env");
  console.error("Required: GTM_ACCOUNT_ID, GTM_CONTAINER_ID, META_PIXEL_ID, SERVICE_ACCOUNT_KEY_PATH");
  process.exit(1);
}

function parseProperties(blockBody) {
  const props = [];
  const re = /"([^"]+)":\s*"\{\{(DLV - [^}]+)\}\}"/g;
  let m;
  while ((m = re.exec(blockBody)) !== null) {
    props.push({ label: m[1], variableName: m[2] });
  }
  return props;
}

function extractInlineEventNames(text) {
  return [...text.matchAll(/`([^`]+)`/g)]
    .map(m => m[1].trim().replace(/^"+|"+$/g, ""))
    .filter(n => n !== "CT - SDK Loader" && !n.startsWith("CT - "))
    .filter(n => n !== "REPLACE_EVENT_NAME");
}

function normalizeMetaParamName(label) {
  const normalized = label.trim().toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  const safe = /^[a-z]/.test(normalized) ? normalized : `param_${normalized || "value"}`;
  return safe.slice(0, 100);
}

function isPiiProperty(prop) {
  const pii = ["name", "phone", "email", "address"];
  return pii.some(term => `${prop.label} ${prop.variableName}`.toLowerCase().includes(term));
}

function detectPii(props) {
  return props.filter(isPiiProperty);
}

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isRateLimit(err) {
  return err?.code === 429
    || err?.response?.status === 429
    || err?.response?.data?.error?.status === "RESOURCE_EXHAUSTED";
}

async function withRetry(fn, label, attempt = 1) {
  try {
    return await fn();
  } catch (err) {
    if (isRateLimit(err) && attempt < 5) {
      console.log(`Rate limit on ${label}. Waiting ${Math.ceil(RETRY_DELAY_MS / 1000)}s (attempt ${attempt + 1})...`);
      await sleep(RETRY_DELAY_MS);
      return withRetry(fn, label, attempt + 1);
    }
    throw err;
  }
}

function parseEventDefinitions(markdown) {
  const re = /```html\s*<script>\s*clevertap\.event\.push\("([^"]+)",\s*\{([\s\S]*?)\}\);\s*<\/script>\s*```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(markdown)) !== null) {
    blocks.push({ eventName: m[1], properties: parseProperties(m[2]), start: m.index, end: re.lastIndex });
  }

  const eventMap = new Map();

  function upsert(name, props) {
    if (!name || name === "REPLACE_EVENT_NAME") return;
    const existing = eventMap.get(name);
    if (!existing) {
      eventMap.set(name, props);
      return;
    }
    if (JSON.stringify(existing) !== JSON.stringify(props)) {
      throw new Error(`Conflicting property definitions for event: ${name}`);
    }
  }

  blocks.forEach((block, i) => {
    const prevEnd = i === 0 ? 0 : blocks[i - 1].end;
    const nextStart = i === blocks.length - 1 ? markdown.length : blocks[i + 1].start;
    const before = markdown.slice(prevEnd, block.start);
    const after = markdown.slice(block.end, nextStart);

    if (block.eventName !== "REPLACE_EVENT_NAME") upsert(block.eventName, block.properties);

    if (block.eventName === "REPLACE_EVENT_NAME") {
      const applyIdx = before.lastIndexOf("Apply to:");
      if (applyIdx !== -1) extractInlineEventNames(before.slice(applyIdx)).forEach(n => upsert(n, block.properties));
    }

    const markers = ["Duplicate with pincode for:", "Duplicate for:", "Duplicate for `"];
    markers.forEach(marker => {
      const idx = after.indexOf(marker);
      if (idx === -1) return;
      const tail = after.slice(idx);
      const ends = ["\n---", "\n## ", "\n### "].map(d => tail.indexOf(d)).filter(x => x > 0);
      const end = ends.length > 0 ? Math.min(...ends) : tail.length;
      extractInlineEventNames(tail.slice(0, end)).forEach(n => upsert(n, block.properties));
    });
  });

  return [...eventMap.entries()].map(([eventName, properties]) => ({
    eventName,
    properties,
    tagName: `Meta - ${eventName}`,
    triggerName: `CE - ${eventName}`,
  })).sort((a, b) => a.eventName.localeCompare(b.eventName));
}

function buildDlv(name) {
  return {
    name,
    type: "v",
    parameter: [
      { type: "integer", key: "dataLayerVersion", value: "2" },
      { type: "boolean", key: "setDefaultValue", value: "false" },
      { type: "template", key: "name", value: name.replace(/^DLV - /, "") },
    ],
  };
}

function findTrigger(triggers, eventName) {
  return triggers.find(t => {
    if (t.type !== "customEvent") return false;
    const val = (t.customEventFilter || [])
      .flatMap(f => f.parameter || [])
      .find(p => p.key === "arg1")?.value;
    return val === eventName || t.name === `CT Trigger - ${eventName}` || t.name === `CE - ${eventName}`;
  });
}

function buildTrigger(eventName) {
  return {
    name: `CE - ${eventName}`,
    type: "customEvent",
    customEventFilter: [{
      type: "equals",
      parameter: [
        { type: "template", key: "arg0", value: "{{_event}}" },
        { type: "template", key: "arg1", value: eventName },
      ],
    }],
  };
}

function buildBasePixelHtml() {
  return `<script type="text/javascript">
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${escapeJsString(META_PIXEL_ID)}');fbq('track','PageView');
</script>`;
}

function buildMetaEventHtml(event) {
  const allowedProps = event.properties.filter(prop => !isPiiProperty(prop));
  const lines = allowedProps.map(prop => {
    const key = escapeJsString(normalizeMetaParamName(prop.label));
    const variable = escapeJsString(prop.variableName);
    return `  '${key}': '{{${variable}}}'`;
  });
  const payload = lines.length ? `{\n${lines.join(",\n")}\n}` : "{}";

  return `<script type="text/javascript">
fbq('trackCustom', '${escapeJsString(event.eventName)}', ${payload});
</script>`;
}

function buildMetaTag(event, triggerId) {
  return {
    name: event.tagName,
    type: "html",
    parameter: [
      { type: "template", key: "html", value: buildMetaEventHtml(event) },
      { type: "boolean", key: "supportDocumentWrite", value: "false" },
    ],
    firingTriggerId: [triggerId],
  };
}

function buildBaseTag() {
  return {
    name: META_BASE_TAG_NAME,
    type: "html",
    parameter: [
      { type: "template", key: "html", value: buildBasePixelHtml() },
      { type: "boolean", key: "supportDocumentWrite", value: "false" },
    ],
    firingTriggerId: [ALL_PAGES_TRIGGER_ID],
  };
}

async function main() {
  const markdown = fs.readFileSync(SPEC_PATH, "utf8");
  const events = parseEventDefinitions(markdown);

  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/tagmanager.edit.containers"],
  });

  const gtm = google.tagmanager({ version: "v2", auth });
  const parent = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;

  const { data: wsData } = await withRetry(() => gtm.accounts.containers.workspaces.list({ parent }), "list workspaces");
  const ws = (wsData.workspace || []).find(w => w.name === "Default Workspace") || (wsData.workspace || [])[0];
  if (!ws) throw new Error("No GTM workspace found");

  console.log(`Workspace: ${ws.name}`);
  console.log(`Events found in spec: ${events.length}`);
  console.log(DRY_RUN ? "Mode: DRY_RUN\n" : "Mode: APPLY\n");

  const [{ data: varData }, { data: trigData }, { data: tagData }] = await Promise.all([
    withRetry(() => gtm.accounts.containers.workspaces.variables.list({ parent: ws.path }), "list variables"),
    withRetry(() => gtm.accounts.containers.workspaces.triggers.list({ parent: ws.path }), "list triggers"),
    withRetry(() => gtm.accounts.containers.workspaces.tags.list({ parent: ws.path }), "list tags"),
  ]);

  const existingVars = new Map((varData.variable || []).map(v => [v.name, v]));
  const existingTriggers = trigData.trigger || [];
  const existingTags = new Map((tagData.tag || []).map(t => [t.name, t]));

  const neededVars = [...new Set(events.flatMap(e => e.properties.map(p => p.variableName)))].sort();

  let createdVars = 0;
  for (const name of neededVars) {
    if (existingVars.has(name)) continue;
    console.log(`Create variable: ${name}`);
    if (!DRY_RUN) {
      const { data: v } = await withRetry(() => gtm.accounts.containers.workspaces.variables.create({
        parent: ws.path,
        requestBody: buildDlv(name),
      }), `create var ${name}`);
      existingVars.set(v.name, v);
      await sleep(WRITE_DELAY_MS);
    }
    createdVars++;
  }

  let createdTriggers = 0;
  const triggerIds = new Map();

  for (const event of events) {
    const existing = findTrigger(existingTriggers, event.eventName);
    if (existing) {
      triggerIds.set(event.eventName, existing.triggerId);
      continue;
    }

    console.log(`Create trigger: ${event.triggerName}`);
    if (!DRY_RUN) {
      const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.triggers.create({
        parent: ws.path,
        requestBody: buildTrigger(event.eventName),
      }), `create trigger ${event.triggerName}`);
      existingTriggers.push(t);
      triggerIds.set(event.eventName, t.triggerId);
      await sleep(WRITE_DELAY_MS);
    } else {
      triggerIds.set(event.eventName, "DRY_RUN_ID");
    }
    createdTriggers++;
  }

  let createdBaseTag = 0;
  if (existingTags.has(META_BASE_TAG_NAME)) {
    console.log(`Skip tag (exists): ${META_BASE_TAG_NAME}`);
  } else {
    console.log(`Create tag: ${META_BASE_TAG_NAME}`);
    if (!DRY_RUN) {
      const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.tags.create({
        parent: ws.path,
        requestBody: buildBaseTag(),
      }), `create tag ${META_BASE_TAG_NAME}`);
      existingTags.set(t.name, t);
      await sleep(WRITE_DELAY_MS);
    }
    createdBaseTag++;
  }

  let createdTags = 0;

  for (const event of events) {
    const triggerId = triggerIds.get(event.eventName) || findTrigger(existingTriggers, event.eventName)?.triggerId;
    if (!triggerId) throw new Error(`No trigger found for event: ${event.eventName}`);

    if (existingTags.has(event.tagName)) {
      console.log(`Skip tag (exists): ${event.tagName}`);
      continue;
    }

    console.log(`Create tag: ${event.tagName}`);
    if (!DRY_RUN) {
      const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.tags.create({
        parent: ws.path,
        requestBody: buildMetaTag(event, triggerId),
      }), `create tag ${event.tagName}`);
      existingTags.set(t.name, t);
      await sleep(WRITE_DELAY_MS);
    }
    createdTags++;
  }

  const piiWarnings = events
    .map(e => ({ name: e.eventName, pii: detectPii(e.properties) }))
    .filter(e => e.pii.length > 0);

  console.log("\n-- Summary ----------------------");
  console.log(`Variables created:  ${createdVars}`);
  console.log(`Triggers created:   ${createdTriggers}`);
  console.log(`Base tags created:  ${createdBaseTag}`);
  console.log(`Event tags created: ${createdTags}`);

  if (piiWarnings.length) {
    console.log("\nPII excluded from Meta payloads:");
    piiWarnings.forEach(e => console.log(`  ${e.name}: ${e.pii.map(p => p.label).join(", ")}`));
  }

  if (!DRY_RUN) {
    console.log("\nDone. Test in GTM Preview before publishing:");
    console.log(`  https://tagmanager.google.com/#/container/accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/workspaces/${ws.workspaceId}`);
    console.log("  Or run: node publish.js");
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
