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
├── create-tag.js           — bulk creates from gtm_all_tags.md
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
GTM_ACCOUNT_ID=123456789
GTM_CONTAINER_ID=987654321
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=1234567890
SERVICE_ACCOUNT_KEY_PATH=./service-account.json
```

Place your service account JSON in the same folder as `service-account.json`.

---

## Running the scripts

### Always dry run first

```bash
DRY_RUN=true node create-tag.js
```

Shows everything that will be created without writing anything. Review the output before applying.

### Apply

```bash
node create-tag.js
```

Creates all missing DLVs → triggers → GA4 tags in that order. Skips items that already exist — safe to re-run.

### Publish

```bash
node publish.js
# With custom version name:
node publish.js "Phase 1 - PDP events" "Added ATB, Wishlist, tab events"
```

### npm shortcuts

```bash
npm run create-tags:dry
npm run create-tags
npm run publish
```

---

## How `create-tag.js` works

1. Reads all `clevertap.event.push("EventName", {...})` blocks from `gtm_all_tags.md`
2. Extracts event names and `{{DLV - key}}` properties from each block
3. Handles `Apply to:` and `Duplicate for:` annotations to clone property shapes
4. Fetches existing variables, triggers, and tags from GTM API
5. Creates missing DLV variables first (dependency order)
6. Creates missing triggers second
7. Creates GA4 event tags last, linked to the correct trigger ID
8. Skips anything that already exists
9. Warns if any event exceeds GA4's 25-parameter limit
10. Warns if any properties may contain PII

---

## Adding CleverTap and Clarity tags via script

The script creates GA4 tags automatically from `gtm_all_tags.md`. For CleverTap and Clarity Custom HTML tags, follow the Meta Pixel pattern in `setup.js`:

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
