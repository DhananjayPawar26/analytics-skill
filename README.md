# GTM Multi-Analytics Integration Skill

A reusable, phased skill for integrating GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads into any web project via Google Tag Manager.

**Architecture:** GTM is the single container. Website code pushes events to `window.dataLayer`. GTM tags forward those events to each analytics platform.

---

## Repo structure

```
docs/gtm-skill/
├── plan.md                          — Skill index + phase navigation (start here)
├── prompt.md                        — AI assistant prompt (Claude, Gemini, Codex)
├── cursor_rules.mdc                 — Condensed rules for Cursor users
├── copilot_instructions.md          — Condensed rules for VS Code + Copilot users
└── windsurf_rules.md                — Condensed rules for Windsurf users

reference/
├── 01-prerequisites.md              — IDs, Google Cloud, service account, naming conventions
├── 02-events-planning.md            — Client Excel parsing, ambiguity flags, gtm_all_tags.md format
├── 03-gtm-setup-manual.md           — GTM dashboard: DLVs, triggers, SDK loaders, event tags
├── 03-gtm-setup-scripts.md          — Bulk script usage and how create-tag.js works
├── 04-website-integration.md        — GTM snippet, pushEvent utility, event file structure
├── 05-testing-debugging.md          — Testing flow, debug decision tree, console commands
├── 06-publishing.md                 — Publish steps, UAT vs production strategy
└── platforms/
    ├── clevertap.md                 — SDK loader, regions, events, onUserLogin, debugger
    ├── ga4.md                       — Tag types, parameter limits, PII policy, DebugView
    ├── meta-pixel.md                — Base pixel, standard vs custom events, Pixel Helper
    ├── clarity.md                   — SDK loader, custom tagging, smart events
    └── google-ads.md                — Conversion tag, remarketing, conversion linker

scripts/gtm/
├── package.json
├── .env.example
├── .gitignore
├── create-tag.js                    — Bulk create GA4 tags from gtm_all_tags.md
├── setup.js                         — Full setup: variables + triggers + GA4 + Meta tags
├── publish.js                       — Create version and publish GTM container
├── create-trigger.js                — Utility: create a single trigger
├── create-variables.js              — Utility: create DLV variables
└── gtm_all_tags.md                  — Input file: event definitions (fill this in per project)
```

---

## Quick start

### 1. Read the skill

Start with `docs/gtm-skill/plan.md` — it links to the right reference file for your specific goal. You don't need to read everything.

### 2. Set up scripts

```bash
cd scripts/gtm
npm install
cp .env.example .env
# Fill in GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GA4_MEASUREMENT_ID, SERVICE_ACCOUNT_KEY_PATH
```

### 3. Fill in the events

Edit `scripts/gtm/gtm_all_tags.md` with your project's event definitions following the format in the file.

### 4. Dry run first

```bash
DRY_RUN=true node create-tag.js
```

### 5. Apply and publish

```bash
node create-tag.js
node publish.js
```

---

## IDE-specific rules

| IDE                     | File to use                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Cursor                  | Copy `docs/gtm-skill/cursor_rules.mdc` → `.cursor/rules/gtm-skill.mdc` in your project            |
| VS Code + Copilot       | Copy `docs/gtm-skill/copilot_instructions.md` → `.github/copilot-instructions.md` in your project |
| Windsurf                | Copy `docs/gtm-skill/windsurf_rules.md` → `.windsurfrules` in your project                        |
| Claude / Gemini / Codex | Paste `docs/gtm-skill/prompt.md` at the start of your conversation                                |

> **Rule:** never edit IDE rule files directly. Always update the source reference files, then sync the IDE files from them.

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
