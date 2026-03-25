# GTM Multi-Analytics Integration Skill
**Version:** 1.0  
**Platforms:** GA4 · Meta Pixel · CleverTap · Microsoft Clarity · Google Ads  
**Stack:** Framework agnostic (Next.js notes included)  
**Script language:** Node.js

---

## How to use this skill
This skill is structured in 6 modular phases. Each phase is independent — jump to whichever phase is relevant to where you are in a project. Each phase ends with a completion checklist.

---

## Phase 1: Prerequisites

> 📚 **Official Docs:**
> - GTM: [tagmanager.google.com](https://tagmanager.google.com) · [GTM API Overview](https://developers.google.com/tag-platform/tag-manager/api/v2) · [GTM API Developer Guide](https://developers.google.com/tag-platform/tag-manager/api/v2/devguide) · [GTM API Reference](https://developers.google.com/tag-platform/tag-manager/api/reference/rest)
> - GA4: [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153) · [GTM + GA4 Setup](https://support.google.com/tagmanager/answer/6107124)
> - Meta Pixel: [Meta Pixel Docs](https://developers.facebook.com/docs/meta-pixel/) · [Get Started](https://developers.facebook.com/docs/meta-pixel/get-started/)
> - CleverTap: [Web SDK Overview](https://developer.clevertap.com/docs/web-overview) · [Web Quickstart Guide](https://developer.clevertap.com/docs/web-quickstart-guide) · [GTM Web Integration](https://developer.clevertap.com/docs/gtm-web)
> - Clarity: [Clarity Docs](https://learn.microsoft.com/en-us/clarity/) · [Setup Guide](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) · [Clarity API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api)
> - Google Ads: [Conversion Tracking Setup](https://support.google.com/google-ads/answer/6167168) · [GTM + Google Ads](https://support.google.com/tagmanager/answer/6105160)

### 1.1 Collect all IDs before starting

| Platform | ID Type | Where to find it |
|---|---|---|
| GTM | Container ID (`GTM-XXXXXXX`) | tagmanager.google.com → Admin → Container Settings |
| GA4 | Measurement ID (`G-XXXXXXXX`) | GA4 → Admin → Data Streams → your stream |
| Meta Pixel | Pixel ID | Meta Events Manager → your pixel |
| CleverTap | Account ID | CleverTap Dashboard → Settings → Integration |
| Clarity | Project ID | Clarity Dashboard → Settings → Overview |
| Google Ads | Conversion ID + Label | Google Ads → Goals → Conversions → your conversion |

### 1.2 Create GTM Account and Container
> 📖 [GTM Container Setup Docs](https://support.google.com/tagmanager/answer/6103696)
1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Create Account → set Account Name to client name
3. Create Container → set Container Name to website name, Target Platform: Web
4. Note the Container ID (`GTM-XXXXXXX`) — this goes into the website code

### 1.3 Set up Google Cloud for bulk script access
> 📖 [Google Cloud IAM Docs](https://cloud.google.com/iam/docs/service-accounts-create) · [Enable GTM API](https://console.cloud.google.com/apis/library/tagmanager.googleapis.com) · [GTM API Auth Guide](https://developers.google.com/tag-platform/tag-manager/api/v2/devguide#environment)

#### Step 1 — Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. New Project → name it e.g. `gtm-api-{clientname}`
3. Note the Project ID

#### Step 2 — Enable Tag Manager API
1. APIs & Services → Library → search "Tag Manager API" → Enable

#### Step 3 — Create Service Account
1. IAM & Admin → Service Accounts → Create Service Account
2. Name: `gtm-{clientname}` → Create
3. Role: skip (permissions are granted inside GTM, not here)
4. Done → click the created service account → Keys tab → Add Key → JSON
5. Download the JSON file — store securely, never commit to git

> ⚠️ **The JSON file contains a private key. Never commit it to version control. Add it to `.gitignore` immediately. If exposed, rotate the key immediately in Google Cloud.**

The JSON structure looks like this (sensitive values redacted):
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "REDACTED",
  "private_key": "REDACTED",
  "client_email": "gtm-clientname@your-project-id.iam.gserviceaccount.com",
  "client_id": "REDACTED",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

#### Step 4 — Grant service account access in GTM
1. GTM → Admin → User Management (at Container level, not Account level)
2. Add user → paste the `client_email` from the JSON file
3. Permission: **Publish** (needed for publish.js) or **Edit** (for setup only)
4. Save

### 1.4 Naming Conventions (enforce across team)

| Item | Convention | Example |
|---|---|---|
| DLV Variables | `DLV - property_name` | `DLV - product_id` |
| Triggers | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked` |
| Tags | `PLATFORM - Event_Name` | `CT - ATB_PDP_Clicked` |
| SDK Loader tags | `PLATFORM - SDK Loader` | `CT - SDK Loader` |

**Platform abbreviations:**
- `GA4` — Google Analytics 4
- `CT` — CleverTap
- `MP` — Meta Pixel
- `CL` — Clarity
- `GADS` — Google Ads
- `CE` — Custom Event (for triggers used across multiple platforms)

### Phase 1 Checklist
- [ ] All platform IDs collected and stored securely
- [ ] GTM account and container created, Container ID noted
- [ ] Google Cloud project created, Tag Manager API enabled
- [ ] Service account created, JSON key downloaded
- [ ] JSON key added to `.gitignore`
- [ ] Service account email granted Publish access in GTM
- [ ] Naming convention shared with team

---

## Phase 2: Events Planning

### 2.1 Client Events File

#### Option A — Generate a template to send to the client
Share this template Excel file with the client. It must have these columns:

| Column | Description | Example |
|---|---|---|
| `Page` | Which page this event fires on | `PDP`, `Cart`, `Any Page` |
| `Event Name` | Exact event name for GTM (case-sensitive, no spaces) | `ATB_PDP_Clicked` |
| `Description` | What user action triggers this event | `User clicks Add to Bag on PDP` |
| `Properties` | Comma-separated property names | `product_id, product_name, price` |
| `Platforms` | Which platforms receive this event | `GA4, CT, MP` |

Multiple sheets are allowed — one per page section (e.g. Any Page, PDP, Cart, Navigation).

#### Option B — Client has provided their own Excel file
When a client provides their own format, follow this process before implementing anything:

1. Read all sheets — list all sheet names to the developer
2. For each sheet, extract: event names, descriptions, and all property columns
3. Flag the following before proceeding:
   - **Duplicate event names** across sheets
   - **Casing conflicts** — e.g. `Wishlist_clicked` vs `Wishlist_Clicked` (CleverTap treats these as separate events)
   - **Typos in event names** — typos get baked into CleverTap/GA4 permanently
   - **Special characters** in event names — `&`, `/`, spaces all cause issues
   - **Placeholder names** — e.g. `<L1>_clicked` need clarification before implementing
   - **Ambiguous rows** — e.g. `EventA OR EventB` in one cell = two separate events
   - **Missing properties** — rows with event name but no properties listed
4. Produce a clean structured summary and get developer/client sign-off before Phase 3

> ⚠️ **Never implement events from a client file without resolving all ambiguities first. Event names in CleverTap and GA4 are permanent and cannot be renamed without losing historical data.**

### 2.2 GTM Setup Plan Output
After parsing the events file, produce a `gtm_all_tags.md` file with:
- Complete DLV list (GTM variable name + data layer key)
- Complete trigger list (trigger name + event name)
- Complete tag HTML for each event per platform

This file serves two purposes:
1. Developer review before GTM work starts
2. Input file for the bulk push script in Phase 3b

### Phase 2 Checklist
- [ ] All ambiguities in client file flagged and resolved
- [ ] Clean event list signed off by developer/client
- [ ] `gtm_all_tags.md` produced with all DLVs, triggers, and tag HTML
- [ ] `gtm_all_tags.md` reviewed before running any script

---

## Phase 3: GTM Setup

### 3a. Manual Setup (GTM Dashboard)
> 📖 [GTM Variables Guide](https://support.google.com/tagmanager/answer/7683362) · [GTM Triggers Guide](https://support.google.com/tagmanager/answer/7679316) · [GTM Tags Guide](https://support.google.com/tagmanager/answer/6106716) · [GTM dataLayer Guide](https://developers.google.com/tag-platform/tag-manager/datalayer)

#### Step 1 — Create Data Layer Variables (DLVs)
For each property in the events list:
1. Variables → User-Defined Variables → New
2. Variable Type: **Data Layer Variable**
3. Data Layer Variable Name: exact key name (e.g. `product_id`) — must match what's pushed from code
4. Name the variable: `DLV - product_id`
5. Data Layer Version: **Version 1**
6. Save

#### Step 2 — Create the Lookup Table variable for environment credentials
Used to switch between UAT and production Account IDs for SDK-based platforms:
1. Variables → New → Variable Type: **Lookup Table**
2. Name: `CT - Account ID` (or `CL - Project ID` etc.)
3. Input Variable: `{{Page Hostname}}`
4. Add rows:
   - Input: `uat.yourclient.com` → Output: `UAT_ACCOUNT_ID`
   - Input: `www.yourclient.com` → Output: `PROD_ACCOUNT_ID`
5. Save

#### Step 3 — Create SDK Loader tags (one per SDK-based platform)
Required for: CleverTap, Clarity, Meta Pixel base code

> 📖 CleverTap: [Web SDK Quickstart](https://developer.clevertap.com/docs/web-quickstart-guide) · [Region Codes](https://developer.clevertap.com/docs/region-codes) · [GitHub SDK](https://github.com/CleverTap/clevertap-web-sdk)
> 📖 Clarity: [Manual Setup](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) · [GTM Integration](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#google-tag-manager) · [Clarity API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api)
> 📖 Meta Pixel: [Base Pixel Install](https://developers.facebook.com/docs/meta-pixel/get-started/) · [Pixel Helper Extension](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/)

Rules that must always be followed:
- Tag type: **Custom HTML**
- Trigger: **All Pages (Page View)** — must have **no filters**
- Tag firing priority: **10**
- Script type: `text/javascript` (never `text/gtmscript`)

**CleverTap SDK Loader:**
```html
<script type="text/javascript">
  var clevertap = {
    event: [], profile: [], account: [], onUserLogin: [],
    notifications: [], privacy: []
  };
  clevertap.account.push({ "id": "{{CT - Account ID}}" });
  clevertap.region = "in1"; // change to eu1/us1/sg1 based on your CleverTap dashboard region
  clevertap.privacy.push({ optOut: false });
  clevertap.privacy.push({ useIP: false });
  (function () {
    var wzrk = document.createElement('script');
    wzrk.type = 'text/javascript';
    wzrk.async = true;
    wzrk.src = 'https://d2r1yp2w7bby2u.cloudfront.net/js/clevertap.min.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wzrk, s);
  })();
</script>
```

**Clarity SDK Loader:**
```html
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "{{CL - Project ID}}");
</script>
```

**Meta Pixel Base:**
```html
<script type="text/javascript">
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{MP - Pixel ID}}');
fbq('track', 'PageView');
</script>
```

#### Step 4 — Create GA4 Configuration Tag
> 📖 [GA4 Tag in GTM](https://support.google.com/tagmanager/answer/9442095) · [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events) · [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
1. Tags → New → Tag Type: **Google Analytics: GA4 Configuration**
2. Measurement ID: your `G-XXXXXXXX`
3. Trigger: All Pages
4. Name: `GA4 - Configuration`
5. Save

#### Step 5 — Create Custom Event Triggers (one per event)
1. Triggers → New → Trigger Type: **Custom Event**
2. Event Name: exact event name — e.g. `ATB_PDP_Clicked` (case-sensitive, must match `pushEvent()` call in code exactly)
3. Name: `CT - ATB_PDP_Clicked`
4. Save

> ⚠️ **The event name field in the trigger must match the `event` key pushed to dataLayer character-for-character including casing. This is the single most common source of events not firing.**

#### Step 6 — Create Event Tags (one per event per platform)
> 📖 CleverTap Events: [Web SDK Events](https://developer.clevertap.com/docs/web-quickstart-guide#recording-events) · [User Profiles](https://developer.clevertap.com/docs/web-quickstart-guide#creating-a-user-profile)
> 📖 GA4 Events: [GA4 Event Tag in GTM](https://support.google.com/tagmanager/answer/9442095) · [Recommended Events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events) · [GA4 Custom Events](https://developers.google.com/analytics/devguides/collection/ga4/events)
> 📖 Meta Pixel Events: [Standard Events](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/) · [Custom Events](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/#custom-events) · [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
> 📖 Google Ads: [GTM Conversion Tag Setup](https://support.google.com/tagmanager/answer/6105160) · [Conversion Tracking](https://support.google.com/google-ads/answer/6167168)

**CleverTap event tag example:**
```html
<script>
clevertap.event.push("ATB_PDP_Clicked", {
  "Product Name": "{{DLV - product_name}}",
  "Product ID": "{{DLV - product_id}}",
  "SKU": "{{DLV - sku}}",
  "Price": "{{DLV - product_price}}"
});
</script>
```

**GA4 event tag:** Use tag type `Google Analytics: GA4 Event`, set event name, add parameters mapping DLV variable names to GA4 parameter names.

**Meta Pixel event tag example:**
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

**Google Ads conversion tag:** Use tag type `Google Ads: Conversion Tracking`, enter Conversion ID and Conversion Label, trigger on the relevant purchase/conversion event.

---

### 3b. Bulk Setup via Script (Google Cloud GTM API)
> 📖 [GTM API Overview](https://developers.google.com/tag-platform/tag-manager/api/v2) · [GTM API Developer Guide](https://developers.google.com/tag-platform/tag-manager/api/v2/devguide) · [GTM API Reference](https://developers.google.com/tag-platform/tag-manager/api/reference/rest) · [googleapis Node.js client](https://github.com/googleapis/google-api-nodejs-client)

#### Project structure
```
scripts/
├── .env                          # env vars — never commit
├── .gitignore                    # must include .env and service account JSON
├── package.json
├── gtm_all_tags.md               # input: event definitions (from Phase 2)
├── create-tag.js                 # bulk creates GA4 tags from gtm_all_tags.md
├── setup.js                      # creates variables + triggers + GA4 + Meta tags
├── publish.js                    # creates version and publishes container
├── create-trigger.js             # creates a single trigger (utility)
├── create-variables.js           # creates DLV variables (utility)
└── service-account.json          # Google Cloud service account key — never commit
```

#### .env file
```
GTM_ACCOUNT_ID=123456789
GTM_CONTAINER_ID=987654321
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=1234567890123456
SERVICE_ACCOUNT_KEY_PATH=./service-account.json
```

#### .gitignore
```
.env
*.json
!package.json
```

#### package.json dependencies
```json
{
  "type": "commonjs",
  "dependencies": {
    "dotenv": "^17.x",
    "googleapis": "^171.x"
  }
}
```

#### How the bulk script works (create-tag.js)
The script reads `gtm_all_tags.md` and:
1. Parses all `clevertap.event.push("EventName", {...})` blocks to extract event names and properties
2. Fetches existing variables, triggers, and tags from GTM API to check for duplicates
3. Creates missing DLV variables first (dependency order)
4. Creates missing triggers second
5. Creates GA4 event tags last, linking to the correct trigger ID
6. Skips any item that already exists (idempotent)
7. Respects API rate limits with a configurable delay between writes (`GTM_WRITE_DELAY_MS`, default 2300ms)
8. Retries on rate limit errors (`GTM_RETRY_DELAY_MS`, default 65000ms)
9. Supports dry run mode: `DRY_RUN=true node create-tag.js`

#### Running the scripts
```bash
# Install dependencies
cd scripts && npm install

# Dry run first — shows what will be created without writing anything
DRY_RUN=true node create-tag.js

# Apply — creates all variables, triggers, and GA4 tags
node create-tag.js

# Create Meta Pixel tags (pass the trigger ID from the output above)
TRIGGER_ID=65 node create-meta-tag.js

# Full setup (variables + triggers + GA4 + Meta in one script)
node setup.js

# Publish the container
node publish.js
```

#### Adding CleverTap and Clarity to the bulk script
The script uses Custom HTML tags for SDK-based platforms. Follow the Meta Pixel pattern from `create-meta-tag.js`:
- Tag type: `"html"`
- Parameter key: `"html"` with the SDK event push as the value
- `firingTriggerId`: the trigger ID for the event
- For SDK Loader tags: `firingTriggerId: ["2147479553"]` (GTM's built-in All Pages trigger ID)

> ⚠️ **`2147479553` is GTM's internal ID for the built-in All Pages trigger. Do not create a new All Pages trigger via script — use this ID for SDK Loader tags.**

#### Script warnings built in
The bulk script automatically warns about:
- Events with more than 25 GA4 parameters (GA4 limit)
- Properties that may contain PII (name, phone, email, address) — these need review before going live

### Phase 3 Checklist
- [ ] All DLV variables created (verify count matches `gtm_all_tags.md` list)
- [ ] Lookup Table variable created for each SDK platform with UAT + production credentials
- [ ] SDK Loader tags created for CleverTap, Clarity, Meta Pixel with All Pages trigger (no filters) and priority 10
- [ ] GA4 Configuration tag created on All Pages
- [ ] All event triggers created — event names match exactly
- [ ] All event tags created with correct DLV references
- [ ] No duplicate triggers or tags
- [ ] DRY_RUN passed before running create-tag.js in apply mode

---

## Phase 4: Website Integration
> 📖 GTM Web Install: [Install GTM](https://support.google.com/tagmanager/answer/6103696) · [dataLayer Guide](https://developers.google.com/tag-platform/tag-manager/datalayer)
> 📖 Next.js: [@next/third-parties Docs](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-tag-manager) · [next/script Docs](https://nextjs.org/docs/app/api-reference/components/script)

### 4.1 GTM Snippet Installation

#### Vanilla JS (any framework)
Add to the `<head>` of every page:
```html
<!-- GTM Head Snippet -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

Add immediately after `<body>`:
```html
<!-- GTM NoScript Fallback -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

#### Next.js App Router specific
```tsx
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google'
// OR use next/script directly:
import Script from 'next/script'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Place OUTSIDE all providers */}
        <GoogleTagManager gtmId={GTM_ID} />
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}
```

> ⚠️ **GTM component must be placed outside all context providers in Next.js. Nesting it inside providers can cause it to load late or not inject correctly. The env var must be prefixed `NEXT_PUBLIC_` to be available in the browser. After adding the env var to Vercel/hosting, a new deployment is required for it to take effect.**

### 4.2 dataLayer Push Utility

```typescript
// lib/gtm.ts
export const pushEvent = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return  // SSR guard
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
```

Add to `global.d.ts` or `types/window.d.ts`:
```typescript
interface Window {
  dataLayer: Record<string, unknown>[]
}
```

### 4.3 Event Implementation Rules

**When to call pushEvent:**
| Event type | When to call |
|---|---|
| After async action (cart, wishlist, order) | Inside `.then()` or after `await` — only on success |
| UI interaction (tab click, nav click) | Inside the onClick handler directly |
| Page load / view event | Inside `useEffect` with empty dependency array (or equivalent) |
| Form submission | After successful API response, not on button click |

**Key naming rules:**
- All dataLayer keys pushed from code must match the Data Layer Variable Name in GTM **exactly** — character for character including casing
- Use snake_case for all property keys: `product_id`, `cart_total`, not `productId` or `CartTotal`
- The `event` key value must match the GTM trigger Event Name exactly

**Example — mapping API response to dataLayer push:**
```typescript
// lib/events/mappers/mapProductContext.ts
import { pushEvent } from '@/lib/gtm'

export const trackATBClicked = (product: MedusaProduct, variant: Variant, quantity: number) => {
  pushEvent('ATB_PDP_Clicked', {
    url: window.location.href,
    product_name: product.title,
    product_id: product.id,
    handle: product.handle,
    sku: variant.sku,
    category: product.collection?.title ?? '',
    product_price: (variant.prices?.[0]?.amount ?? 0) / 100,
    discounted_price: (variant.calculated_price?.calculated_amount ?? 0) / 100,
    quantity,
  })
}
```

**Organise event files by page/section:**
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

### Phase 4 Checklist
- [ ] GTM snippet added to all pages (head + noscript body)
- [ ] GTM_ID coming from environment variable, not hardcoded
- [ ] `pushEvent` utility created with SSR guard
- [ ] Window.dataLayer typed in global.d.ts
- [ ] All event keys in pushEvent calls match GTM DLV names exactly (case-sensitive)
- [ ] pushEvent called after async actions succeed, not on click
- [ ] Event files organised by page/section with shared mappers

---

## Phase 5: Testing & Debugging

### 5.1 Tools Setup
> 📖 GTM Preview: [GTM Preview Mode](https://support.google.com/tagmanager/answer/6107056) · [Tag Assistant Extension](https://support.google.com/tagmanager/answer/6107056#zippy=%2Ctag-assistant-legacy)
> 📖 GA4 DebugView: [GA4 DebugView Docs](https://support.google.com/analytics/answer/7201382)
> 📖 Meta Pixel Helper: [Pixel Helper Docs](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/) · [Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
> 📖 CleverTap Debugger: [CleverTap Debugger Guide](https://developer.clevertap.com/docs/web-quickstart-guide#testing-your-integration)
> 📖 Clarity: [Clarity Setup Verification](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#verify-clarity-is-installed)

| Tool | Purpose | How to access |
|---|---|---|
| GTM Preview | See which tags fire per event | GTM → Preview → enter your URL |
| Tag Assistant (Chrome extension) | Alternative to Preview for deployed URLs | Chrome Web Store → Tag Assistant |
| CleverTap Debugger | Verify CT events received | CT Dashboard → Settings → Integration → Debugger |
| GA4 DebugView | Verify GA4 events received | GA4 → Admin → DebugView |
| Meta Pixel Helper | Verify Meta events | Chrome Web Store → Meta Pixel Helper |
| Clarity Dashboard | Verify Clarity sessions | Clarity → your project → Recordings |

### 5.2 Testing Flow (always in this order)

#### Step 1 — Verify GTM container loads
Open browser DevTools console on your site:
```js
// Must return an object like { "GTM-XXXXXXX": { dataLayer: {...} } }
window.google_tag_manager

// Must return the GTM script URL including ?id=GTM-XXXXXXX
document.querySelector('script[src*="googletagmanager"]').src

// Must return an array (even if empty)
window.dataLayer
```

#### Step 2 — Verify SDK Loader tags fire on page load
In GTM Preview panel, on any page load event, check **Tags Fired**:
- `CT - SDK Loader` must be present ✅
- `MP - Base Pixel` must be present ✅
- `CL - SDK Loader` must be present ✅

Then verify in console:
```js
typeof clevertap        // must return "object"
clevertap.account       // must return [{"id": "YOUR_ACCOUNT_ID"}]
typeof clarity          // must return "function"
typeof fbq              // must return "function"
```

#### Step 3 — Fire each event and verify in GTM Preview
For each event:
1. Perform the action on the page
2. GTM Preview left panel — new event row must appear with the exact event name
3. Click the event row → **Tags** tab → correct tag must show **Succeeded** (green)
4. Click **Variables** tab → all DLVs must show real values, not `undefined`

#### Step 4 — Verify in platform debugger (within 5-10 seconds)
- **CleverTap:** device appears in Debugger → click it → event listed with all properties
- **GA4:** DebugView shows event with all parameters
- **Meta:** Pixel Helper shows event fired with correct data

### 5.3 Debug Decision Tree

```
window.google_tag_manager is undefined?
└── YES → GTM snippet missing OR Container ID not in script src URL
           Check: layout file has GTM snippet
           Check: NEXT_PUBLIC_GTM_ID env var set and redeployed

GTM Preview won't connect to your URL?
└── Check: has the container been Published (not just saved)?
    Check: does the URL require a login/password? (GTM Preview can't connect to auth-protected URLs)
    Fix: install Tag Assistant Chrome extension and use that instead

Event fires in code but no event row appears in GTM Preview?
└── Check window.dataLayer in console — is the event there?
    YES → GTM container is not matching. Check GTM ID matches what's on the page
    NO  → pushEvent() is not being called. Add console.log before pushEvent() to confirm handler fires

Event row appears in GTM Preview but tag is grey (Not Fired)?
└── Trigger event name mismatch
    Check: exact string in pushEvent('EventName') vs GTM trigger Event Name field
    These are case-sensitive — ATB_PDP_Clicked ≠ ATB_pdp_clicked

Tag fires (green) but DLV shows undefined in Variables tab?
└── Key name mismatch
    Check: key name in pushEvent payload vs Data Layer Variable Name in GTM DLV
    Example: pushing `productId` but DLV expects `product_id`

Tag fires, DLV populated, but event not in platform dashboard?
└── SDK Loader not firing correctly
    Check: CT - SDK Loader is in Tags Fired on page load (not Tags Not Fired)
    Check: All Pages trigger has NO filters (this is the most common cause)
    Check: Tag firing priority is set to 10
    Check: script type is text/javascript not text/gtmscript

SDK Loader fires but wrong Account ID in platform?
└── Lookup Table variable not resolving
    Check: Page Hostname in Lookup Table matches your URL exactly (no https://, no trailing slash)
    Check: container was Published after editing the Lookup Table variable
    Verify: switch Display Variables to Values in GTM Preview Tag Details
```

### 5.4 Browser Console Quick Commands

```js
// 1. Confirm GTM loaded with correct container ID
window.google_tag_manager
// Expected: { "GTM-XXXXXXX": { dataLayer: {...} } }

// 2. See entire dataLayer history
window.dataLayer

// 3. See the last event pushed
window.dataLayer[window.dataLayer.length - 1]

// 4. Confirm CleverTap SDK loaded with correct account
typeof clevertap           // "object"
clevertap.account          // [{"id": "YOUR_ACCOUNT_ID"}]

// 5. Manually fire a direct CleverTap event (bypasses GTM — isolates platform vs GTM issue)
clevertap.event.push("Test_Direct", { test_prop: "hello" })
// Then check CleverTap Debugger — if this appears, SDK is fine and issue is GTM-side

// 6. Confirm Clarity loaded
typeof clarity             // "function"

// 7. Confirm Meta Pixel loaded
typeof fbq                 // "function"
```

### Phase 5 Checklist
- [ ] `window.google_tag_manager` returns container ID
- [ ] All SDK Loader tags appear in Tags Fired on page load
- [ ] All SDK objects (`clevertap`, `clarity`, `fbq`) return correct type in console
- [ ] Every event tested: event row appears in GTM Preview
- [ ] Every tag shows Succeeded (green) — no tags in Not Fired for expected events
- [ ] No DLVs showing `undefined` in Variables tab
- [ ] All events verified in respective platform debuggers with correct property values

---

## Phase 6: Publishing

### 6.1 Understanding GTM Save vs Preview vs Publish

| Action | What it does | Visible to live site? |
|---|---|---|
| Save | Saves changes to workspace draft | No |
| Preview | Tests current draft in a debug session | No (debug only) |
| Submit → Publish | Creates a version and pushes to live | Yes |

> ⚠️ **GTM Preview always reflects the last SAVED state of your workspace, not the last published version. But changes only go live after Publish. Always save before previewing, and always publish after all testing passes.**

### 6.2 Publishing steps
1. GTM → Submit (top right)
2. Select **Publish and Create Version**
3. Version Name: descriptive e.g. `CT + GA4 PDP events - Phase 1`
4. Version Description: list what was added/changed
5. Publish to: **Live**
6. Click **Publish**

### 6.3 UAT vs Production strategy

Use the Lookup Table variable approach (set up in Phase 3a Step 2):
- One GTM container handles both environments
- Credentials switch automatically based on `Page Hostname`
- No need for separate GTM containers for UAT and production

If you need fully separate containers (e.g. client requirement):
- Use GTM Environments (Admin → Environments) to create a UAT environment
- GTM generates a separate snippet for the UAT environment
- Use the UAT snippet on the UAT site, Live snippet on production

### 6.4 Pre-publish checklist
- [ ] All SDK Loader tags: All Pages trigger, no filters, priority 10
- [ ] All DLV names match code keys exactly (case-sensitive)
- [ ] All trigger event names match `pushEvent()` calls exactly (case-sensitive)
- [ ] Lookup Table has correct credentials for both UAT and production hostnames
- [ ] No duplicate triggers or tags in workspace
- [ ] GTM Preview tested and all events verified before publishing
- [ ] Version name and description filled in
- [ ] Team notified of publish (in case of rollback needed)

---

## Appendix A: Platform-specific notes

### CleverTap
> 📖 [Web SDK Quickstart](https://developer.clevertap.com/docs/web-quickstart-guide) · [Region Codes](https://developer.clevertap.com/docs/region-codes) · [Events](https://developer.clevertap.com/docs/web-quickstart-guide#recording-events) · [User Profiles](https://developer.clevertap.com/docs/web-quickstart-guide#creating-a-user-profile) · [onUserLogin](https://developer.clevertap.com/docs/web-quickstart-guide#onuserlogin) · [GTM Integration](https://developer.clevertap.com/docs/gtm-web) · [GitHub SDK](https://github.com/CleverTap/clevertap-web-sdk)

- Region must be set explicitly: `clevertap.region = "in1"` (or `eu1`, `us1`, `sg1`, `aps3`, `mec1`) — check your dashboard URL to determine region. Default is `eu1` if not set.
- CDN URL (always use this, not the legacy `a.js`): `https://d2r1yp2w7bby2u.cloudfront.net/js/clevertap.min.js`
- User profile (onUserLogin) must be pushed separately from events — fire on login/registration
- CleverTap event names are **permanently stored** — casing conflicts create separate events that cannot be merged

### GA4
> 📖 [GA4 Tag in GTM](https://support.google.com/tagmanager/answer/9442095) · [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events) · [Custom Events](https://developers.google.com/analytics/devguides/collection/ga4/events) · [GA4 DebugView](https://support.google.com/analytics/answer/7201382) · [GA4 Event Limits](https://support.google.com/analytics/answer/9267744) · [GA4 PII Policy](https://support.google.com/analytics/answer/7686480)

- Maximum 25 custom parameters per event
- Parameter names must be snake_case, max 40 characters
- PII (name, email, phone) must not be sent to GA4 — script auto-warns about this
- Use `gaawe` tag type for GA4 events in GTM API script (not the legacy `gaawc`)

### Meta Pixel
> 📖 [Meta Pixel Docs](https://developers.facebook.com/docs/meta-pixel/) · [Get Started](https://developers.facebook.com/docs/meta-pixel/get-started/) · [Standard Events](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/) · [Custom Events](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/#custom-events) · [Pixel Helper](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/)

- Base pixel (`fbq('init', ...)` + `fbq('track', 'PageView')`) must fire on All Pages before any event tags
- Standard events use `fbq('track', 'EventName', {...})`
- Custom events use `fbq('trackCustom', 'EventName', {...})`
- GTM's built-in All Pages trigger ID for scripts: `2147479553`

### Microsoft Clarity
> 📖 [Clarity Overview](https://learn.microsoft.com/en-us/clarity/setup-and-installation/about-clarity) · [Manual Setup](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) · [Clarity Client API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api) · [GTM Integration](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#google-tag-manager) · [Privacy FAQ](https://learn.microsoft.com/en-us/clarity/faq)

- Clarity does not support custom events — it is session recording + heatmaps only
- Custom tagging for user properties: `clarity("set", "userId", "{{DLV - user_id}}")`
- Fire the profile tag after login events only

### Google Ads
> 📖 [Conversion Tracking Overview](https://support.google.com/google-ads/answer/1722022) · [Set Up Web Conversions](https://support.google.com/google-ads/answer/6167168) · [GTM + Google Ads Tag](https://support.google.com/tagmanager/answer/6105160) · [Conversion ID & Label](https://support.google.com/google-ads/answer/12216424) · [Enhanced Conversions](https://support.google.com/google-ads/answer/13261987)

- Requires Conversion ID (AW-XXXXXXXXX) and Conversion Label
- Tag type in GTM: `Google Ads: Conversion Tracking`
- Only fire on the specific conversion confirmation page/event (e.g. order confirmed)
- For remarketing: use `Google Ads: Remarketing` tag type on All Pages

---

## Appendix B: Common mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Event name casing mismatch between code and GTM trigger | Tag never fires | Copy-paste event names, don't retype |
| SDK Loader trigger has a filter | SDK never loads, all events silent | Remove all filters from SDK Loader All Pages trigger |
| GTM component nested inside providers (Next.js) | GTM loads late or not at all | Move GTM component before all providers |
| pushEvent called on click instead of after async success | Event fires even if action fails | Move call inside success callback |
| Env var missing `NEXT_PUBLIC_` prefix | `undefined` in browser, GTM ID missing from script src | Add prefix, redeploy |
| Not publishing after edits | Live site still uses old container | Always Submit → Publish after changes |
| Committing service account JSON to git | Full GTM edit access exposed | Add to .gitignore immediately, rotate key |
| Using `text/gtmscript` type in Custom HTML | SDK loads inconsistently | Always use `text/javascript` |
