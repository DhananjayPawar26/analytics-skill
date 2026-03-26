# Phase 6: Publishing

---

## Save vs Preview vs Publish

| Action           | What it does                           | Visible to live site? |
| ---------------- | -------------------------------------- | --------------------- |
| Save             | Saves changes to workspace draft       | No                    |
| Preview          | Tests current draft in a debug session | No (debug only)       |
| Submit → Publish | Creates a version and pushes to live   | Yes                   |

> ⚠️ **GTM Preview always reflects the last saved state — not the last published version. Changes only go live after Publish. Always save before previewing, and always publish after all testing passes.**

---

## Publishing Steps (GTM Dashboard)

1. GTM → **Submit** (top right)
2. Select **Publish and Create Version**
3. Version Name: descriptive — e.g. `CT + GA4 PDP events - Phase 1`
4. Version Description: list what was added or changed
5. Publish to: **Live**
6. Click **Publish**

---

## Publishing via Script

```bash
# Auto-generated version name
node publish.js

# Custom version name and description
node publish.js "Phase 1 - PDP events" "Added ATB, Wishlist, pincode, tab events"
```

---

## UAT vs Production Strategy

Use the Lookup Table variable approach (set up in Phase 3a):

- One GTM container handles both environments
- Credentials switch automatically based on `Page Hostname`
- No separate GTM containers needed for UAT and production

**Lookup Table setup:**

| Input (hostname)     | Output            |
| -------------------- | ----------------- |
| `uat.yourclient.com` | `UAT_ACCOUNT_ID`  |
| `www.yourclient.com` | `PROD_ACCOUNT_ID` |

Test on UAT first, then publish with the same container — the Lookup Table handles the credential switch automatically.

---

## Pre-Publish Checklist

- [ ] All SDK Loader tags: All Pages trigger, no filters, priority 10
- [ ] All DLV names match code keys exactly (case-sensitive)
- [ ] All trigger event names match `pushEvent()` calls exactly (case-sensitive)
- [ ] Lookup Table has correct credentials for both UAT and production hostnames
- [ ] No duplicate triggers or tags in workspace
- [ ] GTM Preview tested — all events verified before publishing
- [ ] Version name and description filled in
- [ ] Team notified of publish (in case rollback is needed)
