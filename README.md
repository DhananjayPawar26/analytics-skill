# GTM Analytics Skill

A reusable skill for integrating GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads into any web project via Google Tag Manager.

**Architecture:** GTM is the single container. Website code pushes events to `window.dataLayer`. GTM tags forward those events to each analytics platform.

---

## Skills

### `analytics`

Full GTM analytics integration — covers everything from prerequisites to publishing across all 5 platforms.

```bash
npx skills add DhananjayPawar26/analytics-skill --skill analytics
```

Primary docs: [`skills/analytics/README.md`](skills/analytics/README.md)

### `gtm-bulk-push`

Set up and run the Node.js scripts that bulk-create GTM variables, triggers, and tags via the Google Cloud Tag Manager API.

```bash
npx skills add DhananjayPawar26/analytics-skill --skill gtm-bulk-push
```

Primary docs: [`skills/gtm-bulk-push/README.md`](skills/gtm-bulk-push/README.md)

Install only the skill you need:

```bash
npx skills add DhananjayPawar26/analytics-skill --skill analytics
npx skills add DhananjayPawar26/analytics-skill --skill gtm-bulk-push
```

---

## Repo structure

```
skills/
├── analytics/
│   ├── SKILL.md                      — entry point for the analytics skill
│   ├── README.md                     — overview and phase-by-phase reference index
│   └── reference/
│       ├── 01-prerequisites.md       — IDs, Google Cloud, service account, naming conventions
│       ├── 02-events-planning.md     — Client Excel parsing, ambiguity flags, gtm_all_tags.md format
│       ├── 03-gtm-setup-manual.md    — GTM dashboard: DLVs, triggers, SDK loaders, event tags
│       ├── 03-gtm-setup-scripts.md   — Bulk script usage and how create-tag.js works
│       ├── 04-website-integration.md — GTM snippet, pushEvent utility, event file structure
│       ├── 05-testing-debugging.md   — Testing flow, debug decision tree, console commands
│       ├── 06-publishing.md          — Publish steps, UAT vs production strategy
│       ├── clevertap.md              — SDK loader, regions, events, onUserLogin, debugger
│       ├── ga4.md                    — Tag types, parameter limits, PII policy, DebugView
│       ├── meta-pixel.md             — Base pixel, standard vs custom events, Pixel Helper
│       ├── clarity.md                — SDK loader, custom tagging, smart events
│       └── google-ads.md             — Conversion tag, remarketing, conversion linker
└── gtm-bulk-push/
    ├── README.md                     — bulk-push usage guide
    └── SKILL.md                      — entry point for the bulk push script skill

scripts/gtm/
├── package.json
├── .env.example
├── .gitignore
├── README.md                         — script-level setup and workflow
├── create-tag.js                     — Bulk create DLVs, triggers, and GA4 tags from gtm_all_tags.md
├── setup.js                          — Example setup: variables, triggers, GA4 tags, and Meta base pixel
├── publish.js                        — Create version and publish GTM container
├── create-trigger.js                 — Utility: create a single trigger
├── create-variables.js               — Utility: create DLV variables
└── gtm_all_tags.md                   — Input file: event definitions (fill this in per project)
```

---

## Platforms covered

- Google Analytics 4 (GA4)
- Meta Pixel
- CleverTap
- Microsoft Clarity
- Google Ads

---

## Security

- Never commit your service account JSON key
- Never commit your `.env` file
- Both are in `.gitignore` by default
- If a key is exposed, rotate it immediately in Google Cloud IAM
