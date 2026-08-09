# Conversion analytics

RetroCharm Co uses **Vercel Web Analytics** for pageviews and custom funnel events, plus optional advertising pixels controlled by environment variables.

All custom tracking goes through one client utility: [`src/lib/analytics.js`](../src/lib/analytics.js). Components should not call `@vercel/analytics` `track()` directly.

## Setup

1. In the [Vercel dashboard](https://vercel.com/dashboard) → your project → **Analytics**, enable **Web Analytics**.
2. Custom events require a Vercel plan that includes them (Pro/Enterprise for full custom-event reporting — confirm on your plan).
3. Deploy as usual. The `<Analytics />` component in `src/App.jsx` already loads the script.
4. Optional pixels (safe when blank — the app does not fail):

```bash
# .env / Vercel project env (client-exposed — public pixel IDs only)
VITE_META_PIXEL_ID=
VITE_GOOGLE_ADS_ID=
```

5. Restart `npm run dev` after changing `VITE_*` vars.

See [`.env.example`](../.env.example) for the same keys.

## Development verification (no production pollution)

In local/dev:

- Custom events log to the browser console as `[analytics] <event_name> {…props}`.
- Vercel Analytics is mounted with `debug={import.meta.env.DEV}` so the SDK also prints debug info.
- Events are **not** meant to inflate production dashboards from localhost; use the console + `npm run verify:analytics` for checks.

```bash
npm run verify:analytics
```

## Privacy rules

Events **must not** include:

- Email, name, phone, street address, city, ZIP
- Payment card data, Square customer tokens, or free-text that looks like an email

Allowed examples: `base_color`, `size_links`, `charm_count`, `product_category`, `cart_value`, `item_count`, `campaign_source`, `campaign_name`, `bundle_id`, `source` (UI placement like `home_hero` / `footer`).

UTM parameters (`utm_source`, `utm_campaign`, etc.) are captured on first landing in the tab (`sessionStorage`) and attached as `campaign_source` / `campaign_name` (and related fields) on later events.

## Funnel events — where to see them

| Event | When it fires | Where owner views it |
|-------|---------------|----------------------|
| `homepage_viewed` | Home page mount (once per tab session) | Vercel → Analytics → Custom Events |
| `create_bracelet_clicked` | “Create Your Bracelet” / Charm Studio CTAs | same |
| `builder_opened` | Charm Studio mounts (`home-builder` or `gallery-builder`) | same |
| `base_selected` | Base metal/style chosen in builder | same |
| `size_selected` | Link count / size chosen | same |
| `charm_added` / `charm_removed` | Charm placed on / removed from bracelet | same |
| `bundle_viewed` | Best-seller card ~45% visible (once per bundle per session) | same |
| `bundle_added` | Best-seller added to cart | same |
| `cart_viewed` | `/cart` mount (once per session) | same |
| `checkout_started` | Square Payment Link created successfully, before redirect | same |
| `checkout_returned` | `/order-confirmation` with/without `?order=` | same — **not a purchase** |
| `purchase_completed` | Square webhook `payment.updated` + `status === COMPLETED` | Vercel custom events (server) |
| `email_signup_completed` | Footer signup submit (source only, no email) | same |

Automatic **pageviews** for every route still come from Vercel Analytics pageview tracking.

## Purchase tracking — important

The order confirmation page **does not** fire `purchase_completed`.

Square’s redirect to `/order-confirmation?order=…` only proves the shopper returned from checkout with our cart token. It is **not** reliable payment confirmation.

`purchase_completed` is emitted only from [`api/square-webhook.js`](../api/square-webhook.js), and only after **all** of:

1. Square SDK (`WebhooksHelper`) signature verification against the raw request body
2. The event type is `payment.created` or `payment.updated`
3. `payment.status === COMPLETED`
4. The payment has a valid Square payment ID and order ID
5. The order is correlated to a checkout created by theretrocharmco.com (not Square POS, a market-booth sale, an invoice, or a manually entered payment)
6. The payment hasn't already been counted (durable idempotency, by both `event_id` and payment ID)

See [`docs/webhook.md`](./webhook.md) for the full signature-verification, correlation, storage, and operational runbook.

Properties: `cart_value`, `currency`, `item_count`, `has_bracelet_builds`, `verified: true`, `source: square_webhook` — no buyer identity.

Until a real paid order hits the webhook in production, treat purchase analytics as **instrumented but not live-verified** for your store.

## Optional pixels

| Env | Behavior when set |
|-----|-------------------|
| `VITE_META_PIXEL_ID` | Loads Meta Pixel; maps `checkout_started` → InitiateCheckout, `email_signup_completed` → Lead |
| `VITE_GOOGLE_ADS_ID` | Loads gtag; forwards custom event names |

When unset, init is skipped and the storefront works normally.
