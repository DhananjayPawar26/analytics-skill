/**
 * Bulk create CleverTap event tags from gtm_all_tags.md
 *
 * Creates only CleverTap tags. Shared GTM assets must already exist:
 * - Data Layer Variables
 * - Custom Event triggers
 *
 * Usage:
 *   DRY_RUN=true node create-clevertap-tag.js
 *   node create-clevertap-tag.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const {
  DRY_RUN,
  buildTriggerIdMap,
  getMissingSharedAssets,
  initWorkspace,
  loadEvents,
  loadWorkspaceSnapshot,
  withRetry,
} = require("./lib/gtm-common");

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"");
}

function buildCleverTapEventHtml(event) {
  const lines = event.properties.map(prop =>
    `  "${escapeJsString(prop.label)}": "{{${escapeJsString(prop.variableName)}}}"`
  );
  const payload = lines.length ? `{\n${lines.join(",\n")}\n}` : "{}";

  return `<script>
clevertap.event.push("${escapeJsString(event.eventName)}", ${payload});
</script>`;
}

function buildCleverTapTag(event, triggerId) {
  return {
    name: event.tagName,
    type: "html",
    parameter: [
      { type: "template", key: "html", value: buildCleverTapEventHtml(event) },
      { type: "boolean", key: "supportDocumentWrite", value: "false" },
    ],
    firingTriggerId: [triggerId],
  };
}

async function main() {
  const events = loadEvents().map(event => ({
    ...event,
    tagName: `CT - ${event.eventName}`,
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
        requestBody: buildCleverTapTag(event, triggerId),
      }), `create tag ${event.tagName}`);
      existingTags.set(t.name, t);
    }
    createdTags++;
  }

  console.log("\n-- Summary ----------------------");
  console.log(`Event tags created: ${createdTags}`);

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
