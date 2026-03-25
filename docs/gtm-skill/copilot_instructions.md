# GTM Multi-Analytics Integration — Copilot Instructions

Full documentation: `docs/gtm-skill/plan.md`

## Context
This project integrates GA4, Meta Pixel, CleverTap, Microsoft Clarity, and Google Ads via Google Tag Manager (GTM). Events are pushed from code via `window.dataLayer.push()`. GTM tags forward events to each platform.

## Naming conventions
- DLV variables: `DLV - property_name` (e.g. `DLV - product_id`)
- Triggers: `PLATFORM - Event_Name` (e.g. `CT - ATB_PDP_Clicked`)
- Tags: `PLATFORM - Event_Name`
- dataLayer keys: always `snake_case` — must match GTM DLV names exactly (case-sensitive)

## pushEvent utility — always use this pattern
```typescript
export const pushEvent = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
```

## Event file structure
```
lib/events/
├── pdp.ts
├── cart.ts
├── navigation.ts
├── any-page.ts
├── account.ts
└── mappers/
    ├── mapProductContext.ts
    ├── mapCartContext.ts
    └── mapUserContext.ts
```

## Rules Copilot must follow
1. Call `pushEvent()` only after async actions succeed — never on click or form submit directly
2. All dataLayer key names must exactly match the GTM DLV Data Layer Variable Name — case-sensitive
3. All event name strings must exactly match the GTM trigger Event Name — case-sensitive
4. Never hardcode platform credentials — use environment variables or GTM Lookup Table
5. Always add SSR guard (`typeof window === 'undefined'`) before any dataLayer access
6. Never import or reference service account JSON files in application code
7. Organise event tracking functions by page/section in `lib/events/`
8. Use shared mapper functions to convert API objects (Medusa product, cart) to flat dataLayer payloads

## CleverTap-specific
- Event name casing is permanent — `Wishlist_clicked` and `Wishlist_Clicked` are two different events in CleverTap
- User profile push uses `clevertap.onUserLogin.push()` — fire on login/registration only
- Properties with arrays (order SKUs, STL product IDs) must be confirmed as comma-separated string or JSON array with client

## Script commands
```bash
cd scripts/gtm
DRY_RUN=true node create-tag.js   # preview what will be created
node create-tag.js                 # apply
node publish.js                    # publish container
```

## Docs
- GTM API: https://developers.google.com/tag-platform/tag-manager/api/v2
- CleverTap Web SDK: https://developer.clevertap.com/docs/web-quickstart-guide
- GA4 Events: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Meta Pixel: https://developers.facebook.com/docs/meta-pixel/
- Clarity API: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
