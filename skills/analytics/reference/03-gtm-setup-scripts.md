# Phase 3b: GTM Setup — Bulk Scripts

> 📖 [GTM API Overview](https://developers.google.com/tag-platform/tag-manager/api/v2) · [GTM API Developer Guide](https://developers.google.com/tag-platform/tag-manager/api/v2/devguide) · [googleapis Node.js client](https://github.com/googleapis/google-api-nodejs-client)

Use the bulk scripts when you have many events — they create all DLVs, triggers, and tags programmatically from `gtm_all_tags.md`, skipping anything that already exists.

---

## Project structure

```
scripts/gtm/
├── .env                    — credentials (never commit)
├── .gitignore
├── package.json
├── gtm_all_tags.md         — input: event definitions
├── create-shared-gtm-assets.js — bulk creates shared DLVs and triggers
├── create-ga4-tag.js       — bulk creates GA4 tags from gtm_all_tags.md
├── setup.js                — full single-event setup
├── publish.js              — creates version and publishes
├── create-trigger.js       — utility: one trigger
└── create-variables.js     — utility: DLV variables
```

---

## Setup

```bash
cd scripts/gtm
npm install
cp .env.example .env
```

Fill in `.env`:

```
GTM_ACCOUNT_ID=XXXXXXX
GTM_CONTAINER_ID=XXXXXX
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=XXXXXXXX
SERVICE_ACCOUNT_KEY_PATH=./service-account.json
```

Place your service account JSON in the same folder as `service-account.json`.

---

## Running the scripts

### Always dry run shared assets first

```bash
DRY_RUN=true node create-shared-gtm-assets.js
```

Shows which shared DLVs and triggers would be created without writing anything.

### Apply shared assets

```bash
node create-shared-gtm-assets.js
```

Creates all missing DLVs and triggers. Platform scripts depend on this step.

### Dry run GA4 tags

```bash
DRY_RUN=true node create-ga4-tag.js
```

### Apply GA4 tags

```bash
node create-ga4-tag.js
```

Creates missing GA4 tags only. Shared DLVs and triggers must already exist.

### Publish

```bash
node publish.js
# With custom version name:
node publish.js "Phase 1 - PDP events" "Added ATB, Wishlist, tab events"
```

### npm shortcuts

```bash
npm run create-shared:dry
npm run create-shared
npm run create-tags:dry
npm run create-tags
npm run publish
```

---

## How the separated scripts work

1. `create-shared-gtm-assets.js` reads all events and creates missing DLVs and triggers
2. `create-ga4-tag.js` creates only GA4 tags
3. `create-clevertap-tag.js` creates only CleverTap tags
4. `create-meta-tag.js` creates only Meta tags
5. Platform scripts fail fast if shared DLVs or triggers are missing

---

## Adding CleverTap tags via script

Use `create-clevertap-tag.js` to create CleverTap event tags from the same `gtm_all_tags.md` input:

```bash
DRY_RUN=true node create-clevertap-tag.js
node create-clevertap-tag.js
```

It:

- creates missing DLV variables
- creates missing custom-event triggers
- creates one `CT - EventName` Custom HTML tag per event
- skips existing items so it is safe to re-run

The generated tag HTML uses the same `clevertap.event.push("EventName", {...})` body already defined in the markdown spec.

## Adding Clarity tags via script

For Clarity Custom HTML tags, follow the Meta Pixel pattern in `setup.js`:

- Tag type: `"html"`
- Parameter key: `"html"` with the SDK event push as the value
- `firingTriggerId`: the trigger ID for the event
- For SDK Loader tags: `firingTriggerId: ["2147479553"]`

> ⚠️ `2147479553` is GTM's internal ID for the built-in All Pages trigger. Use this for SDK Loader tags — do not create a new All Pages trigger via script.

---

## Rate limits

The GTM API has write rate limits. The scripts handle this automatically:

| Env var              | Default | Purpose                                     |
| -------------------- | ------- | ------------------------------------------- |
| `GTM_WRITE_DELAY_MS` | `2300`  | Delay between write operations              |
| `GTM_RETRY_DELAY_MS` | `65000` | Wait before retrying after rate limit error |

Override in `.env` if needed.

---

## Checklist

- [ ] `.env` filled in with correct IDs
- [ ] Service account JSON in place and gitignored
- [ ] `gtm_all_tags.md` filled with all events
- [ ] Dry run reviewed — output looks correct
- [ ] Script applied — all items created
- [ ] Container published via `publish.js`
