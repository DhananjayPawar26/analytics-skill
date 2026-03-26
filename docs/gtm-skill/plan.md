# GTM Multi-Analytics Integration — Skill Plan

A phased skill for integrating GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads into any web project via Google Tag Manager.

**Architecture:** GTM is the single container. Website code pushes events to `window.dataLayer`. GTM tags forward those events to each analytics platform.

---

## How to use this skill

**For a specific goal** — go directly to the relevant reference file below. You don't need to read everything.

**For a full project from scratch** — follow phases 1 → 6 in order.

**For AI assistants** — paste `prompt.md` into your conversation. For IDE-specific rules see the files below.

---

## Phases

### [Phase 1 — Prerequisites](../reference/01-prerequisites.md)

Collect all platform IDs, create the GTM container, set up Google Cloud, create a service account, and establish naming conventions.

**Go here when:** Starting a new project from scratch.

---

### [Phase 2 — Events Planning](../reference/02-events-planning.md)

Generate a client events template or parse a client-provided Excel file. Produce `gtm_all_tags.md` as the input for GTM setup.

**Go here when:** You have received an events list from the client and need to plan GTM structure before touching the dashboard or code.

---

### [Phase 3a — GTM Setup: Manual](../reference/03-gtm-setup-manual.md)

Step-by-step GTM dashboard instructions for creating DLV variables, Lookup Table credentials, SDK Loader tags, GA4 configuration, triggers, and event tags.

**Go here when:** Setting up GTM manually in the dashboard, or you need to understand what the scripts create.

---

### [Phase 3b — GTM Setup: Bulk Scripts](../reference/03-gtm-setup-scripts.md)

Use the Node.js scripts to bulk-create all DLVs, triggers, and GA4 tags from `gtm_all_tags.md` via the Google Cloud GTM API.

**Go here when:** You have many events and want to automate GTM setup instead of clicking through the dashboard.

---

### [Phase 4 — Website Integration](../reference/04-website-integration.md)

Install the GTM snippet, create the `pushEvent` utility, implement events in code at the right moments, and organise event files by page.

**Go here when:** GTM is set up and you need to wire events into the website codebase.

---

### [Phase 5 — Testing & Debugging](../reference/05-testing-debugging.md)

Tools setup, step-by-step testing flow, full debug decision tree, and browser console quick commands.

**Go here when:** Events are implemented but not showing in GTM Preview or platform dashboards.

---

### [Phase 6 — Publishing](../reference/06-publishing.md)

Publish the GTM container, manage UAT vs production credentials via Lookup Table, and run the pre-publish checklist.

**Go here when:** All events are tested and verified — ready to go live.

---

## Platform References

Platform-specific details, SDK snippets, limits, and debugging tips:

| Platform           | Reference                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| CleverTap          | [reference/platforms/clevertap.md](../reference/platforms/clevertap.md)   |
| Google Analytics 4 | [reference/platforms/ga4.md](../reference/platforms/ga4.md)               |
| Meta Pixel         | [reference/platforms/meta-pixel.md](../reference/platforms/meta-pixel.md) |
| Microsoft Clarity  | [reference/platforms/clarity.md](../reference/platforms/clarity.md)       |
| Google Ads         | [reference/platforms/google-ads.md](../reference/platforms/google-ads.md) |

---

## IDE Rules & AI Prompts

| Tool                    | File                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Cursor                  | `docs/gtm-skill/cursor_rules.mdc` → copy to `.cursor/rules/gtm-skill.mdc` in your project |
| VS Code + Copilot       | `docs/gtm-skill/copilot_instructions.md` → copy to `.github/copilot-instructions.md`      |
| Windsurf                | `docs/gtm-skill/windsurf_rules.md` → copy to `.windsurfrules`                             |
| Claude / Gemini / Codex | Paste `docs/gtm-skill/prompt.md` at the start of your conversation                        |

---

## Scripts

```
scripts/gtm/
├── create-tag.js        — bulk create GA4 tags from gtm_all_tags.md
├── setup.js             — full single-event setup
├── publish.js           — publish GTM container
├── create-trigger.js    — utility: create one trigger
└── create-variables.js  — utility: create DLV variables
```

See `scripts/gtm/README.md` for full usage instructions.

---

## Naming Conventions (quick reference)

| Item           | Convention              | Example                    |
| -------------- | ----------------------- | -------------------------- |
| DLV variables  | `DLV - property_name`   | `DLV - product_id`         |
| Triggers       | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked`     |
| Tags           | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked`     |
| dataLayer keys | `snake_case`            | `product_id`, `cart_total` |

**Platform abbreviations:** `GA4` · `CT` · `MP` · `CL` · `GADS`

---

## Critical Rules (quick reference)

- SDK Loader tags: All Pages trigger, **no filters**, priority **10**
- Event names: match `pushEvent()` calls and GTM triggers **exactly** — case-sensitive
- dataLayer keys: match GTM DLV names **exactly** — case-sensitive
- Call `pushEvent()` **after** async actions succeed — never on click
- Always `DRY_RUN=true` before running scripts
- Always **Submit → Publish** after changes — Preview uses draft, not live
- Never commit `.env` or service account JSON to git
