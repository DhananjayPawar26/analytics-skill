# Phase 5: Testing & Debugging

> 📖 [GTM Preview Mode](https://support.google.com/tagmanager/answer/6107056) · [GA4 DebugView](https://support.google.com/analytics/answer/7201382) · [Meta Pixel Helper](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/) · [CleverTap Debugger](https://developer.clevertap.com/docs/web-quickstart-guide#testing-your-integration) · [Clarity Setup Verification](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#verify-clarity-is-installed)

---

## Tools

| Tool                   | Purpose                       | How to access                                    |
| ---------------------- | ----------------------------- | ------------------------------------------------ |
| GTM Preview            | See which tags fire per event | GTM → Preview → enter your URL                   |
| Tag Assistant (Chrome) | Alternative for deployed URLs | Chrome Web Store → Tag Assistant                 |
| CleverTap Debugger     | Verify CT events received     | CT Dashboard → Settings → Integration → Debugger |
| GA4 DebugView          | Verify GA4 events received    | GA4 → Admin → DebugView                          |
| Meta Pixel Helper      | Verify Meta events            | Chrome Web Store → Meta Pixel Helper             |
| Clarity Dashboard      | Verify Clarity sessions       | Clarity → your project → Recordings              |

---

## Testing Flow — always in this order

### 1. Verify GTM container loads

```js
window.google_tag_manager;
// Expected: { "GTM-XXXXXXX": { dataLayer: {...} } }

document.querySelector('script[src*="googletagmanager"]').src;
// Expected: "https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX"

window.dataLayer;
// Expected: array (even if empty)
```

### 2. Verify SDK Loader tags fire on page load

In GTM Preview → Tags Fired on page load:

- `CT - SDK Loader` ✅
- `MP - Base Pixel` ✅
- `CL - SDK Loader` ✅

Then in browser console:

```js
typeof clevertap; // "object"
clevertap.account; // [{"id": "YOUR_ACCOUNT_ID"}]
typeof clarity; // "function"
typeof fbq; // "function"
```

### 3. Fire each event and verify in GTM Preview

1. Perform the action on the page
2. New event row appears in GTM Preview left panel
3. Click the row → **Tags** tab → correct tag shows **Succeeded** (green)
4. Click **Variables** tab → all DLVs show real values, not `undefined`

### 4. Verify in platform debugger (within 5–10 seconds)

- **CleverTap:** device appears in Debugger → click it → event listed with all properties
- **GA4:** DebugView shows event with all parameters
- **Meta:** Pixel Helper shows event fired with correct data

---

## Debug Decision Tree

```
window.google_tag_manager is undefined?
└── GTM snippet missing OR Container ID not in script src URL
    Fix: check layout file has GTM snippet, check NEXT_PUBLIC_GTM_ID is set and redeployed

GTM Preview won't connect to your URL?
└── Container not published, OR site has auth/password protection
    Fix: publish the container first; use Tag Assistant extension for password-protected URLs

Event row does NOT appear in GTM Preview?
└── pushEvent() not being called
    Fix: add console.log before pushEvent() — confirm the handler fires
    Check: window.dataLayer shows the event after the action

Event row appears but tag is grey (Not Fired)?
└── Trigger event name mismatch — case-sensitive
    Fix: compare exact string in pushEvent('...') vs GTM trigger Event Name field

Tag fires (green) but DLV shows undefined in Variables tab?
└── Key name mismatch between pushEvent payload and GTM DLV name
    Fix: check snake_case consistency, e.g. pushing `productId` but DLV expects `product_id`

Tag fires, DLV populated, but no event in platform dashboard?
└── SDK Loader not firing
    Fix: check CT - SDK Loader is in Tags Fired on page load
    Check: All Pages trigger has NO filters
    Check: Tag firing priority is 10
    Check: script type is text/javascript not text/gtmscript

SDK Loader fires but wrong Account ID shown?
└── Lookup Table variable not resolving
    Fix: hostname in Lookup Table must match exactly (no https://, no trailing slash)
    Check: container was published after editing the Lookup Table
    Verify: switch to Values view in GTM Preview Tag Details
```

---

## Quick Console Commands

```js
// Confirm GTM loaded with correct container ID
window.google_tag_manager;

// See entire dataLayer history
window.dataLayer;

// See last pushed event
window.dataLayer[window.dataLayer.length - 1];

// Confirm CleverTap SDK loaded with correct account
clevertap.account;

// Manually fire a direct CleverTap event (bypasses GTM — isolates platform vs GTM issue)
clevertap.event.push("Test_Direct", { test_prop: "hello" });

// Confirm Clarity loaded
typeof clarity; // "function"

// Confirm Meta Pixel loaded
typeof fbq; // "function"
```

---

## Checklist

- [ ] `window.google_tag_manager` returns container ID
- [ ] All SDK Loader tags in Tags Fired on page load
- [ ] `clevertap`, `clarity`, `fbq` all return correct types in console
- [ ] Every event tested — row appears in GTM Preview
- [ ] Every tag shows Succeeded (green)
- [ ] No DLVs showing `undefined`
- [ ] All events verified in respective platform debuggers with correct property values
