require("dotenv").config({ path: __dirname + "/../.env" });
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SPEC_PATH = path.join(__dirname, "..", "gtm_all_tags.md");
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";
const WRITE_DELAY_MS = Number(process.env.GTM_WRITE_DELAY_MS || 2300);
const RETRY_DELAY_MS = Number(process.env.GTM_RETRY_DELAY_MS || 65000);

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

  return [...eventMap.entries()]
    .map(([eventName, properties]) => ({ eventName, properties }))
    .sort((a, b) => a.eventName.localeCompare(b.eventName));
}

function loadEvents() {
  const markdown = fs.readFileSync(SPEC_PATH, "utf8");
  return parseEventDefinitions(markdown);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    return val === eventName
      || t.name === `Trigger - ${eventName}`
      || t.name === `CT Trigger - ${eventName}`
      || t.name === `CE - ${eventName}`;
  });
}

function buildTrigger(eventName) {
  return {
    name: `Trigger - ${eventName}`,
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

function getRequiredVariableNames(events) {
  return [...new Set(events.flatMap(event => event.properties.map(p => p.variableName)))].sort();
}

async function initWorkspace() {
  const GTM_ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
  const GTM_CONTAINER_ID = process.env.GTM_CONTAINER_ID;
  const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH
    || path.join(__dirname, "..", "service-account.json");

  if (!GTM_ACCOUNT_ID || !GTM_CONTAINER_ID || !SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error("Missing required env vars: GTM_ACCOUNT_ID, GTM_CONTAINER_ID, SERVICE_ACCOUNT_KEY_PATH");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/tagmanager.edit.containers"],
  });

  const gtm = google.tagmanager({ version: "v2", auth });
  const parent = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;
  const { data: wsData } = await withRetry(() => gtm.accounts.containers.workspaces.list({ parent }), "list workspaces");
  const ws = (wsData.workspace || []).find(w => w.name === "Default Workspace") || (wsData.workspace || [])[0];
  if (!ws) throw new Error("No GTM workspace found");

  return { gtm, ws, GTM_ACCOUNT_ID, GTM_CONTAINER_ID };
}

async function loadWorkspaceSnapshot(gtm, wsPath) {
  const [{ data: varData }, { data: trigData }, { data: tagData }] = await Promise.all([
    withRetry(() => gtm.accounts.containers.workspaces.variables.list({ parent: wsPath }), "list variables"),
    withRetry(() => gtm.accounts.containers.workspaces.triggers.list({ parent: wsPath }), "list triggers"),
    withRetry(() => gtm.accounts.containers.workspaces.tags.list({ parent: wsPath }), "list tags"),
  ]);

  return {
    existingVars: new Map((varData.variable || []).map(v => [v.name, v])),
    existingTriggers: trigData.trigger || [],
    existingTags: new Map((tagData.tag || []).map(t => [t.name, t])),
  };
}

function getMissingSharedAssets(events, existingVars, existingTriggers) {
  const missingVariables = getRequiredVariableNames(events).filter(name => !existingVars.has(name));
  const missingTriggers = events
    .filter(event => !findTrigger(existingTriggers, event.eventName))
    .map(event => ({ eventName: event.eventName, triggerName: `Trigger - ${event.eventName}` }));

  return { missingVariables, missingTriggers };
}

async function ensureSharedAssets({ gtm, wsPath, events, existingVars, existingTriggers }) {
  const { missingVariables, missingTriggers } = getMissingSharedAssets(events, existingVars, existingTriggers);
  let createdVars = 0;
  let createdTriggers = 0;

  for (const name of missingVariables) {
    console.log(`Create variable: ${name}`);
    if (!DRY_RUN) {
      const { data: v } = await withRetry(() => gtm.accounts.containers.workspaces.variables.create({
        parent: wsPath,
        requestBody: buildDlv(name),
      }), `create var ${name}`);
      existingVars.set(v.name, v);
      await sleep(WRITE_DELAY_MS);
    }
    createdVars++;
  }

  for (const missingTrigger of missingTriggers) {
    console.log(`Create trigger: ${missingTrigger.triggerName}`);
    if (!DRY_RUN) {
      const { data: t } = await withRetry(() => gtm.accounts.containers.workspaces.triggers.create({
        parent: wsPath,
        requestBody: buildTrigger(missingTrigger.eventName),
      }), `create trigger ${missingTrigger.triggerName}`);
      existingTriggers.push(t);
      await sleep(WRITE_DELAY_MS);
    }
    createdTriggers++;
  }

  return { createdVars, createdTriggers };
}

function buildTriggerIdMap(events, existingTriggers) {
  const triggerIds = new Map();
  for (const event of events) {
    const existing = findTrigger(existingTriggers, event.eventName);
    if (existing) triggerIds.set(event.eventName, existing.triggerId);
  }
  return triggerIds;
}

module.exports = {
  DRY_RUN,
  buildTriggerIdMap,
  ensureSharedAssets,
  getMissingSharedAssets,
  initWorkspace,
  loadEvents,
  loadWorkspaceSnapshot,
  withRetry,
};
