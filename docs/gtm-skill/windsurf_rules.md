# GTM Multi-Analytics Integration — Windsurf Rules

Full documentation: `docs/gtm-skill/plan.md`

## What this project does
Integrates GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads via Google Tag Manager. Website code pushes events to `window.dataLayer`. GTM tags forward those events to each analytics platform.

## Naming conventions
- GTM DLV variables: `DLV - property_name`
- GTM Triggers: `PLATFORM - Event_Name`
- GTM Tags: `PLATFORM - Event_Name`
- dataLayer keys: `snake_case` always

## Core utility
```typescript
// lib/gtm.ts
export const pushEvent = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
```

## Mandatory rules
- `pushEvent()` must be called AFTER async actions succeed — not on click
- dataLayer keys must match GTM DLV names exactly — case-sensitive
- Event name strings must match GTM trigger names exactly — case-sensitive
- SSR guard required on all `window` access
- SDK Loader GTM tags: All Pages trigger, no filters, priority 10
- Never commit `.env` or service account JSON

## Event organisation
```
lib/events/pdp.ts
lib/events/cart.ts
lib/events/navigation.ts
lib/events/any-page.ts
lib/events/account.ts
lib/events/mappers/mapProductContext.ts
lib/events/mappers/mapCartContext.ts
lib/events/mappers/mapUserContext.ts
```

## GTM bulk scripts
```bash
cd scripts/gtm && npm install
DRY_RUN=true node create-tag.js   # always dry run first
node create-tag.js                 # apply changes
node publish.js                    # publish container
```

## Debug — browser console checks
```js
window.google_tag_manager   // must return object with GTM-XXXXX key
window.dataLayer             // must return array
typeof clevertap             // must return "object"
clevertap.account            // must show Account ID
typeof clarity               // must return "function"
typeof fbq                   // must return "function"
```

## Docs
- GTM API: https://developers.google.com/tag-platform/tag-manager/api/v2
- CleverTap: https://developer.clevertap.com/docs/web-quickstart-guide
- Meta Pixel: https://developers.facebook.com/docs/meta-pixel/
- Clarity: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
- GA4: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
