# Phase 4: Website Integration

> 📖 [Install GTM](https://support.google.com/tagmanager/answer/6103696) · [dataLayer Guide](https://developers.google.com/tag-platform/tag-manager/datalayer) · [next/script](https://nextjs.org/docs/app/api-reference/components/script) · [@next/third-parties](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-tag-manager)

---

## Step 1 — Install the GTM Snippet

### Vanilla JS (any framework)

Add to `<head>` on every page:

```html
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>
```

Add immediately after `<body>`:

```html
<noscript
  ><iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
  ></iframe
></noscript>
```

### Next.js App Router

```tsx
// app/layout.tsx
import { GoogleTagManager } from "@next/third-parties/google";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleTagManager gtmId={GTM_ID} /> {/* outside all providers */}
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

> ⚠️ **Place GTM outside all context providers.** Nesting it inside providers can cause it to load late or not inject correctly.
> The env var must be prefixed `NEXT_PUBLIC_` to be available in the browser.
> After adding the env var to Vercel/hosting, a new deployment is required.

---

## Step 2 — Create the pushEvent Utility

```typescript
// lib/gtm.ts
export const pushEvent = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined") return; // SSR guard
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};
```

Add the `dataLayer` type to `global.d.ts` or `types/window.d.ts`:

```typescript
interface Window {
  dataLayer: Record<string, unknown>[];
}
```

---

## Step 3 — Implement Events

### When to call pushEvent

| Event type                                 | When to call                                        |
| ------------------------------------------ | --------------------------------------------------- |
| After async action (cart, wishlist, order) | Inside `.then()` or after `await` — only on success |
| UI interaction (tab click, nav click)      | Inside the onClick handler directly                 |
| Page load / view event                     | Inside `useEffect` with empty dependency array      |
| Form submission                            | After successful API response, not on button click  |

### Key naming rules

- All dataLayer keys must match the GTM DLV Data Layer Variable Name **exactly** — case-sensitive
- Use `snake_case` for all keys: `product_id`, `cart_total`, not `productId` or `CartTotal`
- The `event` key value must match the GTM trigger Event Name exactly

### Example — mapping API response to dataLayer push

```typescript
// lib/events/pdp.ts
import { pushEvent } from "@/lib/gtm";

export const trackATBPDP = (
  product: Product,
  variant: Variant,
  quantity: number,
) => {
  pushEvent("ATB_PDP_Clicked", {
    url: window.location.href,
    product_name: product.title,
    product_id: product.id,
    handle: product.handle,
    sku: variant.sku,
    category: product.collection?.title ?? "",
    product_price: variant.prices?.[0]?.amount / 100,
    discounted_price: variant.calculated_price?.calculated_amount / 100,
    quantity,
  });
};
```

### Organise event files by page

```
lib/
└── events/
    ├── any-page.ts
    ├── pdp.ts
    ├── cart.ts
    ├── navigation.ts
    ├── account.ts
    └── mappers/
        ├── mapProductContext.ts
        ├── mapCartContext.ts
        └── mapUserContext.ts
```

---

## Checklist

- [ ] GTM snippet added to all pages (head + noscript body)
- [ ] GTM ID comes from environment variable, not hardcoded
- [ ] `pushEvent` utility created with SSR guard
- [ ] `Window.dataLayer` typed in global.d.ts
- [ ] All event keys match GTM DLV names exactly (case-sensitive)
- [ ] `pushEvent` called after async actions succeed, not on click
- [ ] Event files organised by page/section with shared mappers
