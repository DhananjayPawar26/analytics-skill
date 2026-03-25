/**
 * Utility: Create GTM Data Layer Variables (DLVs)
 *
 * Edit the VARIABLES array below with the DLVs you need,
 * then run: node create-variables.js
 *
 * The script skips variables that already exist.
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { google } = require("googleapis");

const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;

// Add or remove variables here. Format: { name: "DLV - key", dataLayerName: "key" }
const VARIABLES = [
  { name: "DLV - url", dataLayerName: "url" },
  { name: "DLV - product_name", dataLayerName: "product_name" },
  { name: "DLV - product_id", dataLayerName: "product_id" },
  { name: "DLV - handle", dataLayerName: "handle" },
  { name: "DLV - sku", dataLayerName: "sku" },
  { name: "DLV - category", dataLayerName: "category" },
  { name: "DLV - product_price", dataLayerName: "product_price" },
  { name: "DLV - discounted_price", dataLayerName: "discounted_price" },
  { name: "DLV - quantity", dataLayerName: "quantity" },
  { name: "DLV - is_bestseller", dataLayerName: "is_bestseller" },
  { name: "DLV - is_foy_hotlist", dataLayerName: "is_foy_hotlist" },
  { name: "DLV - seasonal_edits", dataLayerName: "seasonal_edits" },
  { name: "DLV - section_label", dataLayerName: "section_label" },
  { name: "DLV - cart_total", dataLayerName: "cart_total" },
  { name: "DLV - cart_item_count", dataLayerName: "cart_item_count" },
  { name: "DLV - cart_total_discount", dataLayerName: "cart_total_discount" },
  { name: "DLV - user_id", dataLayerName: "user_id" },
  { name: "DLV - user_name", dataLayerName: "user_name" },
  { name: "DLV - user_phone", dataLayerName: "user_phone" },
  { name: "DLV - user_email", dataLayerName: "user_email" },
  { name: "DLV - user_age", dataLayerName: "user_age" },
  { name: "DLV - user_country", dataLayerName: "user_country" },
  { name: "DLV - user_city", dataLayerName: "user_city" },
  { name: "DLV - user_address", dataLayerName: "user_address" },
  { name: "DLV - user_pincode", dataLayerName: "user_pincode" },
  { name: "DLV - skin_type", dataLayerName: "skin_type" },
  { name: "DLV - skin_concerns", dataLayerName: "skin_concerns" },
  { name: "DLV - skin_shade", dataLayerName: "skin_shade" },
  { name: "DLV - undertone", dataLayerName: "undertone" },
  { name: "DLV - hair_type", dataLayerName: "hair_type" },
  { name: "DLV - hair_concern", dataLayerName: "hair_concern" },
  { name: "DLV - brand_page", dataLayerName: "brand_page" },
  { name: "DLV - cat_page", dataLayerName: "cat_page" },
  { name: "DLV - is_offers_page", dataLayerName: "is_offers_page" },
  { name: "DLV - pdp_sku", dataLayerName: "pdp_sku" },
  { name: "DLV - pdp_handle", dataLayerName: "pdp_handle" },
  { name: "DLV - cta_name", dataLayerName: "cta_name" },
  { name: "DLV - menu_item", dataLayerName: "menu_item" },
  { name: "DLV - search_query", dataLayerName: "search_query" },
];

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

  const { data: varData } = await gtm.accounts.containers.workspaces.variables.list({ parent: ws.path });
  const existing = new Set((varData.variable || []).map(v => v.name));

  let created = 0, skipped = 0;
  for (const v of VARIABLES) {
    if (existing.has(v.name)) { console.log(`  [exists] ${v.name}`); skipped++; continue; }
    const { data: created_v } = await gtm.accounts.containers.workspaces.variables.create({
      parent: ws.path,
      requestBody: {
        name: v.name,
        type: "v",
        parameter: [
          { type: "integer", key: "dataLayerVersion", value: "2" },
          { type: "boolean", key: "setDefaultValue", value: "false" },
          { type: "template", key: "name", value: v.dataLayerName },
        ],
      },
    });
    console.log(`  ✓ Created: ${created_v.name}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
