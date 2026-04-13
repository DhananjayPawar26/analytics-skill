/**
 * Bulk create shared GTM assets from gtm_all_tags.md
 *
 * Creates only the common prerequisites used across platforms:
 * - Data Layer Variables
 * - Custom Event triggers
 *
 * Usage:
 *   DRY_RUN=true node create-shared-gtm-assets.js
 *   node create-shared-gtm-assets.js
 */

const {
  DRY_RUN,
  ensureSharedAssets,
  initWorkspace,
  loadEvents,
  loadWorkspaceSnapshot,
} = require("./lib/gtm-common");

async function main() {
  const events = loadEvents();
  const { gtm, ws } = await initWorkspace();
  const { existingVars, existingTriggers } = await loadWorkspaceSnapshot(gtm, ws.path);

  console.log(`Workspace: ${ws.name}`);
  console.log(`Events found in spec: ${events.length}`);
  console.log(DRY_RUN ? "Mode: DRY_RUN\n" : "Mode: APPLY\n");

  const { createdVars, createdTriggers } = await ensureSharedAssets({
    gtm,
    wsPath: ws.path,
    events,
    existingVars,
    existingTriggers,
  });

  console.log("\n-- Summary ----------------------");
  console.log(`Variables created: ${createdVars}`);
  console.log(`Triggers created:  ${createdTriggers}`);
}

main().catch(err => {
  console.error("Error:", err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
