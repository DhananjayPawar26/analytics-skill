/**
 * Bulk create GA4 event tags from gtm_all_tags.md
 *
 * Creates only GA4 tags. Shared GTM assets must already exist:
 * - Data Layer Variables
 * - Custom Event triggers
 *
 * Usage:
 *   DRY_RUN=true node create-ga4-tag.js
 *   node create-ga4-tag.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const {
  DRY_RUN,
  buildTriggerIdMap,
  getMissingSharedAssets,
  initWorkspace,
  loadEvents,
  loadWorkspaceSnapshot,
  withRetry,
} = require("./lib/gtm-common");

if (!GA4_MEASUREMENT_ID) {
  console.error("Missing required env vars in .env");
  console.error("Required: GA4_MEASUREMENT_ID");
  process.exit(1);
}

function normalizeParamName(label) {
  const n = label.trim().toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "").replace(/_+/g, "_");
  const safe = /^[a-z]/.test(n) ? n : `param_${n || "value"}`;
  return safe.slice(0, 40);
}

function detectPii(props) {
  const pii = ["name", "phone", "email", "address"];
  return props.filter(p => pii.some(t => `${p.label} ${p.variableName}`.toLowerCase().includes(t)));
}

function buildGa4Tag(event, triggerId) {
  return {
    name: event.tagName,
    type: "gaawe",
    parameter: [
      { type: "template", key: "eventName", value: event.eventName },
      { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
      {
        type: "list",
        key: "eventSettingsTable",
        list: event.properties.map(p => ({
          type: "map",
          map: [
            { type: "template", key: "parameter", value: normalizeParamName(p.label) },
            { type: "template", key: "parameterValue", value: `{{${p.variableName}}}` },
          ],
        })),
      },
    ],
    firingTriggerId: [triggerId],
  };
}

async function main() {
  const events = loadEvents().map(event => ({
    ...event,
    tagName: `GA4 - ${event.eventName}`,
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
  let createdTags = 0;
  let updatedTags = 0;

  for (const event of events) {
    const triggerId = triggerIds.get(event.eventName);
    if (!triggerId) throw new Error(`No trigger found for event: ${event.eventName}`);

    const canonical = existingTags.get(event.tagName);
    const legacy = existingTags.get(`GA4 Event - ${event.eventName}`);

    if (canonical) {
      console.log(`Skip tag (exists): ${event.tagName}`);
      continue;
    }

    if (legacy) {
      console.log(`Update legacy tag: ${legacy.name} -> ${event.tagName}`);
      if (!DRY_RUN) {
        const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.tags.update({
          path: legacy.path,
          requestBody: buildGa4Tag(event, triggerId),
        }), `update tag ${legacy.name}`);
        existingTags.delete(legacy.name);
        existingTags.set(t.name, t);
      }
      updatedTags++;
      continue;
    }

    console.log(`Create tag: ${event.tagName}`);
    if (!DRY_RUN) {
      const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.tags.create({
        parent: ws.path,
        requestBody: buildGa4Tag(event, triggerId),
      }), `create tag ${event.tagName}`);
      existingTags.set(t.name, t);
    }
    createdTags++;
  }

  const paramWarnings = events.filter(e => e.properties.length > 25).map(e => `${e.eventName} (${e.properties.length} params)`);
  const piiWarnings = events.map(e => ({ name: e.eventName, pii: detectPii(e.properties) })).filter(e => e.pii.length > 0);

  console.log("\n-- Summary ----------------------");
  console.log(`Tags created: ${createdTags}`);
  console.log(`Tags updated: ${updatedTags}`);

  if (paramWarnings.length) {
    console.log("\nGA4 parameter count warning (>25 params):");
    paramWarnings.forEach(w => console.log(`  ${w}`));
  }
  if (piiWarnings.length) {
    console.log("\nPII review needed:");
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
