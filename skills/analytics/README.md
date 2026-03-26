# Analytics Skill

A phased skill for integrating GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads into any web project via Google Tag Manager.

## Install

```bash
npx skills add DhananjayPawar26/analytics-skill --skill analytics
```

This repository contains the `analytics` skill under `skills/analytics` plus the companion `gtm-bulk-push` skill under `skills/gtm-bulk-push`. Use the `--skill` flag to install only `analytics`.

## What this skill covers

| Phase                   | File                                  | When to use                     |
| ----------------------- | ------------------------------------- | ------------------------------- |
| 1 — Prerequisites       | [`reference/01-prerequisites.md`](reference/01-prerequisites.md)       | Starting a new project          |
| 2 — Events Planning     | [`reference/02-events-planning.md`](reference/02-events-planning.md)     | Parsing a client events file    |
| 3 — GTM Setup (Manual)  | [`reference/03-gtm-setup-manual.md`](reference/03-gtm-setup-manual.md)    | Setting up GTM in the dashboard |
| 3 — GTM Setup (Scripts) | [`reference/03-gtm-setup-scripts.md`](reference/03-gtm-setup-scripts.md)   | Running the bulk scripts        |
| 4 — Website Integration | [`reference/04-website-integration.md`](reference/04-website-integration.md) | Writing code-level events       |
| 5 — Testing & Debugging | [`reference/05-testing-debugging.md`](reference/05-testing-debugging.md)   | Debugging events not firing     |
| 6 — Publishing          | [`reference/06-publishing.md`](reference/06-publishing.md)          | Publishing the container        |

## Platform references

| Platform           | File                      |
| ------------------ | ------------------------- |
| CleverTap          | [`reference/clevertap.md`](reference/clevertap.md)  |
| Google Analytics 4 | [`reference/ga4.md`](reference/ga4.md)        |
| Meta Pixel         | [`reference/meta-pixel.md`](reference/meta-pixel.md) |
| Microsoft Clarity  | [`reference/clarity.md`](reference/clarity.md)    |
| Google Ads         | [`reference/google-ads.md`](reference/google-ads.md) |

## Platforms covered

- Google Analytics 4 (GA4)
- Meta Pixel
- CleverTap
- Microsoft Clarity
- Google Ads
