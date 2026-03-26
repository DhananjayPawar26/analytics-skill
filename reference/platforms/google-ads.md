# Google Ads — Platform Reference

> 📖 [Conversion Tracking Overview](https://support.google.com/google-ads/answer/1722022) · [Set Up Web Conversions](https://support.google.com/google-ads/answer/6167168) · [GTM + Google Ads Tag](https://support.google.com/tagmanager/answer/6105160) · [Enhanced Conversions](https://support.google.com/google-ads/answer/13261987)

---

## What you need

| Item                           | Where to find it                                               |
| ------------------------------ | -------------------------------------------------------------- |
| Conversion ID (`AW-XXXXXXXXX`) | Google Ads → Goals → Conversions → your conversion → Tag Setup |
| Conversion Label               | Same place as Conversion ID — unique per conversion action     |

---

## Conversion Tracking Tag (GTM)

1. Tags → New → Tag Type: **Google Ads: Conversion Tracking**
2. Conversion ID: `AW-XXXXXXXXX`
3. Conversion Label: your label
4. Conversion Value (optional): `{{DLV - order_total}}`
5. Transaction ID (optional): `{{DLV - order_number}}` — prevents duplicate conversions
6. Currency Code: `INR` (or your currency)
7. Trigger: your conversion event (e.g. `order_confirmed`)
8. Name: `GADS - Purchase`

> ⚠️ **Always include a Transaction ID** to prevent duplicate conversions being recorded when a user refreshes the confirmation page.

---

## Remarketing Tag (optional)

Fires on All Pages to build remarketing audiences:

1. Tags → New → Tag Type: **Google Ads: Remarketing**
2. Conversion ID: `AW-XXXXXXXXX`
3. Trigger: All Pages
4. Name: `GADS - Remarketing`

---

## Dynamic Remarketing (for e-commerce)

Passes product data to build dynamic product ads:

```html
<!-- GTM Custom HTML tag — trigger on product/cart pages -->
<script>
  gtag('event', 'view_item', {
    'send_to': 'AW-XXXXXXXXX',
    'value': {{DLV - product_price}},
    'items': [{
      'id': '{{DLV - product_id}}',
      'google_business_vertical': 'retail'
    }]
  });
</script>
```

---

## Conversion Linker Tag

Required for accurate conversion tracking — ensures the GCLID (Google Click ID) from ad clicks is captured:

1. Tags → New → Tag Type: **Conversion Linker**
2. Trigger: All Pages
3. Name: `GADS - Conversion Linker`

> Create this tag before any conversion tracking tags. Without it, conversions may not be attributed to the correct ad click.

---

## Verify Google Ads conversion firing

1. Click a Google Ad to land on your site (or use Google Tag Assistant)
2. Complete the conversion action
3. Google Ads → Goals → Conversions → your conversion → check **Recent conversions**
4. Note: conversions may take up to 24 hours to appear in Google Ads reports

```js
// Check GTM is loaded (Google Ads tags fire via GTM)
window.google_tag_manager;

// In Network tab, filter for:
// googleadservices.com/pagead/conversion
// Each request is one Google Ads conversion ping
```
