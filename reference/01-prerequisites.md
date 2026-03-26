# Phase 1: Prerequisites

## IDs to collect before starting

| Platform   | ID Type                       | Where to find it                                                                    |
| ---------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| GTM        | Container ID (`GTM-XXXXXXX`)  | [tagmanager.google.com](https://tagmanager.google.com) → Admin → Container Settings |
| GA4        | Measurement ID (`G-XXXXXXXX`) | GA4 → Admin → Data Streams → your stream                                            |
| Meta Pixel | Pixel ID                      | Meta Events Manager → your pixel                                                    |
| CleverTap  | Account ID                    | CleverTap Dashboard → Settings → Integration                                        |
| Clarity    | Project ID                    | Clarity Dashboard → Settings → Overview                                             |
| Google Ads | Conversion ID + Label         | Google Ads → Goals → Conversions → your conversion                                  |

---

## Create GTM Account and Container

> 📖 [GTM Container Setup](https://support.google.com/tagmanager/answer/6103696)

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Create Account → set Account Name to client name
3. Create Container → set Container Name to website name, Target Platform: **Web**
4. Note the Container ID (`GTM-XXXXXXX`) — this goes into the website code

---

## Google Cloud Setup (for bulk scripts)

> 📖 [Google Cloud IAM](https://cloud.google.com/iam/docs/service-accounts-create) · [Enable GTM API](https://console.cloud.google.com/apis/library/tagmanager.googleapis.com)

### Step 1 — Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. New Project → name it `gtm-api-{clientname}`
3. Note the Project ID

### Step 2 — Enable Tag Manager API

APIs & Services → Library → search **Tag Manager API** → Enable

### Step 3 — Create Service Account

1. IAM & Admin → Service Accounts → Create Service Account
2. Name: `gtm-{clientname}` → Create and Continue
3. Skip role assignment here (permissions are granted inside GTM)
4. Done → click the created service account → **Keys** tab → Add Key → JSON
5. Download the JSON file — store securely

> ⚠️ **Never commit the JSON key to git. Add it to `.gitignore` immediately. If exposed, rotate the key in Google Cloud IAM right away.**

### Step 4 — Grant access inside GTM

1. GTM → Admin → **User Management** (at Container level, not Account level)
2. Add user → paste the `client_email` from the JSON file
3. Permission: **Publish**
4. Save

---

## Naming Conventions

Enforce these across the entire team — inconsistency causes silent failures.

| Item            | Convention              | Example                    |
| --------------- | ----------------------- | -------------------------- |
| DLV variables   | `DLV - property_name`   | `DLV - product_id`         |
| Triggers        | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked`     |
| Tags            | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked`     |
| SDK Loader tags | `PLATFORM - SDK Loader` | `CT - SDK Loader`          |
| dataLayer keys  | `snake_case`            | `product_id`, `cart_total` |

**Platform abbreviations:** `GA4`, `CT` (CleverTap), `MP` (Meta Pixel), `CL` (Clarity), `GADS` (Google Ads)

---

## Checklist

- [ ] All platform IDs collected and stored securely
- [ ] GTM account and container created, Container ID noted
- [ ] Google Cloud project created, Tag Manager API enabled
- [ ] Service account created, JSON key downloaded and gitignored
- [ ] Service account email granted Publish access in GTM
- [ ] Naming conventions shared with the team
