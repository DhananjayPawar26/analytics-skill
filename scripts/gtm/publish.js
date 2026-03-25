/**
 * Create a version and publish the GTM workspace
 *
 * Usage:
 *   node publish.js
 *   node publish.js "My version name" "Optional description"
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;

const versionName = process.argv[2] || `Auto publish ${new Date().toISOString().slice(0, 10)}`;
const versionNotes = process.argv[3] || "Published via publish.js script";

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: [
      "https://www.googleapis.com/auth/tagmanager.edit.containers",
      "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
      "https://www.googleapis.com/auth/tagmanager.publish",
    ],
  });

  const gtm = google.tagmanager({ version: "v2", auth });
  const parent = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;
  const { data } = await gtm.accounts.containers.workspaces.list({ parent });
  const ws = data.workspace.find(w => w.name === "Default Workspace") || data.workspace[0];
  console.log(`Workspace: ${ws.name}\n`);

  console.log("Creating container version...");
  const { data: version } = await gtm.accounts.containers.workspaces.create_version({
    path: ws.path,
    requestBody: { name: versionName, notes: versionNotes },
  });

  if (version.compilerError) {
    console.error("Compiler errors:", JSON.stringify(version.compilerError, null, 2));
    process.exit(1);
  }

  const versionId = version.containerVersion.containerVersionId;
  console.log(`✓ Version created: ${versionId}`);

  console.log("Publishing...");
  await gtm.accounts.containers.versions.publish({ path: version.containerVersion.path });

  console.log(`\n✅ Published! Version ${versionId} is now live.`);
  console.log(`   Container: https://tagmanager.google.com/#/container/accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`);
}

main().catch(err => {
  console.error("Error:", err.response?.data || err.message);
  process.exit(1);
});
