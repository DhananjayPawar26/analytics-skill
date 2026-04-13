# GTM Bulk Push Script Skill

You are helping set up and run the GTM bulk push scripts that automate creating Data Layer Variables, triggers, and tags in a GTM container via the Google Cloud Tag Manager API.

## What this skill does

- Creates shared GTM DLV variables and triggers in bulk from a single `gtm_all_tags.md` input file
- Creates GA4 event tags from the same `gtm_all_tags.md` input file
- Creates CleverTap Custom HTML event tags from the same `gtm_all_tags.md` input file
- Creates Meta event tags from the same `gtm_all_tags.md` input file
- Skips items that already exist — safe to re-run
- Warns about GA4 parameter limits (>25) and PII properties
- Publishes the container via script

---

## Prerequisites

Before running any script:

1. **GTM Account ID and Container ID** — GTM Dashboard → Admin → Container Settings
2. **Google Cloud project** with Tag Manager API enabled — [console.cloud.google.com](https://console.cloud.google.com)
3. **Service account JSON key** — Google Cloud → IAM → Service Accounts → Keys → Add Key → JSON
4. **Service account granted access in GTM** — GTM → Admin → User Management → add service account email → Publish permission

> ⚠️ Never commit the service account JSON or `.env` to git.

---

## Setup

```bash
cd scripts/gtm
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

Place your service account JSON file in `scripts/gtm/` named `service-account.json`.

---

## Input file — `gtm_all_tags.md`

Fill in `scripts/gtm/gtm_all_tags.md` with your project's events before running.

Each event is a `clevertap.event.push()` block inside a ` ```html ` code block:

```html
<script>
  clevertap.event.push("ATB_PDP_Clicked", {
    URL: "{{DLV - url}}",
    "Product Name": "{{DLV - product_name}}",
    "Product ID": "{{DLV - product_id}}",
    SKU: "{{DLV - sku}}",
    "Cart Total": "{{DLV - cart_total}}",
  });
</script>
```

For events sharing the same property shape, use annotations:

```
Duplicate for: `View_Bundle_clicked`, `Wishlist_clicked`
```

---

## Scripts

### `create-shared-gtm-assets.js` — bulk create shared variables and triggers

```bash
# Always dry run first
DRY_RUN=true node create-shared-gtm-assets.js

# Apply
node create-shared-gtm-assets.js
```

What it does in order:

1. Parses all events from `gtm_all_tags.md`
2. Fetches existing items from GTM API
3. Creates missing DLV variables
4. Creates missing triggers
5. Does not create any platform tags

### `create-ga4-tag.js` — bulk create GA4 tags only

```bash
# Always dry run first
DRY_RUN=true node create-ga4-tag.js

# Apply
node create-ga4-tag.js
```

What it does in order:

1. Parses all events from `gtm_all_tags.md`
2. Fetches existing items from GTM API
3. Verifies shared DLV variables already exist
4. Verifies shared triggers already exist
5. Creates missing GA4 event tags linked to correct triggers
6. Skips anything that already exists

### `create-clevertap-tag.js` — bulk create CleverTap event tags

```bash
# Always dry run first
DRY_RUN=true node create-clevertap-tag.js

# Apply
node create-clevertap-tag.js
```

What it does in order:

1. Parses all events from `gtm_all_tags.md`
2. Fetches existing items from GTM API
3. Verifies shared DLV variables already exist
4. Verifies shared triggers already exist
5. Creates missing `CT - EventName` Custom HTML tags linked to correct triggers
6. Skips anything that already exists

### `setup.js` — single-event full setup (GA4 + Meta Pixel)

```bash
node setup.js
```

Use this for quick single-event setup or as a reference for how the API works.

### `publish.js` — publish the container

```bash
# Auto-generated version name
node publish.js

# Custom version name and description
node publish.js "Phase 1 - PDP events" "Added ATB, Wishlist, tab events"
```

### `create-trigger.js` — create one trigger

```bash
EVENT_NAME=My_Event_Name node create-trigger.js
```

### `create-variables.js` — create DLV variables

Edit the `VARIABLES` array at the top of the file, then:

```bash
node create-variables.js
```

---

## Full workflow for a new project

```bash
# 1. Install
cd scripts/gtm && npm install

# 2. Configure
cp .env.example .env
# fill in .env

# 3. Fill in events
# edit gtm_all_tags.md

# 4. Shared assets
DRY_RUN=true node create-shared-gtm-assets.js
node create-shared-gtm-assets.js

# 5. GA4
DRY_RUN=true node create-ga4-tag.js
node create-ga4-tag.js

# 6. Apply CleverTap
DRY_RUN=true node create-clevertap-tag.js
node create-clevertap-tag.js

# 7. Meta
DRY_RUN=true node create-meta-tag.js
node create-meta-tag.js

# 8. Publish
node publish.js "Project name - initial setup"
```

---

## npm shortcuts

```bash
npm run create-shared:dry   # DRY_RUN=true node create-shared-gtm-assets.js
npm run create-shared       # node create-shared-gtm-assets.js
npm run create-tags:dry     # DRY_RUN=true node create-ga4-tag.js
npm run create-tags         # node create-ga4-tag.js
npm run create-tags:ct:dry  # DRY_RUN=true node create-clevertap-tag.js
npm run create-tags:ct      # node create-clevertap-tag.js
npm run publish           # node publish.js
```

---

## Rate limits

The GTM API has write rate limits. Scripts handle this automatically:

| Env var              | Default | Purpose                               |
| -------------------- | ------- | ------------------------------------- |
| `GTM_WRITE_DELAY_MS` | `2300`  | Delay between write operations        |
| `GTM_RETRY_DELAY_MS` | `65000` | Wait before retrying after rate limit |

Override in `.env` if needed.

---

## Troubleshooting

| Error                                           | Fix                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Missing required env vars`                     | Check all four values are filled in `.env`                                                          |
| `No GTM workspace found`                        | Confirm `GTM_ACCOUNT_ID` and `GTM_CONTAINER_ID` are correct                                         |
| `Error 403`                                     | Service account doesn't have permission in GTM — check User Management                              |
| `Error 429`                                     | Rate limit hit — script will auto-retry; increase `GTM_WRITE_DELAY_MS` if persistent                |
| `Conflicting property definitions for event: X` | Same event name appears twice in `gtm_all_tags.md` with different properties — remove the duplicate |

---

## Important

- Always dry run before applying
- Always publish after running scripts — changes are not live until published
- GTM's built-in All Pages trigger ID for SDK Loader tags: `2147479553`
