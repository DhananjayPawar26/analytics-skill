# Phase 2: Events Planning

## Option A — Generate a template to send to the client

Share an Excel file with these columns:

| Column        | Description                                          | Example                           |
| ------------- | ---------------------------------------------------- | --------------------------------- |
| `Page`        | Which page this event fires on                       | `PDP`, `Cart`, `Any Page`         |
| `Event Name`  | Exact event name for GTM (case-sensitive, no spaces) | `ATB_PDP_Clicked`                 |
| `Description` | What user action triggers this event                 | `User clicks Add to Bag on PDP`   |
| `Properties`  | Comma-separated property names                       | `product_id, product_name, price` |
| `Platforms`   | Which platforms receive this event                   | `GA4, CT, MP`                     |

Multiple sheets are fine — one per page section (Any Page, PDP, Cart, Navigation).

---

## Option B — Client provides their own Excel file

When a client file arrives, do this before implementing anything:

1. Read all sheets — list every sheet name to confirm scope
2. For each sheet extract: event names, descriptions, and all property columns
3. **Flag every ambiguity** before proceeding:

| Issue                 | Example                                  | Action                                                            |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Duplicate event names | Same name in two sheets                  | Confirm if intentional or merge                                   |
| Casing conflicts      | `Wishlist_clicked` vs `Wishlist_Clicked` | CleverTap treats these as separate events — confirm intended name |
| Typos in event names  | `Serarch_Query_Searched`                 | Typos are permanent — confirm correction before implementing      |
| Special characters    | `TopBar_Bath&Body_Clicked`               | `&` causes issues — recommend `TopBar_BathBody_Clicked`           |
| Placeholder names     | `Hamburger_<L1>_clicked`                 | Needs a `menu_item` property instead of per-item events           |
| Ambiguous rows        | `EventA OR EventB` in one cell           | Two separate events — split them                                  |
| Missing properties    | Event name with no properties listed     | Confirm with client before building                               |

> ⚠️ **Never implement events from a client file without resolving all ambiguities first. Event names in CleverTap and GA4 are permanent and cannot be renamed without losing historical data.**

---

## GTM Setup Plan Output

After parsing the events file, produce a `gtm_all_tags.md` file with:

- Complete DLV list (GTM variable name + data layer key)
- Complete trigger list (trigger name + event name)
- Complete tag HTML for each event per platform

This file serves two purposes:

1. Developer review before GTM work starts
2. Input file for the bulk push script in Phase 3b

---

## gtm_all_tags.md Format

Each event is a `clevertap.event.push()` block inside a ` ```html ` code block:

```html
<script>
  clevertap.event.push("ATB_PDP_Clicked", {
    URL: "{{DLV - url}}",
    "Product Name": "{{DLV - product_name}}",
    "Product ID": "{{DLV - product_id}}",
    SKU: "{{DLV - sku}}",
    "Cart Total": "{{DLV - cart_total}}",
  });
</script>
```

For events sharing the same property shape, use annotations instead of duplicating:

```
Duplicate for: `View_Bundle_clicked`, `Wishlist_clicked`
```

The bulk script reads these annotations and clones the property shape to all listed events automatically.

---

## Checklist

- [ ] All ambiguities in client file flagged and resolved
- [ ] Clean event list signed off
- [ ] `gtm_all_tags.md` produced with all DLVs, triggers, and tag HTML
- [ ] `gtm_all_tags.md` reviewed before running any script
