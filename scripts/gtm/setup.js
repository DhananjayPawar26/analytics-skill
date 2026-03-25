/**
 * GTM Full Setup — variables + triggers + GA4 tag + Meta Pixel tags
 *
 * Use this for quick single-event setup or as a starting point.
 * For bulk setup from gtm_all_tags.md, use create-tag.js instead.
 *
 * Usage:
 *   node setup.js
 *   Then: node publish.js
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;

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

  const [{ data: varData }, { data: trigData }, { data: tagData }] = await Promise.all([
    gtm.accounts.containers.workspaces.variables.list({ parent: ws.path }),
    gtm.accounts.containers.workspaces.triggers.list({ parent: ws.path }),
    gtm.accounts.containers.workspaces.tags.list({ parent: ws.path }),
  ]);

  const vars = new Map((varData.variable || []).map(v => [v.name, v]));
  const trigs = new Map((trigData.trigger || []).map(t => [t.name, t]));
  const tags = new Map((tagData.tag || []).map(t => [t.name, t]));

  // ── Variables ────────────────────────────────────────────
  console.log("── Variables ──");
  const varDefs = [
    { name: "DLV - url", dataLayerName: "url" },
    { name: "DLV - product_name", dataLayerName: "product_name" },
    { name: "DLV - product_id", dataLayerName: "product_id" },
    { name: "DLV - sku", dataLayerName: "sku" },
    { name: "DLV - category", dataLayerName: "category" },
    { name: "DLV - product_price", dataLayerName: "product_price" },
    { name: "DLV - discounted_price", dataLayerName: "discounted_price" },
    { name: "DLV - quantity", dataLayerName: "quantity" },
    { name: "DLV - cart_total", dataLayerName: "cart_total" },
    { name: "DLV - cart_item_count", dataLayerName: "cart_item_count" },
    { name: "DLV - cart_total_discount", dataLayerName: "cart_total_discount" },
    { name: "DLV - user_id", dataLayerName: "user_id" },
    { name: "DLV - user_name", dataLayerName: "user_name" },
    { name: "DLV - user_phone", dataLayerName: "user_phone" },
    { name: "DLV - user_email", dataLayerName: "user_email" },
  ];

  for (const def of varDefs) {
    if (vars.has(def.name)) { console.log(`  [exists] ${def.name}`); continue; }
    const { data: v } = await gtm.accounts.containers.workspaces.variables.create({
      parent: ws.path,
      requestBody: {
        name: def.name,
        type: "v",
        parameter: [
          { type: "integer", key: "dataLayerVersion", value: "2" },
          { type: "boolean", key: "setDefaultValue", value: "false" },
          { type: "template", key: "name", value: def.dataLayerName },
        ],
      },
    });
    console.log(`  ✓ ${v.name}`);
  }

  // ── Triggers ─────────────────────────────────────────────
  console.log("\n── Triggers ──");
  const triggerDefs = [
    { name: "CE - ATB_PDP_Clicked", eventName: "ATB_PDP_Clicked" },
    { name: "CE - Wishlist_Clicked", eventName: "Wishlist_Clicked" },
  ];

  const triggerIds = {};
  for (const def of triggerDefs) {
    if (trigs.has(def.name)) {
      triggerIds[def.eventName] = trigs.get(def.name).triggerId;
      console.log(`  [exists] ${def.name}`); continue;
    }
    const { data: t } = await gtm.accounts.containers.workspaces.triggers.create({
      parent: ws.path,
      requestBody: {
        name: def.name,
        type: "customEvent",
        customEventFilter: [{ type: "equals", parameter: [
          { type: "template", key: "arg0", value: "{{_event}}" },
          { type: "template", key: "arg1", value: def.eventName },
        ]}],
      },
    });
    triggerIds[def.eventName] = t.triggerId;
    console.log(`  ✓ ${t.name} (ID: ${t.triggerId})`);
  }

  // ── Tags ─────────────────────────────────────────────────
  console.log("\n── Tags ──");

  // Meta Pixel base
  const mpBase = "MP - Base Pixel";
  if (tags.has(mpBase)) {
    console.log(`  [exists] ${mpBase}`);
  } else {
    await gtm.accounts.containers.workspaces.tags.create({
      parent: ws.path,
      requestBody: {
        name: mpBase,
        type: "html",
        parameter: [{ type: "template", key: "html", value: `<script type="text/javascript">
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');
</script>` }],
        firingTriggerId: ["2147479553"], // GTM built-in All Pages trigger ID
      },
    });
    console.log(`  ✓ ${mpBase}`);
  }

  // GA4 + Meta event tags per trigger
  for (const [eventName, triggerId] of Object.entries(triggerIds)) {
    const ga4Name = `GA4 - ${eventName}`;
    if (!tags.has(ga4Name)) {
      await gtm.accounts.containers.workspaces.tags.create({
        parent: ws.path,
        requestBody: {
          name: ga4Name,
          type: "gaawe",
          parameter: [
            { type: "template", key: "eventName", value: eventName },
            { type: "template", key: "measurementIdOverride", value: GA4_MEASUREMENT_ID },
          ],
          firingTriggerId: [triggerId],
        },
      });
      console.log(`  ✓ ${ga4Name}`);
    } else {
      console.log(`  [exists] ${ga4Name}`);
    }
  }

  console.log("\n✅ Setup complete! Run `node publish.js` to publish.");
}

main().catch(err => {
  console.error("\nError:", err.response?.data || err.message);
  process.exit(1);
});
