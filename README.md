# GTM Multi-Analytics Integration Skill

A reusable, phased skill for integrating GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads into any web project via Google Tag Manager.

## What's in this repo

```
docs/gtm-skill/
├── plan.md                          — Full skill documentation (source of truth)
├── prompt.md                        — AI assistant prompt (Claude, Gemini, Codex)
├── cursor-rules.mdc                 — Condensed rules for Cursor users
├── copilot_instructions.md          — Condensed rules for VS Code + Copilot users
└── windsurf_rules.md                — Condensed rules for Windsurf users

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

## Quick start

### 1. Read the skill

Start with `docs/gtm-skill/plan.md` — it covers all 6 phases from prerequisites to publishing.

### 2. Set up scripts

```bash
cd scripts/gtm
npm install
cp .env.example .env
# Fill in your GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GA4_MEASUREMENT_ID, SERVICE_ACCOUNT_KEY_PATH
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

## IDE-specific rules

| IDE                     | File to use                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cursor                  | Copy contents of `docs/gtm-skill/cursor-rules.mdc` into `.cursor/rules/gtm-skill.mdc` in your project            |
| VS Code + Copilot       | Copy contents of `docs/gtm-skill/copilot_instructions.md` into `.github/copilot-instructions.md` in your project |
| Windsurf                | Copy contents of `docs/gtm-skill/windsurf_rules.md` into `.windsurfrules` in your project                        |
| Claude / Gemini / Codex | Paste `docs/gtm-skill/prompt.md` at the start of your conversation                                               |

## Rule: never edit IDE rule files directly

Always edit `docs/gtm-skill/plan.md` as the source of truth, then update the IDE files from it.

## Platforms covered

- Google Analytics 4 (GA4)
- Meta Pixel
- CleverTap
- Microsoft Clarity
- Google Ads

## Security

- Never commit your service account JSON key
- Never commit your `.env` file
- Both are in `.gitignore` by default
- If a key is exposed, rotate it immediately in Google Cloud IAM
