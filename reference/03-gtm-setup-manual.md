# Phase 3a: GTM Setup — Manual (Dashboard)

> 📖 [GTM Variables](https://support.google.com/tagmanager/answer/7683362) · [GTM Triggers](https://support.google.com/tagmanager/answer/7679316) · [GTM Tags](https://support.google.com/tagmanager/answer/6106716) · [dataLayer Guide](https://developers.google.com/tag-platform/tag-manager/datalayer)

---

## Step 1 — Create Data Layer Variables (DLVs)

For each property in the events list:

1. Variables → User-Defined Variables → **New**
2. Variable Type: **Data Layer Variable**
3. Data Layer Variable Name: exact key name (e.g. `product_id`) — must match what's pushed from code
4. GTM Variable Name: `DLV - product_id`
5. Data Layer Version: **Version 1**
6. Save

---

## Step 2 — Create the Lookup Table Variable (credentials)

Used to switch between UAT and production Account IDs per platform:

1. Variables → New → Variable Type: **Lookup Table**
2. Name: `CT - Account ID` (create one per SDK platform)
3. Input Variable: `{{Page Hostname}}`
4. Add rows:
   - Input: `uat.yourclient.com` → Output: `UAT_ACCOUNT_ID`
   - Input: `www.yourclient.com` → Output: `PROD_ACCOUNT_ID`
5. Save

---

## Step 3 — Create SDK Loader Tags

Required for: **CleverTap, Clarity, Meta Pixel**

**Rules that must always be followed:**

- Tag type: **Custom HTML**
- Trigger: **All Pages (Page View)** — must have **no filters**
- Tag firing priority: **10**
- Script type: `text/javascript` (never `text/gtmscript`)

**CleverTap SDK Loader:**

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

**Clarity SDK Loader:**

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

**Meta Pixel Base:**

```html
<script type="text/javascript">
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
  );
  fbq("init", "{{MP - Pixel ID}}");
  fbq("track", "PageView");
</script>
```

---

## Step 4 — Create GA4 Configuration Tag

> 📖 [GA4 Tag in GTM](https://support.google.com/tagmanager/answer/9442095)

1. Tags → New → Tag Type: **Google Analytics: GA4 Configuration**
2. Measurement ID: your `G-XXXXXXXX`
3. Trigger: **All Pages**
4. Name: `GA4 - Configuration`
5. Save

---

## Step 5 — Create Custom Event Triggers

One trigger per event:

1. Triggers → New → Trigger Type: **Custom Event**
2. Event Name: exact event name — e.g. `ATB_PDP_Clicked`
3. Name: `CT - ATB_PDP_Clicked`
4. Save

> ⚠️ **The event name must match the `event` key pushed from code character-for-character including casing. This is the most common source of tags not firing.**

---

## Step 6 — Create Event Tags

**CleverTap event tag:**

```html
<script>
  clevertap.event.push("ATB_PDP_Clicked", {
    "Product Name": "{{DLV - product_name}}",
    "Product ID": "{{DLV - product_id}}",
    SKU: "{{DLV - sku}}",
    Price: "{{DLV - product_price}}",
  });
</script>
```

**GA4 event tag:** Tag type → `Google Analytics: GA4 Event` → set event name → add parameters mapping DLV names to GA4 parameter names.

**Meta Pixel event tag:**

```html
<script>
  fbq('track', 'AddToCart', {
    content_ids: ['{{DLV - product_id}}'],
    content_type: 'product',
    value: {{DLV - product_price}},
    currency: 'INR'
  });
</script>
```

**Google Ads conversion tag:** Tag type → `Google Ads: Conversion Tracking` → enter Conversion ID and Conversion Label.

---

## Checklist

- [ ] All DLV variables created
- [ ] Lookup Table variable created for each SDK platform (UAT + prod)
- [ ] SDK Loader tags: All Pages trigger, no filters, priority 10
- [ ] GA4 Configuration tag created on All Pages
- [ ] All event triggers created — event names match exactly
- [ ] All event tags created with correct DLV references
- [ ] No duplicate triggers or tags
