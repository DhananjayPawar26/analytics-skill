# GTM Scripts

Node.js scripts for bulk GTM setup via the Google Cloud Tag Manager API.

These scripts automate creating Data Layer Variables, triggers, and tags in your GTM container — eliminating the need to create them one by one in the GTM dashboard.

---

## Prerequisites

Before running any script you need:

1. **GTM Container ID and Account ID** — from [tagmanager.google.com](https://tagmanager.google.com) → Admin → Container Settings
2. **Google Cloud project** with the Tag Manager API enabled
3. **Service account JSON key** — downloaded from Google Cloud IAM → Service Accounts → Keys
4. **Service account granted access** in GTM — Admin → User Management → add the service account email with Publish permission

---

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
GTM_ACCOUNT_ID=your_account_id
GTM_CONTAINER_ID=your_container_id
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=your_pixel_id
SERVICE_ACCOUNT_KEY_PATH=./service-account.json
```

Place your downloaded service account JSON file in this directory and name it `service-account.json`.

> ⚠️ Never commit `service-account.json` or `.env` — both are in `.gitignore`

---

## Scripts

### `create-tag.js` — Bulk create GA4 tags from `gtm_all_tags.md`

The main script. Reads all event definitions from `gtm_all_tags.md`, then creates all missing DLV variables, triggers, and GA4 event tags in the correct dependency order. Skips items that already exist.

```bash
# Always dry run first — shows what will be created without writing anything
DRY_RUN=true node create-tag.js

# Apply — creates all variables, triggers, and tags
node create-tag.js

# Using npm script
npm run create-tags:dry
npm run create-tags
```

**What it does:**

- Parses all `clevertap.event.push("EventName", {...})` blocks from `gtm_all_tags.md`
- Creates missing DLV variables first
- Creates missing triggers second
- Creates GA4 event tags last, linked to the correct trigger
- Skips anything that already exists (safe to re-run)
- Warns if any event has more than 25 GA4 parameters
- Warns if any properties may contain PII (name, email, phone, address)

---

### `setup.js` — Full single-event setup

Creates variables, triggers, GA4 tag, and Meta Pixel tags for a defined set of events in one shot. Good for quick single-event setup or as a reference for how the API works.

```bash
node setup.js
```

---

### `publish.js` — Publish the GTM container

Creates a new container version and publishes it to the live environment.

```bash
# Publish with auto-generated version name
node publish.js

# Publish with custom version name and description
node publish.js "Phase 1 - PDP events" "Added ATB, Wishlist, and tab click events"

# Using npm script
npm run publish
```

> ⚠️ Always test in GTM Preview before publishing. Once published, changes are live immediately.

---

### `create-trigger.js` — Utility: create a single trigger

Creates one Custom Event trigger by event name. Useful when you need to add a trigger manually without running the full bulk script.

```bash
EVENT_NAME=My_Event_Name node create-trigger.js
```

---

### `create-variables.js` — Utility: create DLV variables

Creates a predefined list of Data Layer Variables. Edit the `VARIABLES` array at the top of the file to add or remove variables, then run:

```bash
node create-variables.js
```

The script skips variables that already exist.

---

## `gtm_all_tags.md` — Event definitions input file

This is the input file for `create-tag.js`. Fill it in with your project's event definitions before running the bulk script.

**Format:**

- Each event is a `clevertap.event.push("EventName", {...})` block inside a ` ```html ` code block
- Property values use `{{DLV - key_name}}` format
- Use `Apply to:` or `Duplicate for:` annotations to apply the same property shape to multiple events

See the existing entries in the file for examples, and `docs/gtm-skill/plan.md` Phase 2 for the full events planning guide.

---

## Workflow for a new project

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in env vars
cp .env.example .env

# 3. Fill in gtm_all_tags.md with project events

# 4. Dry run to verify
DRY_RUN=true node create-tag.js

# 5. Apply
node create-tag.js

# 6. Publish
node publish.js "Project name - initial setup"
```

---

## Rate limits

The GTM API has write rate limits. The scripts handle this automatically:

- `GTM_WRITE_DELAY_MS` — delay between write operations (default: 2300ms)
- `GTM_RETRY_DELAY_MS` — wait time before retrying after a rate limit error (default: 65000ms)

Both can be overridden in `.env` if needed.

---

## Troubleshooting

**`Missing required env vars`** — check your `.env` file has all four required values filled in.

**`No GTM workspace found`** — confirm your `GTM_ACCOUNT_ID` and `GTM_CONTAINER_ID` are correct. Find them in GTM → Admin → Container Settings.

**`Error 403`** — the service account doesn't have permission. Go to GTM → Admin → User Management and confirm the service account email has at least Edit access.

**`Error 429`** — rate limit hit. The script will automatically wait and retry. If it keeps happening, increase `GTM_WRITE_DELAY_MS` in `.env`.

**`Conflicting property definitions for event: X`** — the same event name appears twice in `gtm_all_tags.md` with different properties. Remove the duplicate.
