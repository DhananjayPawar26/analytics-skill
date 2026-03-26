# GA4 — Platform Reference

> 📖 [GA4 Tag in GTM](https://support.google.com/tagmanager/answer/9442095) · [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events) · [GA4 DebugView](https://support.google.com/analytics/answer/7201382) · [GA4 Event Limits](https://support.google.com/analytics/answer/9267744)

---

## GTM Tag Types

| Tag type string | Use for                 |
| --------------- | ----------------------- |
| `gaawe`         | GA4 Event tag (current) |
| `gaawc`         | GA4 Configuration tag   |

Always use `gaawe` for event tags — not the older `gaawc`.

---

## Configuration Tag

Create one GA4 Configuration tag that fires on All Pages:

1. Tags → New → Tag Type: **Google Analytics: GA4 Configuration**
2. Measurement ID: `G-XXXXXXXX`
3. Trigger: All Pages
4. Name: `GA4 - Configuration`

---

## Event Tag (GTM Dashboard)

1. Tags → New → Tag Type: **Google Analytics: GA4 Event**
2. Configuration Tag: select your GA4 Configuration tag
3. Event Name: e.g. `ATB_PDP_Clicked`
4. Event Parameters: add each property mapping DLV → GA4 parameter name
5. Trigger: matching custom event trigger
6. Name: `GA4 - ATB_PDP_Clicked`

**Parameter name rules:**

- Must be `snake_case`
- Max 40 characters
- No spaces or special characters
- Names starting with `firebase_`, `google_`, or `ga_` are reserved

---

## Event Tag (via script)

The `create-tag.js` script automatically normalises property labels to snake_case parameter names:

```js
// "Product Name" → "product_name"
// "FOY_Hotlist" → "foy_hotlist"
// "Cart Total Discount" → "cart_total_discount"
```

---

## Limits

| Limit                       | Value          |
| --------------------------- | -------------- |
| Custom parameters per event | 25             |
| Parameter name length       | 40 characters  |
| Parameter value length      | 100 characters |
| User properties per event   | 25             |

> The `create-tag.js` script warns automatically if any event exceeds 25 parameters.

---

## PII Policy

GA4 must not receive PII (personally identifiable information). Never send:

- Full name
- Email address
- Phone number
- Precise location

> The `create-tag.js` script warns if any properties appear to contain PII (name, email, phone, address).

---

## DebugView

1. GA4 → Admin → DebugView
2. On your site, add `?_ga_debug=1` to the URL or use the GA4 DebugView Chrome extension
3. Events appear in real time within a few seconds of firing
4. Click any event to see all its parameters

---

## Verify GA4 is receiving events

```js
// Confirm GA4 configuration tag fired
window.google_tag_manager; // should show your GTM container

// GA4 doesn't expose a direct JS object like CleverTap
// Use DebugView or the Network tab in DevTools:
// Filter for requests to: www.google-analytics.com/g/collect
// Each request is one GA4 event
```
