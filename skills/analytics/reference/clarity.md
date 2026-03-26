# Microsoft Clarity — Platform Reference

> 📖 [Clarity Overview](https://learn.microsoft.com/en-us/clarity/setup-and-installation/about-clarity) · [Manual Setup](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) · [Clarity Client API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api) · [GTM Integration](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#google-tag-manager)

---

## What Clarity does

Clarity is a **session recording and heatmap tool** — it does not receive custom events the same way CleverTap or GA4 do. It works by:

- Recording user sessions (clicks, scrolls, rage clicks, dead clicks)
- Generating heatmaps per page
- Allowing custom tagging to filter/segment sessions by user attributes

---

## SDK Loader Tag

Tag type: Custom HTML · Trigger: All Pages (no filters) · Priority: 10

```html
<script type="text/javascript">
  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "{{CL - Project ID}}");
</script>
```

---

## Custom Tagging (User Identification)

Use the Clarity API to tag sessions with user attributes. Fire this **after login events only** — not on every page.

**GTM tag — Custom HTML, trigger on `user_login` event:**

```html
<script>
  clarity("set", "userId", "{{DLV - user_id}}");
  clarity("set", "userEmail", "{{DLV - user_email}}");
</script>
```

This allows you to filter Clarity recordings by user ID in the dashboard.

---

## Smart Events API

Clarity supports tracking custom interactions via the event API:

```html
<script>
  clarity("event", "ATB_PDP_Clicked");
</script>
```

These appear as Smart Events in the Clarity dashboard and can be used to filter recordings. This is separate from the CleverTap/GA4 event push — it's optional and just for Clarity session filtering.

---

## Project ID

Find your Project ID in Clarity Dashboard → Settings → **Overview**.

---

## Verify Clarity loaded

```js
typeof clarity; // "function"

// Manually fire a test tag
clarity("set", "testKey", "testValue");
// Check Clarity dashboard Recordings — sessions appear within a few minutes
```

---

## Notes

- Clarity is **free with no data limits** on sessions
- Data appears in the dashboard within a few minutes (not real-time like CleverTap Debugger)
- Clarity should not be used on websites targeting users under 18
- Clarity automatically masks sensitive content (inputs, numbers, emails) by default
