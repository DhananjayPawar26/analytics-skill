# GTM Multi-Analytics Integration — AI Assistant Prompt

Paste this at the start of a conversation with Claude, Gemini, Codex, or any AI assistant when working on a GTM analytics integration project.

---

## Prompt

You are helping me integrate multiple analytics platforms (GA4, Meta Pixel, CleverTap, Microsoft Clarity, Google Ads) into a web project using Google Tag Manager (GTM) as the single container.

### Project context
- GTM is the container. All events are pushed via `window.dataLayer.push()` from the website code
- GTM picks up dataLayer pushes and forwards them to each platform via tags
- Platforms that need an SDK (CleverTap, Clarity, Meta Pixel) are loaded via Custom HTML tags in GTM on All Pages with priority 10
- The bulk GTM setup script reads from `gtm_all_tags.md` and uses the Google Cloud GTM API (Node.js + googleapis library)

### Naming conventions — always enforce these
- DLV variables: `DLV - property_name` (e.g. `DLV - product_id`)
- Triggers: `PLATFORM - Event_Name` (e.g. `CT - ATB_PDP_Clicked`)
- Tags: `PLATFORM - Event_Name` (e.g. `CT - ATB_PDP_Clicked`)
- SDK Loader tags: `PLATFORM - SDK Loader` (e.g. `CT - SDK Loader`)
- Platform abbreviations: GA4, CT (CleverTap), MP (Meta Pixel), CL (Clarity), GADS (Google Ads)
- dataLayer keys: always snake_case (e.g. `product_id`, not `productId`)

### Critical rules — never break these
1. SDK Loader tags must always use an All Pages (Page View) trigger with NO filters and tag firing priority set to 10
2. All trigger event names must match `pushEvent()` calls exactly — case-sensitive
3. All dataLayer key names must match GTM DLV Data Layer Variable Names exactly — case-sensitive
4. Always call `pushEvent()` AFTER async actions succeed, not on button click
5. Never commit service account JSON or `.env` files to git
6. Always run `DRY_RUN=true node create-tag.js` before applying
7. Always Submit/Publish the GTM container after changes — Preview uses the saved draft, not the live container
8. Never edit IDE-specific rule files directly — always edit `plan.md` and regenerate

### dataLayer push utility
```typescript
export const pushEvent = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
```

### SDK Loader tag rules
Custom HTML, All Pages trigger (no filters), priority 10, `type="text/javascript"`.

CleverTap SDK Loader:
```html
<script type="text/javascript">
  var clevertap = {
    event: [], profile: [], account: [], onUserLogin: [],
    notifications: [], privacy: []
  };
  clevertap.account.push({ "id": "{{CT - Account ID}}" });
  clevertap.region = "in1";
  clevertap.privacy.push({ optOut: false });
  clevertap.privacy.push({ useIP: false });
  (function () {
    var wzrk = document.createElement('script');
    wzrk.type = 'text/javascript';
    wzrk.async = true;
    wzrk.src = 'https://d2r1yp2w7bby2u.cloudfront.net/js/clevertap.min.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wzrk, s);
  })();
</script>
```

### Environment credentials
Use a GTM Lookup Table variable (Variable Type: Lookup Table, Input Variable: Page Hostname) to map hostnames to credentials:
- `uat.yourclient.com` → UAT Account ID
- `www.yourclient.com` → PROD Account ID

### Testing order (always follow this)
1. `window.google_tag_manager` → must return object with container ID
2. `window.dataLayer` → must return array
3. SDK Loader tags in GTM Preview → must appear in Tags Fired on page load
4. `typeof clevertap` → `"object"`, `clevertap.account` → shows Account ID
5. Fire event → event row appears in GTM Preview with correct tag firing green
6. No DLVs showing `undefined` in Variables tab
7. Event appears in platform debugger within 10 seconds

### Debug decision tree
- `window.google_tag_manager` undefined → GTM snippet missing or Container ID not in script src
- GTM Preview won't connect → container not published, or site has auth protection
- Tag grey (not fired) → trigger event name mismatch (case-sensitive)
- DLV shows `undefined` → key name mismatch between pushEvent payload and GTM DLV name
- Tag fires but no event in platform → SDK Loader not firing — check trigger has no filters, priority is 10
- Wrong Account ID in platform → Lookup Table not resolving — check hostname matches exactly, container re-published

### Full documentation
See `docs/gtm-skill/plan.md` for the complete 6-phase skill documentation.

### Official documentation references
- GTM API: https://developers.google.com/tag-platform/tag-manager/api/v2
- CleverTap Web SDK: https://developer.clevertap.com/docs/web-quickstart-guide
- GA4 Events: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Meta Pixel: https://developers.facebook.com/docs/meta-pixel/
- Clarity: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
- Google Ads Conversions: https://support.google.com/google-ads/answer/6167168
