# Inventory (fail-safe)

RetroCharm Co loads live stock from the Supabase `inventory` table. **Production always fails safe:** if inventory cannot be verified, customers can still browse, but purchase actions stay disabled until stock is confirmed again.

## Customer behavior during an outage

When the inventory source is unreachable, times out, returns invalid data, or is unconfigured in production:

- Charm Studio and the catalog stay visible
- Message: “Live inventory is temporarily unavailable. Please try again shortly.”
- Add to Bracelet, bundle Add to Cart, and checkout are disabled / blocked
- Products are **not** labeled “in stock”
- Missing catalog↔inventory rows show **Availability unavailable**
- Builds and favorites are preserved
- **Retry Inventory** is available; the client also retries with backoff

## Checkout revalidation

Before creating a Square Payment Link:

1. Client re-fetches inventory and validates paid cart lines
2. `api/create-checkout` independently re-fetches and validates again
3. Free filler links are excluded from validation
4. If inventory is unverified or items are unavailable, the API returns **503** and **does not** create a Payment Link
5. The cart is preserved so the customer can replace items

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Client inventory REST base |
| `VITE_SUPABASE_ANON_KEY` | Client inventory read key |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server checkout revalidation (preferred on API) |
| `VITE_INVENTORY_MODE=mock` | **Dev only** — mock all-in-stock inventory when `import.meta.env.DEV` |
| `INVENTORY_EMERGENCY_FAIL_OPEN=true` | **Emergency only** — documented override; not default. Allows checkout without verified stock. Do not set in normal production. |
| `VITE_INVENTORY_EMERGENCY_FAIL_OPEN=true` | Dev-only client emergency flag (ignored for production fail-open via missing env) |

Missing Supabase env vars **never** enable fail-open in production. They yield `unconfigured` / unavailable stock.

## Diagnostics (privacy-safe)

Logged events (no customer details or full cart payloads):

- `inventory_source_unavailable`
- `inventory_product_missing` (internal product id only)
- `inventory_stale`
- `checkout_blocked_inventory`
- `inventory_recovered`

## Tests

```bash
npm run verify:inventory
npm run verify
```

## Prebuilt best-seller stock

Prebuilt bracelets do not have their own SKUs — each sale decrements the base and charms in the build. To keep **10 complete units of each** best-seller style available (shared parts summed across styles):

```bash
# Dry-run: print allocation table + SQL (also writes scripts/sql/set-prebuilt-bundle-stock.sql)
npm run stock:prebuilts

# Apply via service role — put SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env / .env.local
npm run stock:prebuilts -- --apply
```

Or paste [`scripts/sql/set-prebuilt-bundle-stock.sql`](../scripts/sql/set-prebuilt-bundle-stock.sql) into the Supabase SQL editor.

Charm Studio purchases of the same bases/charms share this inventory pool.