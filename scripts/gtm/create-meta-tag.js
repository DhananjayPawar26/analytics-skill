/**
 * Bulk create Meta Pixel tags from gtm_all_tags.md
 *
 * Creates only Meta tags. Shared GTM assets must already exist:
 * - Data Layer Variables
 * - Custom Event triggers
 *
 * Usage:
 *   DRY_RUN=true node create-meta-tag.js
 *   node create-meta-tag.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const ALL_PAGES_TRIGGER_ID = "2147479553";
const META_BASE_TAG_NAME = "MP - Base Pixel";
const {
  DRY_RUN,
  buildTriggerIdMap,
  getMissingSharedAssets,
  initWorkspace,
  loadEvents,
  loadWorkspaceSnapshot,
  withRetry,
} = require("./lib/gtm-common");

if (!META_PIXEL_ID) {
  console.error("Missing required env vars in .env");
  console.error("Required: META_PIXEL_ID");
  process.exit(1);
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
  const events = loadEvents().map(event => ({
    ...event,
    tagName: `Meta - ${event.eventName}`,
  }));
  const { gtm, ws, GTM_ACCOUNT_ID, GTM_CONTAINER_ID } = await initWorkspace();

  console.log(`Workspace: ${ws.name}`);
  console.log(`Events found in spec: ${events.length}`);
  console.log(DRY_RUN ? "Mode: DRY_RUN\n" : "Mode: APPLY\n");

  const { existingVars, existingTriggers, existingTags } = await loadWorkspaceSnapshot(gtm, ws.path);
  const { missingVariables, missingTriggers } = getMissingSharedAssets(events, existingVars, existingTriggers);

  if (missingVariables.length || missingTriggers.length) {
    console.error("Missing shared GTM assets. Run `node create-shared-gtm-assets.js` first.");
    if (missingVariables.length) console.error(`Missing variables: ${missingVariables.join(", ")}`);
    if (missingTriggers.length) console.error(`Missing triggers: ${missingTriggers.map(t => t.triggerName).join(", ")}`);
    process.exit(1);
  }

  const triggerIds = buildTriggerIdMap(events, existingTriggers);
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
    }
    createdBaseTag++;
  }

  let createdTags = 0;
  for (const event of events) {
    const triggerId = triggerIds.get(event.eventName);
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
    }
    createdTags++;
  }

  const piiWarnings = events
    .map(e => ({ name: e.eventName, pii: detectPii(e.properties) }))
    .filter(e => e.pii.length > 0);

  console.log("\n-- Summary ----------------------");
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
