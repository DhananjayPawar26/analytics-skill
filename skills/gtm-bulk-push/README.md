# GTM Bulk Push Skill

A skill for setting up and running the Node.js scripts that bulk-create GTM variables, triggers, and tags via the Google Cloud Tag Manager API.

## Install

```bash
npx skills add DhananjayPawar26/analytics-skill --skill gtm-bulk-push
```

This repository contains the `gtm-bulk-push` skill under `skills/gtm-bulk-push` alongside the broader `analytics` skill under `skills/analytics`. Use the `--skill` flag to install only `gtm-bulk-push`.

## What this skill covers

- Setting up Google Cloud credentials and service account
- Configuring the `.env` file
- Filling in `gtm_all_tags.md` with event definitions
- Running `create-tag.js` to bulk-create DLV variables, triggers, and GA4 tags
- Publishing the container via script
- Troubleshooting common script errors

Reference docs:
- [`scripts/gtm/README.md`](../scripts/gtm/README.md)
- [`skills/analytics/reference/03-gtm-setup-scripts.md`](../analytics/reference/03-gtm-setup-scripts.md)

## Scripts (in `scripts/gtm/`)

| Script                | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `create-tag.js`       | Bulk create DLV variables, triggers, and GA4 tags from `gtm_all_tags.md` |
| `setup.js`            | Example setup for a fixed event set: variables, triggers, GA4 tags, and the Meta base pixel |
| `publish.js`          | Create a container version and publish to live                           |
| `create-trigger.js`   | Utility: create a single trigger by event name                           |
| `create-variables.js` | Utility: create a list of DLV variables                                  |

## Quick commands

```bash
cd scripts/gtm
npm install
cp .env.example .env

# Always dry run first
DRY_RUN=true node create-tag.js

# Apply
node create-tag.js

# Publish
node publish.js
```

## Prerequisites

- Node.js installed
- GTM Account ID and Container ID
- Google Cloud project with Tag Manager API enabled
- Service account JSON key with GTM access granted to the service account

For `publish.js`, the service account also needs publish permission in GTM.
