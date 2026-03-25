/**
 * Utility: Create a single GTM Custom Event trigger
 *
 * Usage:
 *   EVENT_NAME=My_Event_Name node create-trigger.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;
const EVENT_NAME = process.env.EVENT_NAME;

if (!EVENT_NAME) {
  console.error("Missing EVENT_NAME. Usage: EVENT_NAME=My_Event node create-trigger.js");
  process.exit(1);
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/tagmanager.edit.containers"],
  });

  const gtm = google.tagmanager({ version: "v2", auth });
  const parent = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;
  const { data } = await gtm.accounts.containers.workspaces.list({ parent });
  const ws = data.workspace.find(w => w.name === "Default Workspace") || data.workspace[0];
  console.log(`Workspace: ${ws.name}\n`);

  const { data: trigger } = await gtm.accounts.containers.workspaces.triggers.create({
    parent: ws.path,
    requestBody: {
      name: `CE - ${EVENT_NAME}`,
      type: "customEvent",
      customEventFilter: [{ type: "equals", parameter: [
        { type: "template", key: "arg0", value: "{{_event}}" },
        { type: "template", key: "arg1", value: EVENT_NAME },
      ]}],
    },
  });

  console.log(`✓ Trigger created: ${trigger.name}`);
  console.log(`  Trigger ID: ${trigger.triggerId}`);
  console.log(`\n  Use this Trigger ID in your tag's firingTriggerId field.`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
