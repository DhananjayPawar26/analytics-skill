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
GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
GOOGLE_ADS_CURRENCY=INR
GOOGLE_ADS_CONVERSION_LABELS=ATB_PDP_Clicked:label_one,Wishlist_Clicked:label_two
SERVICE_ACCOUNT_KEY_PATH=./service-account.json
```

Place your downloaded service account JSON file in this directory and name it `service-account.json`.

`META_PIXEL_ID` is needed if you plan to run `setup.js` or `create-meta-tag.js`.
`GOOGLE_ADS_*` values are only needed if you plan to run `setup-google-ads.js`.

> ⚠️ Never commit `service-account.json` or `.env` — both are in `.gitignore`

---

## Scripts

### `create-tag.js` — Bulk create DLV variables, triggers, and GA4 tags from `gtm_all_tags.md`

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

### `create-meta-tag.js` — Bulk create DLV variables, triggers, Meta base pixel, and Meta event tags from `gtm_all_tags.md`

Reads the same event definitions from `gtm_all_tags.md`, creates any missing DLV variables and custom-event triggers, ensures the Meta base pixel exists, and creates one Meta custom event tag per event.

```bash
# Always dry run first — shows what will be created without writing
DRY_RUN=true node create-meta-tag.js

# Apply — creates the base pixel tag plus Meta event tags
node create-meta-tag.js

# Using npm scripts
npm run create-tags:meta:dry
npm run create-tags:meta
```

**What it does:**

- Parses all `clevertap.event.push("EventName", {...})` blocks from `gtm_all_tags.md`
- Creates missing DLV variables first
- Creates missing triggers second
- Creates `MP - Base Pixel` on All Pages if missing
- Creates one `Meta - EventName` custom HTML tag per event
- Skips existing items so it is safe to re-run
- Excludes obvious PII fields from Meta event payloads and reports what was skipped

---

### `setup.js` — Example setup for a fixed event set

Creates variables, triggers, GA4 tags for a small hard-coded event set, plus the Meta base pixel tag. Use it as a reference script or a quick bootstrap for those sample events.

```bash
node setup.js
```

### `setup-google-ads.js` — Example Google Ads setup for a fixed event set

Uses existing GTM custom event triggers for the configured events, creates a Conversion Linker tag on All Pages, and creates one Google Ads conversion tag per event based on `GOOGLE_ADS_CONVERSION_LABELS`.

```bash
node setup-google-ads.js

# Using npm script
npm run setup:google-ads
```

`GOOGLE_ADS_CONVERSION_LABELS` is a comma-separated event-to-label map:

```bash
GOOGLE_ADS_CONVERSION_LABELS=ATB_PDP_Clicked:AbCdEf123,Wishlist_Clicked:ZyXwVu456
```

This is separate from GA4 because Google Ads needs a unique conversion label for each conversion action.

If a configured event does not already have a GTM custom event trigger, the script exits with an error instead of creating one.

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

This is the input file for the bulk tag scripts. Fill it in with your project's event definitions before running `create-tag.js` or `create-meta-tag.js`.

**Format:**

- Each event is a `clevertap.event.push("EventName", {...})` block inside a ` ```html ` code block
- Property values use `{{DLV - key_name}}` format
- Use `Apply to:` or `Duplicate for:` annotations to apply the same property shape to multiple events

See the existing entries in the file for examples, and [`../../skills/analytics/reference/02-events-planning.md`](../../skills/analytics/reference/02-events-planning.md) for the event-planning guide used by this repo.

---

## Workflow for a new project

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in env vars
cp .env.example .env

# 3. Fill in gtm_all_tags.md with project events

# 4. Dry run to verify GA4
DRY_RUN=true node create-tag.js

# 5. Apply GA4
node create-tag.js

# 6. Apply Meta (optional)
node create-meta-tag.js

# 7. Publish
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

**`Error 403`** — the service account doesn't have permission. Go to GTM → Admin → User Management and confirm the service account email has Edit access for setup scripts and Publish access if you will run `publish.js`.

**`Error 429`** — rate limit hit. The script will automatically wait and retry. If it keeps happening, increase `GTM_WRITE_DELAY_MS` in `.env`.

**`Conflicting property definitions for event: X`** — the same event name appears twice in `gtm_all_tags.md` with different properties. Remove the duplicate.
