# GTM All Tags — [PROJECT NAME]

This file is the input for `create-tag.js`. The script parses all `clevertap.event.push()` blocks to extract event names and properties, then creates the corresponding GTM variables, triggers, and tags automatically.

**How to use:**
1. Replace `[PROJECT NAME]` above with your project name
2. Add your event definitions below following the format shown
3. Run `DRY_RUN=true node create-tag.js` to preview
4. Run `node create-tag.js` to apply

**Format rules:**
- Each event must be in a `clevertap.event.push("EventName", { ... })` block inside a ```html code block
- Property values must use `{{DLV - key_name}}` format — these become GTM DLV references
- For events sharing the same property shape, use "Apply to:" or "Duplicate for:" annotations — the script will clone the shape to all listed event names
- Event names are case-sensitive and permanent — double-check before applying

---

## SHEET: Any Page

### CT - ATB_Prod_Card_Clicked
```html
<script>
clevertap.event.push("ATB_Prod_Card_Clicked", {
  "URL": "{{DLV - url}}",
  "Product Name": "{{DLV - product_name}}",
  "Product ID": "{{DLV - product_id}}",
  "Handle": "{{DLV - handle}}",
  "SKU": "{{DLV - sku}}",
  "Category": "{{DLV - category}}",
  "Product Price": "{{DLV - product_price}}",
  "Discounted Price": "{{DLV - discounted_price}}",
  "Quantity": "{{DLV - quantity}}",
  "User ID": "{{DLV - user_id}}",
  "User Name": "{{DLV - user_name}}",
  "Cart Total": "{{DLV - cart_total}}",
  "Cart Item Count": "{{DLV - cart_item_count}}",
  "Cart Total Discount": "{{DLV - cart_total_discount}}"
});
</script>
```

---

## SHEET: PDP

### CT - ATB_PDP_Clicked
```html
<script>
clevertap.event.push("ATB_PDP_Clicked", {
  "URL": "{{DLV - url}}",
  "Product Name": "{{DLV - product_name}}",
  "Product ID": "{{DLV - product_id}}",
  "Handle": "{{DLV - handle}}",
  "SKU": "{{DLV - sku}}",
  "Category": "{{DLV - category}}",
  "Product Price": "{{DLV - product_price}}",
  "Discounted Price": "{{DLV - discounted_price}}",
  "Quantity": "{{DLV - quantity}}",
  "User ID": "{{DLV - user_id}}",
  "Cart Total": "{{DLV - cart_total}}",
  "Cart Item Count": "{{DLV - cart_item_count}}",
  "Cart Total Discount": "{{DLV - cart_total_discount}}"
});
</script>
```

---

> Add more event sheets below following the same pattern.
> See `docs/gtm-skill/plan.md` Phase 2 for the full events planning guide.
