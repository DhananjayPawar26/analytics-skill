# Meta Pixel — Platform Reference

> 📖 [Meta Pixel Docs](https://developers.facebook.com/docs/meta-pixel/) · [Get Started](https://developers.facebook.com/docs/meta-pixel/get-started/) · [Standard Events](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/) · [Pixel Helper](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/)

---

## Base Pixel Tag (SDK Loader equivalent)

Tag type: Custom HTML · Trigger: All Pages (no filters) · Priority: 10

> ⚠️ This tag must fire before any event tags. The base pixel initialises `fbq` — without it, all event tags will throw `fbq is not defined`.

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

GTM's built-in All Pages trigger ID for scripts: `2147479553`

---

## Standard Event Tags

Standard events use `fbq('track', ...)` with a predefined event name:

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

Common standard events:

| Standard event         | Use case                                   |
| ---------------------- | ------------------------------------------ |
| `PageView`             | Every page load (auto-fired by base pixel) |
| `AddToCart`            | Add to bag / cart                          |
| `AddToWishlist`        | Wishlist toggle                            |
| `Purchase`             | Order confirmed                            |
| `InitiateCheckout`     | Checkout started                           |
| `Search`               | Search query submitted                     |
| `ViewContent`          | Product page viewed                        |
| `CompleteRegistration` | User registered                            |

---

## Custom Event Tags

Custom events use `fbq('trackCustom', ...)` with any event name:

```html
<script>
  fbq("trackCustom", "FilterApplied", {
    category: "{{DLV - cat_page}}",
    brand: "{{DLV - brand_page}}",
  });
</script>
```

Custom event names must be strings and cannot exceed 50 characters.

---

## Pixel Helper Chrome Extension

Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) to verify:

- Pixel is loaded on the page
- Events are firing with correct data
- No duplicate pixel fires

The extension icon shows the number of pixel events fired on the current page.

---

## Verify Meta Pixel loaded

```js
typeof fbq; // "function"

// Manually fire a test event
fbq("trackCustom", "Test_Direct", { test: "hello" });
// Check Pixel Helper — if this shows, base pixel is fine and any issue is GTM-side
```
