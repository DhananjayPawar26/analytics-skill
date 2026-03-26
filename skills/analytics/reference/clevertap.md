# CleverTap — Platform Reference

> 📖 [Web SDK Quickstart](https://developer.clevertap.com/docs/web-quickstart-guide) · [Region Codes](https://developer.clevertap.com/docs/region-codes) · [GTM Integration](https://developer.clevertap.com/docs/gtm-web) · [GitHub SDK](https://github.com/CleverTap/clevertap-web-sdk)

---

## SDK Loader Tag

Tag type: Custom HTML · Trigger: All Pages (no filters) · Priority: 10

```html
<script type="text/javascript">
  var clevertap = {
    event: [],
    profile: [],
    account: [],
    onUserLogin: [],
    notifications: [],
    privacy: [],
  };
  clevertap.account.push({ id: "{{CT - Account ID}}" });
  clevertap.region = "in1";
  clevertap.privacy.push({ optOut: false });
  clevertap.privacy.push({ useIP: false });
  (function () {
    var wzrk = document.createElement("script");
    wzrk.type = "text/javascript";
    wzrk.async = true;
    wzrk.src = "https://d2r1yp2w7bby2u.cloudfront.net/js/clevertap.min.js";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(wzrk, s);
  })();
</script>
```

---

## Region Codes

Check your CleverTap dashboard URL to determine your region:

| Dashboard URL                  | Region code                |
| ------------------------------ | -------------------------- |
| `in1.dashboard.clevertap.com`  | `in1`                      |
| `eu1.dashboard.clevertap.com`  | `eu1` (default if not set) |
| `us1.dashboard.clevertap.com`  | `us1`                      |
| `sg1.dashboard.clevertap.com`  | `sg1`                      |
| `aps3.dashboard.clevertap.com` | `aps3`                     |
| `mec1.dashboard.clevertap.com` | `mec1`                     |

Set the region before the SDK loads:

```js
clevertap.region = "in1";
```

---

## Event Tag

```html
<script>
  clevertap.event.push("Event_Name", {
    "Property Label": "{{DLV - property_key}}",
    "Another Property": "{{DLV - another_key}}",
  });
</script>
```

---

## User Profile (onUserLogin)

Fire this on login and registration only — not on every page.

**GTM tag — Custom HTML, trigger on `user_login` event:**

```html
<script>
  clevertap.onUserLogin.push({
    Site: {
      Name: "{{DLV - user_name}}",
      Identity: "{{DLV - user_id}}",
      Email: "{{DLV - user_email}}",
      Phone: "{{DLV - user_phone}}",
    },
  });
</script>
```

**Code-level push:**

```typescript
pushEvent("user_login", {
  user_id: user.id,
  user_name: user.name,
  user_email: user.email,
  user_phone: user.phone,
});
```

---

## Critical Rules

**Event name casing is permanent.** `Wishlist_clicked` and `Wishlist_Clicked` are two separate events in CleverTap. They cannot be merged and historical data cannot be moved. Triple-check casing before implementing.

**Properties with arrays** (order SKUs, product IDs in a bundle, STL product lists) — confirm with the client whether these should be comma-separated strings or JSON-stringified arrays. CleverTap handles them differently.

**`clevertap.event.push()` queues events** if the SDK hasn't fully loaded yet — events are not lost. But if the SDK Loader tag has a filter or wrong trigger, the queue never flushes.

---

## Debugger

1. CleverTap Dashboard → Settings → Integration → **Debugger**
2. Load your UAT page — your browser should appear as a device within 10 seconds
3. Click your device → events appear in real time as you fire them
4. Click any event to see all its properties

If your device doesn't appear:

- Confirm `typeof clevertap` returns `"object"` in console
- Confirm `clevertap.account` shows your Account ID (not `undefined`)
- Confirm the SDK Loader tag fired on page load in GTM Preview

---

## Verify SDK loaded

```js
typeof clevertap; // "object"
clevertap.account; // [{"id": "YOUR_ACCOUNT_ID"}]

// Manually fire a direct event to test SDK independently of GTM
clevertap.event.push("Test_Direct", { test: "hello" });
// Then check Debugger — if this appears, SDK is fine and any issue is GTM-side
```
