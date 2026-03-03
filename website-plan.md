# Rau Om Website Plan (Orlando Vietnamese/Asian Home-Cooked Dishes)

Updated: March 3, 2026 (America/New_York)

## 1) Goals

- Build an inviting, professional storefront for Rau Om in Orlando.
- Let customers browse dishes quickly, filter by dietary tags, and place orders.
- Support frequent menu updates (some dishes change every ~3 days).
- Preserve a cook-to-order model so dishes are prepared fresh after order confirmation.
- Preserve archived dishes so users can search and view past offerings.
- Keep hosting and operations low-cost while maintaining strong SEO.
- Launch without online card payments first, with a clear upgrade path later.

## 2) Brand and Terminology Decisions

- Restaurant/site name: always display as `Rau Om` (capital R and O, no hyphen).
- Customer-facing item term: use `dish` / `dishes`.
- Use `meal` only when referring to multi-dish bundles in the future.

## 3) Product Scope

### Phase 1 (MVP)

- Home page with large dish-photo carousel.
- Dish cards with:
  - Name/title
  - Short description
  - Dietary badges (`vegan`, `vegetarian`, `gluten-free`, etc.)
  - Price
- Dish detail page with:
  - Ingredients
  - Optional nutrition facts (if available)
  - Add-to-cart
- Cart + checkout form (no online payment yet):
  - Customer info
  - Delivery/pickup preference
  - Delivery/pickup time slot selection
  - Delivery address input + address validation
  - Real-time delivery fee estimate based on distance from `720 Orange Ave, Longwood, FL 32750`
  - Tax estimate shown before submit
  - Manual payment method selection (`cash`, `zelle`, `venmo`)
  - Order notes
  - Submit order
- Order submission sends owner email and stores order in database.
- Admin route with secure access:
  - View incoming orders
  - View grouped kitchen board ("cook now", "ready from prep", "later")
  - Mark status (`new`, `pending_confirmation`, `confirmed`, `preparing`, `completed`, `cancelled`)
- Dish management:
  - Create/edit/publish/archive dishes
  - Set featured dishes for the week
  - Schedule publish/unpublish dates
- Prep inventory management:
  - Input prepped counts per dish (example: 6 vegan pho, 4 pho)
  - Track available vs reserved vs fulfilled counts
  - Reserve oldest inventory first and warn on low stock/expiring prep
- Public archive section for past dishes.
- Email newsletter signup (double opt-in).
- Operational safeguards:
  - Per-time-slot order capacity limits
  - Daily order cutoff times
  - Blackout dates (holiday/closed days)
  - Fresh-cook policy:
    - dishes are cooked after order confirmation, not batch-cooked for instant dispatch
    - lead-time rules are mandatory to protect quality and kitchen workflow
  - Minimum lead-time rules (launch defaults):
    - all dishes require at least `1 day` lead time
    - some dishes require `2-3 days` lead time
  - Manual-payment confirmation buffer before fulfillment (launch default: `12 hours`)
  - Minimum-order settings supported but disabled by default at launch

### Phase 2 (Near-term)

- SMS subscriber opt-in for dish-of-the-week alerts.
- Better archive browsing (filters by month/tag/cuisine).
- "Repeat this dish" action from archive pages.
- Returning-checkout convenience (without accounts):
  - remember recent contact/address via secure cookie (consent-based)
  - quick "repeat last order" flow
- Basic analytics dashboard for top dishes and conversion.
- Optional minimum-order rules (if needed after launch data):
  - `minimum_order_amount_delivery`
  - `minimum_order_amount_pickup`
  - optional distance-tier minimums
- Post-order review capture loop for local SEO:
  - send review request after `completed` status

### Phase 3 (Later)

- Card payments (Stripe recommended after cost/flow approval).
- Promo codes, gift cards, and subscriptions.
- Weighted slot capacity by dish complexity (`dish_complexity_score`).

## 4) UX / UI Direction (Inviting + Professional)

### Brand style inspired by rau om herb

- Core palette:
  - Herb green: `#7FAE53`
  - Deep leaf green: `#4E7A31`
  - Blossom lilac accent: `#C88ACD`
  - Fresh blue accent/background: `#0B93D4`
  - Warm neutral base: `#F6F0E6`
- Usage rules:
  - Keep dishes and photography as the focal point.
  - Use lilac as accent only (badges, tiny highlights, hover states), not as dominant background.
  - Use soft organic leaf/stem motifs as section separators or corner decoration.
  - Keep botanical colors secondary to food warmth in key conversion sections.
- Food warmth balance rules:
  - Add warm food accents for actions and highlights:
    - chili red accent: `#C63A2A`
    - broth gold accent: `#D9A441`
  - Prioritize warm-toned food imagery on first viewport and feature sections.
  - Avoid cool overlays/filters that desaturate reds, broth tones, and char textures.
- Brand lockup:
  - Primary wordmark: `Rau Om`
  - Optional subtitle: `Vietnamese and Asian Home-Cooked Dishes in Orlando`

### Page structure

- Home:
  - Hero with carousel (top dishes / weekly features)
  - "This Week's Featured Dishes" section
  - Dietary filter chips near top of dish list
  - Trust section (fresh ingredients, local Orlando kitchen, testimonials)
- Dish cards:
  - Large image, clear price, dietary badges, short copy
  - "View Details" and "Add to Cart" actions
- Mobile-first behavior:
  - Swipe carousel
  - Sticky cart button
  - Fast filter interactions

### Accessibility requirements (MVP)

- Keyboard navigation:
  - full keyboard support for filters, carousel controls, and checkout form
- Semantics:
  - ARIA labels on interactive controls
  - headings in logical order
- Visual access:
  - WCAG AA color contrast targets
  - no color-only meaning for dietary badges (always include text labels)
- Media:
  - required alt text on dish images in admin upload flow

### Performance budgets (MVP)

- Mobile Core Web Vitals targets:
  - LCP under `2.5s`
  - INP under `200ms`
  - CLS under `0.10`
- Delivery targets:
  - TTFB under `600ms` on core pages
  - keep initial JS payload near `200KB` or less where practical
- Image standards:
  - optimized responsive images (`webp/avif`)
  - target under `300KB` per primary dish image after optimization

### Photo pipeline standards

- Upload standard:
  - source image minimum: `2000px` on longest side
  - storefront crop targets: `4:5` (card), `16:9` (hero/carousel)
- Naming convention:
  - `dish-slug_YYYY-MM-DD_variant.ext`
- Quality control:
  - consistent lighting/background style
  - warm white balance and vibrant but natural saturation for food
  - avoid heavy filters to keep food color accurate

## 5) SEO Plan

### Technical SEO

- Use server-rendered pages (SSR/ISR) for dish and archive routes.
- Clean URLs: `/dishes/{slug}`, `/archive/{year}/{month}`.
- Auto-generated sitemap and `robots.txt`.
- Canonical tags on dish and archive pages.
- Open Graph + Twitter cards for dish pages.
- Image optimization (`webp/avif`, responsive sizes, lazy-loading).

### Content SEO

- Unique dish page copy:
  - Dish story/background
  - Ingredient highlights
  - Dietary info and allergens
- Local intent pages:
  - "Vietnamese home-cooked dishes in Orlando by Rau Om"
  - Delivery/pickup zones and schedule page
- Structured data:
  - `Product` schema for dishes
  - `BreadcrumbList`
  - `FAQPage` for ordering/storage/reheating questions
- Brand/story pages to improve conversion and trust:
  - "Our Story" page (why Rau Om, cooking philosophy, heritage)
  - "How Ordering Works" page (freshness, timing, fulfillment process)

### Local SEO

- Create/optimize Google Business Profile.
- Keep NAP (name/address/phone) consistent across website and listings.
- Encourage reviews and showcase selected reviews on-site.

### Content trust and compliance pages

- Required public pages:
  - Allergens disclosure
  - Food handling/reheating guidance
  - Delivery area and fees
  - Fresh-cook lead-time policy (why advance ordering is required)
  - Payment methods accepted (before online card launch)
  - Cancellation policy
  - Privacy policy and Terms of Service
- Regulatory compliance notes:
  - include applicable local/state food business disclosures and labeling language
  - if operating under home-kitchen/cottage-food rules, publish required notice text where legally required
  - verify county/state licensing and tax registration requirements before launch

## 6) Required Architecture (Cloudflare Hosting Locked)

### Cloudflare-only stack (required for production)

- Frontend: Next.js (App Router) + TypeScript on Cloudflare Pages.
- Backend/API: Cloudflare Workers.
- Database: Cloudflare D1 (SQLite).
- Image storage: Cloudflare R2.
- Cache/session: Cloudflare KV (optional).
- Bot protection: Cloudflare Turnstile on checkout + rate limiting at Worker level.
- Hosting lock:
  - production deployment must run on Cloudflare Pages + Workers
  - Render, Vercel, Railway, and other non-Cloudflare hosts are out of scope for production
- Admin auth:
  - Cloudflare Access (simple and secure for internal admin routes), or
  - custom email/password auth stored in D1 if needed.
- Transactional email: Resend (order notifications + customer confirmations).

### Database alternative (still Cloudflare-hosted)

- Frontend/hosting: Cloudflare Pages + Workers.
- Database/Auth/Storage: Supabase (Postgres + Auth + Storage).
- Transactional email: Resend.

### Cloudflare vs Render (decision context)

- Cloudflare pros:
  - aligns with target architecture (Pages + Workers + D1 + R2 + Turnstile + Access)
  - low baseline cost and strong edge delivery
  - single-platform operations for runtime and security controls
- Cloudflare cons:
  - Worker runtime constraints require avoiding Node-only server patterns
  - migration effort is required when code relies on local SQLite drivers
- Render pros:
  - easy for Node + local SQLite servers
  - simple persistent disk setup for `better-sqlite3`
- Render cons:
  - not aligned with this project's platform decision
  - would create migration rework later to reach Cloudflare architecture
- Final platform decision:
  - Cloudflare is mandatory for production
  - Render is explicitly not approved for production deployment

### Cloudflare D1 vs Supabase (pros and cons)

- Cloudflare + D1 pros:
  - Lowest operational cost and fewer services to manage.
  - Single platform for deploy + runtime + DB + storage.
  - Good fit for MVP with no customer accounts and moderate write volume.
- Cloudflare + D1 cons:
  - SQLite-based constraints (fewer advanced relational features than Postgres).
  - Auth/admin tooling is less turnkey than Supabase Auth + Studio.
  - Complex analytics/reporting and future data migrations can require more custom work.
- Supabase pros:
  - Full Postgres features, mature SQL ecosystem, and easier future analytics.
  - Built-in Auth, role controls, and admin tooling (Studio) out of the box.
  - Strong fit if customer accounts, staff roles, or complex business rules grow quickly.
- Supabase cons:
  - Extra platform and baseline cost.
  - More moving parts (Cloudflare + Supabase) to monitor.

### Decision for Rau Om now

- Production hosting is Cloudflare-only.
- Default data stack is Cloudflare + D1 for this project right now.
- Keep schema and service layers clean so migration to Postgres remains easy if volume/complexity grows.

### Distance API strategy (cost control)

- Start with one driving-distance provider (Mapbox or Google) and abstract via a service layer.
- Add cache-first logic:
  - cache route results by normalized origin+destination hash
  - add ZIP-level fallback estimate when API is unavailable
- Only call live distance API when:
  - cache miss, or
  - address changed materially.

## 7) Data Model (Core)

### Tables

- `dishes`
  - `id`, `slug`, `name`, `short_description`, `long_description`
  - `price`, `currency`
  - `status` (`draft`, `scheduled`, `live`, `archived`, `sold_out`)
  - `lead_time_days` (`1`, `2`, or `3`; default `1`)
  - `dish_complexity_score` (optional, for weighted kitchen capacity later)
  - `is_featured_week`
  - `available_from`, `available_to`
  - `created_at`, `updated_at`
- `dish_images`
  - `id`, `dish_id`, `url`, `alt_text`, `sort_order`
- `ingredients`
  - `id`, `dish_id`, `name`, `is_allergen`
- `dish_nutrition`
  - `dish_id`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `sodium_mg`, `notes`
- `dietary_tags`
  - `id`, `code`, `label` (e.g., `vegan`, `vegetarian`, `gluten_free`)
- `dish_dietary_tags`
  - `dish_id`, `dietary_tag_id`
- `orders`
  - `id`, `order_number`, `customer_name`, `email`, `phone`
  - `fulfillment_type`, `fulfillment_time_local`, `fulfillment_time_utc`, `timeslot_id`
  - `delivery_address_line1`, `delivery_address_line2`, `delivery_city`, `delivery_state`, `delivery_zip`
  - `delivery_lat`, `delivery_lng`, `delivery_distance_mi`
  - `subtotal_before_tax_cents`, `tax_rate_snapshot`, `tax_amount_cents`
  - `delivery_fee_cents`, `total_after_tax_cents`, `currency`, `notes`, `created_at_utc`, `updated_at_utc`
  - `payment_method_selected`, `payment_status`, `payment_reference`
  - `payment_due_at_utc`, `confirmation_deadline_utc`
  - `cancelled_at`, `cancellation_reason`, `refund_notes`
  - `status`, `distance_source`, `delivery_fee_rule_snapshot`
  - `kitchen_priority_score`, `kitchen_group` (`cook_now`, `ready_from_prep`, `later`)
- `order_items`
  - `id`, `order_id`, `dish_id`, `dish_name_snapshot`, `unit_price_snapshot_cents`, `quantity`
  - `qty_reserved_from_prep`, `qty_to_cook`, `item_fulfillment_status`
- `prep_inventory_lots`
  - `id`, `dish_id`, `prepared_qty`, `reserved_qty`, `fulfilled_qty`, `available_qty`
  - `prepared_at`, `expires_at`, `created_by_admin_id`, `notes`
- `prep_inventory_events`
  - `id`, `lot_id`, `order_item_id`, `event_type` (`add`, `reserve`, `release`, `fulfill`, `waste`)
  - `quantity`, `event_at`, `actor_admin_id`, `notes`
- `kitchen_tasks`
  - `id`, `dish_id`, `required_qty`, `due_time`, `status`, `generated_at`
  - `source_order_ids_snapshot`
- `fulfillment_timeslots`
  - `id`, `date_local`, `start_time_local`, `end_time_local`, `start_time_utc`, `end_time_utc`
  - `slot_type` (`delivery`, `pickup`)
  - `capacity_limit`, `reserved_count`, `is_open`, `timezone`
  - `cutoff_time_local`, `minimum_lead_time_days`
- `blackout_dates`
  - `id`, `date_local`, `reason`, `is_active`
- `order_audit_log`
  - `id`, `order_id`, `event_type`, `old_status`, `new_status`
  - `actor_admin_id`, `event_at`, `notes`
- `subscribers`
  - `id`, `channel` (`email` or `sms`), `email`, `phone`
  - `status` (`pending`, `active`, `unsubscribed`)
  - `consent_text_version`, `consented_at`
- `delivery_pricing_rules`
  - `id`, `base_fee`, `tier1_rate`, `tier2_rate`, `max_distance_mi`, `rounding_step`
  - `is_active`, `effective_from`, `effective_to`
  - `minimum_order_enabled`, `minimum_order_amount_delivery`, `minimum_order_amount_pickup`
- `tax_rules`
  - `id`, `jurisdiction`, `tax_rate`, `is_active`, `effective_from`, `effective_to`
- `distance_quote_cache`
  - `id`, `origin_hash`, `destination_hash`, `distance_mi`, `duration_min`
  - `provider`, `quoted_at`, `expires_at`
- `app_settings`
  - `key`, `value_json`
  - includes fixed delivery origin: `720 Orange Ave, Longwood, FL 32750`
  - includes accepted manual payment methods and launch toggles (minimum-order enable flag, auto-confirm enable flag)
  - includes timing controls:
    - `minimum_lead_time_days_default`
    - `minimum_lead_time_days_delivery_override` (optional)
    - `manual_payment_confirmation_buffer_hours`
    - `pending_confirmation_timeout_minutes`
- `admin_users` (optional, only if custom app login is used)
  - for role metadata and audit attribution when not fully relying on Cloudflare Access
- `idempotency_keys`
  - `id`, `request_hash`, `scope`, `created_at`, `expires_at`
  - prevents duplicate checkout submissions

### Money, rounding, and time invariants (must-follow)

- Money storage:
  - store all money as integer cents (`*_cents`) in database and APIs
  - never store monetary values as floating point
- Currency:
  - use `currency = USD` for all MVP orders
- Calculation order:
  - `subtotal_before_tax_cents = sum(order_item.unit_price_snapshot_cents * quantity)`
  - `tax_amount_cents = round_half_up(subtotal_before_tax_cents * tax_rate_snapshot)`
  - `total_after_tax_cents = subtotal_before_tax_cents + delivery_fee_cents + tax_amount_cents`
- Display rule:
  - UI/email/admin displays are formatted from cents only (single source of truth)
- Time storage:
  - store canonical timestamps in UTC (`*_utc`)
  - store local slot labels for UX (`*_local`) using `America/New_York`
  - timeslot selection and capacity checks must be based on UTC internally
- DST handling:
  - convert local slot definitions to UTC at slot-generation time
  - do not create ambiguous/invalid local-time slots on DST transition hours

### Archiving strategy

- Never hard-delete dishes that were once live.
- Use `status = archived` and keep historical content.
- Keep order item snapshots so old orders remain accurate if dish details change.

## 8) Admin Workflow (Fast Updates Every 3 Days)

- Admin authentication:
  - Cloudflare Access-protected `/admin` (preferred), or
  - app login page `/admin/login` if custom auth is enabled.
- Admin pages:
  - Dishes list (filter by status/live/archived)
  - "Quick Add Dish" form with image upload
  - Inline edits for price/tags/availability
  - Dish availability controls:
    - manual `sold_out` toggle
    - optional auto sold-out when prep inventory and slot capacity are exhausted
  - Bulk actions:
    - Archive selected
    - Duplicate selected (for recurring dishes)
    - Set featured week
  - Orders inbox with status updates:
    - status flow with confirmation and cancellation reasons
    - payment method and payment reconciliation fields
  - Kitchen board (grouped + prioritized):
    - `ready_from_prep`: can be packed immediately from prepped inventory
    - `cook_now`: shortage exists and due time is approaching
    - `later`: scheduled later and not urgent yet
  - Prep inventory panel:
    - Quick add prepared quantities by dish
    - Live available/reserved/fulfilled counts
    - Expiration warnings and waste logging
  - Auto-generated cook list:
    - Group by dish
    - Show total quantity to cook + nearest due time
  - Subscribers export (CSV)
  - Time-slot and operations settings:
    - Delivery/pickup slot capacity per time window
    - Daily cutoff time
    - Blackout date manager
    - Default lead-time days and per-dish lead-time controls (`1`, `2`, `3`)
    - Manual-payment confirmation buffer and timeout settings
  - Delivery settings editor:
    - Fixed origin address
    - Rate/tier updates
    - Hard cutoff distance (`30 miles`)
    - optional minimum-order settings (disabled by default at launch)
  - Tax settings editor:
    - jurisdiction tax rate and effective dates
- Optional speed feature:
  - CSV import template for batch dish updates

## 9) Order Flow (No Card Payment Yet)

1. Customer adds dishes to cart.
2. Customer selects `delivery` or `pickup`.
3. System shows only fulfillment slots that satisfy:
   - minimum lead time required by the cart (`max(lead_time_days)` across dishes)
   - minimum default lead time (`1 day`) even for fast-prep dishes
   - cutoff rules
   - manual-payment confirmation buffer
   - fresh-cook policy messaging shown clearly before slot selection
4. Customer selects an available fulfillment time slot.
5. If `delivery`, customer enters full address at checkout.
6. System validates address and calculates driving distance from `720 Orange Ave, Longwood, FL 32750`.
7. If distance is greater than `30 miles`, checkout blocks only the delivery option, shows "Delivery not available for this address," and keeps pickup available.
8. If distance is within `30 miles`, system calculates delivery fee.
9. System calculates tax (`tax_amount_cents`) and final total (`total_after_tax_cents`) and displays formatted dollar breakdown.
10. If minimum-order rules are enabled, system validates the threshold (disabled by default at launch).
11. Checkout is protected with Turnstile, rate limiting, idempotency key, and input validation:
   - phone format validation
   - disposable/invalid email domain checks
   - temporary IP cooldown after repeated failed attempts
12. Customer submits checkout form.
13. System atomically reserves the selected time slot capacity.
14. System writes order + order items + delivery/tax snapshots (cents-based) to database.
15. System auto-allocates available prep inventory (oldest non-expired lots first).
16. System marks each order item:
   - `ready_from_prep` when reserved from prep inventory
   - `cook_required` when prep inventory is not enough
17. System auto-generates/updates grouped kitchen tasks by dish and due time.
18. System sets order kitchen group (`cook_now`, `ready_from_prep`, `later`) and priority score.
19. System creates order as `pending_confirmation` (or auto-confirms if configured and checks pass).
20. For manual payments, system sets:
   - `payment_due_at_utc`
   - `confirmation_deadline_utc` (must be before fulfillment using configured buffer)
21. System sends:
   - Owner new-order notification with confirm/cancel action context
   - Customer order-received email with current status
22. Admin confirms or cancels, then kitchen execution proceeds.
23. If payment/confirmation deadline passes while order is still `pending_confirmation`, system auto-cancels and releases reserved capacity/inventory.
24. Kitchen starts cooking only for confirmed orders within valid lead-time windows.

### Confirmation, cancellation, and refund workflow (MVP)

- Default order states:
  - `new` -> `pending_confirmation` -> `confirmed` -> `preparing` -> `completed`
  - alternate path: `pending_confirmation` or `confirmed` -> `cancelled`
- Lead-time and confirmation deadlines:
  - launch defaults:
    - base lead time for all dishes: `1 day` (`24 hours`)
    - per-dish lead time options: `2 days` or `3 days` when needed
    - manual-payment confirmation buffer: `12 hours` before fulfillment
  - order cannot be confirmed if confirmation would violate lead-time/buffer rules
  - `pending_confirmation` orders auto-cancel on timeout and trigger release actions
- Cancellation handling:
  - always capture `cancellation_reason` and `cancelled_at`
  - store `refund_notes` for manual payment resolution where needed
  - on cancellation before completion, system must:
    - release reserved timeslot capacity
    - release any reserved prep inventory quantities
    - regenerate affected kitchen tasks and priority groups
    - append `order_audit_log` event with actor and reason
  - if payment is already marked `paid`, require refund status update (`refunded_partial` or `refunded_full`) before final close
- Payment handling before online cards:
  - accepted methods: `cash`, `zelle`, `venmo`
  - track `payment_status` (`unpaid`, `paid`, `refunded_partial`, `refunded_full`)

### Kitchen grouping and cook-priority rule (v1)

- Group orders by:
  - Due time bucket (`next_60m`, `60_to_180m`, `later`)
  - Dish ID (batch-friendly cooking)
  - Fulfillment source (`prep` vs `cook_required`)
- For each dish, compute:
  - `required_qty = sum(unfulfilled order item quantities due within planning window)`
  - `available_prep_qty = sum(non-expired lot available quantities)`
  - `cook_qty = max(required_qty - available_prep_qty, 0)`
- Priority score:
  - `priority_score = (urgency_weight * due_bucket_score) + (shortage_weight * cook_qty)`
  - v1 constants:
    - `urgency_weight = 10`
    - `shortage_weight = 3`
    - `due_bucket_score = 3` for `next_60m`, `2` for `60_to_180m`, `1` for `later`
- Kitchen board default sort:
  - `cook_now` by highest `priority_score` first
  - then `ready_from_prep` by nearest due time
  - then `later`
- Example:
  - Prep entered: `vegan pho = 6`, `pho = 4`
  - Incoming orders (next 60m): `vegan pho = 8`, `pho = 3`
  - Allocation result:
    - `vegan pho`: 6 ready from prep, 2 to cook now
    - `pho`: 3 ready from prep, 0 to cook now (1 bowl remains available)

## 10) Delivery Fee Logic (Checkout)

- Origin address (fixed for now): `720 Orange Ave, Longwood, FL 32750`.
- Distance method: driving distance (not straight-line).
- Hard delivery cutoff: `>30 miles` is not deliverable.
- Launch default: `max_distance_mi = 30`.
- If address is outside delivery range, customer can continue checkout with pickup.
- Concrete formula (v1):
  - Let `d` = driving distance in miles from the delivery API.
  - Let `d_rounded` = `round(d, 1)` (nearest 0.1 mile).
  - Constants:
    - `base_fee = 4.00`
    - `tier1_rate = 0.90` (for `0-10 miles`)
    - `tier2_rate = 0.65` (for `10-30 miles`)
  - Raw fee:
    - If `0 <= d_rounded <= 10`:
      - `raw_fee = base_fee + (d_rounded * tier1_rate)`
    - If `10 < d_rounded <= 30`:
      - `raw_fee = 13.00 + ((d_rounded - 10) * tier2_rate)`
    - If `d_rounded > 30`:
      - delivery unavailable (delivery checkout path blocked; pickup checkout path remains available)
  - Final fee:
    - `delivery_fee_dollars = round(raw_fee * 2) / 2` (round to nearest `$0.50`)
- Examples:
  - `5.0 mi` -> `4.00 + (5.0 * 0.90) = 8.50` -> final `$8.50`
  - `10.0 mi` -> `4.00 + (10.0 * 0.90) = 13.00` -> final `$13.00`
  - `18.4 mi` -> `13.00 + (8.4 * 0.65) = 18.46` -> final `$18.50`
  - `25.0 mi` -> `13.00 + (15.0 * 0.65) = 22.75` -> final `$23.00`
  - `30.0 mi` -> `13.00 + (20.0 * 0.65) = 26.00` -> final `$26.00`
  - `30.1 mi` -> delivery unavailable, pickup still available
- Implementation notes:
  - Pickup orders always set `delivery_fee_cents = 0`.
  - Round delivery fee to nearest `$0.50` for cleaner pricing.
  - Store `delivery_distance_mi` and `delivery_fee_cents` on each order snapshot.
  - Convert delivery dollars to cents immediately after fee rounding and persist cents only.
  - If delivery API fails, do not silently accept checkout; show retry/manual contact message.

### Tax logic (MVP)

- Tax is calculated on taxable subtotal using active tax rule at checkout time.
- Tax rates are configuration-driven by jurisdiction/effective date (no hardcoded rate in code).
- Florida local surtax differences are handled by updating `tax_rules` rather than changing code.
- Formula:
  - `tax_amount_cents = round_half_up(subtotal_before_tax_cents * tax_rate_snapshot)`
  - `total_after_tax_cents = subtotal_before_tax_cents + delivery_fee_cents + tax_amount_cents`
- Snapshot policy:
  - store `tax_rate_snapshot` and `tax_amount_cents` on every order
  - historical orders do not change if tax rates change later

## 11) Subscription Flow (Email + SMS)

### Email (Phase 1)

- Double opt-in required.
- Weekly featured dish campaigns + major menu updates.
- Unsubscribe link in every email.

### SMS (Phase 2)

- Explicit consent text and opt-in log required (TCPA compliance workflow).
- STOP/HELP handling required.
- Keep SMS to high-value alerts only (dish-of-the-week changes, limited drops).

## 12) Cost Analysis (as of March 2, 2026)

### A) Monthly baseline before card payments

- Domain: typically ~$12-$25/year (~$1-$2/month equivalent).
- Cloudflare stack:
  - Pages + Workers: can start on free tier for MVP traffic.
  - D1 + R2 + KV: usage-based; low at early stage.
- Resend email:
  - Free plan has daily sending limit (100/day)
  - Upgrade later only if volume grows
- Distance API (for delivery fee calculations): usage-based (provider dependent).
- Manual payment phase (`cash`/`zelle`/`venmo`): no card processing fee at launch.
- SMS (optional): usage-based; starts around Twilio SMS base rate plus carrier fees.

Expected launch baseline:

- Cloudflare-only MVP: typically very low fixed monthly cost + usage-based overages.
- If moving to Cloudflare + Supabase hybrid: add Supabase paid-plan baseline when needed.

### B) No-card startup mode and guardrails

- If no payment method is attached, stay within free-tier limits by design.
- Add hard app-level guardrails:
  - request rate limits on checkout endpoints
  - image upload size limits and count limits
  - automated usage monitor with warning thresholds (`70%`, `85%`, `95%`)
- Operational rule:
  - if any provider quota is near limit, automatically pause non-critical features first (newsletter campaigns, heavy admin exports) before blocking checkout.
- Distance cost guardrails:
  - cache distance quotes to reduce repeated API calls
  - use ZIP-level fallback estimate when live routing provider is degraded

### C) Future card payment processor comparison

#### Stripe

- Domestic cards: 2.9% + $0.30 per successful transaction.
- Monthly platform fee: none for standard usage.

Example fees:

- $35 order -> about $1.32 fee
- $60 order -> about $2.04 fee

#### Square (online API)

- Online API: commonly 2.9% + $0.30.
- Hosted online/invoice rates can differ by plan and channel.

Example fees:

- $35 order -> about $1.32 fee
- $60 order -> about $2.04 fee

#### PayPal

- PayPal/Venmo checkout: 3.49% + $0.49.
- Card processing offerings may start lower (for specific flow types).

Example fees:

- $35 PayPal checkout -> about $1.71 fee
- $60 PayPal checkout -> about $2.58 fee

#### Recommendation for later payment launch

- Start with Stripe first when ready for card acceptance:
  - Strong developer tooling
  - Good checkout UX
  - Predictable pricing
  - Fast iteration for coupons/taxes/webhooks
- Add PayPal later as optional second method if customer demand is high.

## 13) Delivery Plan

### Milestone 1: Foundations (Week 1)

- Finalize brand direction, sitemap, schema.
- Set up Cloudflare accounts/projects and environments:
  - Cloudflare Pages project
  - Cloudflare Workers runtime setup (`wrangler`)
  - Cloudflare D1 database
  - Cloudflare R2 bucket
  - Cloudflare Turnstile keys
  - Cloudflare Access policy for `/admin`
- Set up project, database, auth, storage, deployment.
- Build base layout and navigation.

### Milestone 2: Core storefront + dish pages (Week 2)

- Carousel + dish grid + filters + dish detail pages.
- Dietary tags and archive browsing.
- SEO metadata and structured data basics.
- Publish trust pages (allergens, delivery area/fees, payment methods, cancellation policy, story page).

### Milestone 3: Cart + orders + admin (Week 3)

- Cart and checkout form.
- Order persistence + owner/customer emails.
- Admin login + order dashboard + dish CRUD/archive.
- Kitchen board with grouped priorities (`ready_from_prep`, `cook_now`, `later`).
- Prep inventory input and auto-allocation to orders.
- Tax snapshot + total calculation implementation.
- Manual payment method tracking (`cash`, `zelle`, `venmo`).
- Confirmation/cancellation/refund-notes workflow.
- Lead-time eligibility + confirmation deadline enforcement for manual payments.

### Milestone 4: QA + launch prep (Week 4)

- Mobile/performance pass.
- Accessibility checks.
- SEO validation (sitemap/indexing/schema testing).
- Critical workflow tests:
  - `>30 miles` delivery block works exactly at boundary (`30.0` allowed, `30.1` delivery blocked, pickup allowed)
  - lead-time boundary enforced (less than `1 day` blocked, at `1 day` allowed)
  - dish lead-time boundary enforced (less than `2 days` blocked, at `2 days` allowed for 2-day dish)
  - dish lead-time boundary enforced (less than `3 days` blocked, at `3 days` allowed for 3-day dish)
  - manual-payment confirmation buffer enforced before fulfillment
  - tax snapshot and total math is correct and immutable per order
  - cents-based totals match exactly across checkout UI, email, and admin
  - manual payment method is captured and visible in admin
  - cancellation captures reason/timestamp/refund notes
  - cancellation correctly releases slot capacity and prep reservations
  - pending confirmations auto-cancel at deadline and release slot/inventory correctly
  - prep inventory auto-allocation handles concurrent checkout correctly
  - duplicate submit does not create duplicate orders
  - timeslot capacity race conditions are blocked
  - DST boundary test passes for `America/New_York` slot generation and booking
- Accessibility/performance checks:
  - keyboard-only checkout and filter interactions succeed
  - dish badges are not color-only and all media has alt text
  - LCP/INP/CLS/TTFB targets meet MVP budgets
- Backup and recovery drill:
  - D1 backup export/restore test
  - R2 object recovery test
- Monitoring and alerting setup:
  - order submit failures
  - email delivery failures
  - distance API failure rate
  - quota/usage threshold alerts
- Content upload and launch checklist.

## 14) Acceptance Criteria

- Users can browse live dishes, filter by dietary tags, and open detail pages.
- Users can add dishes to cart and submit orders.
- Owner receives order email immediately.
- Admin can log in, view orders, and manage dish lifecycle (`live`/`archived`).
- Orders persist tax snapshot (`tax_rate_snapshot`, `tax_amount_cents`) and correct final totals.
- Orders persist money fields in cents and maintain exact total consistency across UI/email/admin.
- Orders capture manual payment method and payment status.
- Confirmation/cancellation workflow is enforced with audit fields.
- Cancellation releases slot capacity and prep reservations without leaks.
- Slot selection enforces day-based lead-time rules (default `1 day`, with per-dish `2-3 day` options) and confirmation buffer rules.
- Pending manual-payment orders auto-cancel on deadline if unconfirmed/unpaid.
- Fresh-cook lead-time policy is clearly communicated on dish pages, cart, and checkout.
- Kitchen preparation begins only after order confirmation and lead-time validation.
- Admin can input prep inventory counts per dish and see available/reserved quantities.
- System auto-allocates prep inventory first and generates grouped cook tasks for shortages.
- Admin sees grouped kitchen priorities to decide what to cook first.
- Archived dishes remain publicly searchable and viewable.
- Core SEO deliverables are in place (metadata, sitemap, structured data, performance targets).
- Checkout prevents duplicate order creation on retries/double-clicks.
- Time-slot capacity and blackout-date rules are enforced.
- Customers outside delivery range can still place pickup orders.
- Minimum-order rules are configurable but disabled by default at initial launch.
- Turnstile/rate-limit protections are active on checkout endpoints.
- Time slot logic is DST-safe with UTC canonical storage and local display.
- Backup restore test and monitoring alerts are validated before launch.
- Production deployment runs on Cloudflare Pages + Workers (Render is not used in production).

## 15) Risks and Mitigation

- Frequent menu churn can create stale content:
  - Use schedule fields + archive automation + weekly content review
- Delivery of notification emails:
  - Add retry logic + alerting on failed sends
- Tax misconfiguration risk:
  - Use versioned `tax_rules` with effective dates + pre-launch tax test cases
- Money rounding drift across systems:
  - Store/compute in cents only + shared pricing library + snapshot fields
- Manual payment reconciliation errors:
  - Enforce required payment method/status fields and end-of-day reconciliation report
- Manual payment confirmation bottleneck:
  - Enforce lead-time, confirmation buffer, and timeout auto-cancel to protect kitchen prep windows
- Longer lead-time conversion drop risk:
  - Show clear "order by" messaging, next-available dates, and featured upcoming dishes on homepage
- Fresh-cook policy misunderstanding by customers:
  - Repeat lead-time messaging at dish, cart, and checkout with next-available fulfillment date
- Prep inventory freshness/allocation mistakes:
  - Use FEFO reservation (first-expiring, first-out) + expiration alerts + audit events
- Over-capacity or duplicate orders:
  - Enforce atomic slot reservation + idempotency keys + endpoint rate limits
- Timezone and DST slot bugs:
  - UTC canonical storage + DST test suite for `America/New_York`
- Distance API outage/cost spike:
  - Cache-first quote strategy + fallback estimator + usage alerts
- Data loss or service outage risk:
  - Scheduled backups + tested restore runbook + availability alerts
- Runtime/platform mismatch risk:
  - avoid Node-only server dependencies in production code path
  - validate build and runtime behavior in Cloudflare preview and production environments
- SMS compliance risk:
  - Keep SMS in Phase 2 with explicit consent logging and opt-out handling
- Scope creep (payments too early):
  - Hold payment integration until Phase 1 is stable and order flow is validated

## 16) Sources for Pricing Assumptions

- Stripe pricing: https://stripe.com/us/pricing
- PayPal merchant/business fees:
  - https://www.paypal.com/us/webapps/mpp/merchant-fees
  - https://www.paypal.com/us/business/fees
- Square fees: https://squareup.com/us/en/payments/our-fees
- Cloudflare Pages pricing:
  - https://pages.cloudflare.com/
  - https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare D1:
  - https://developers.cloudflare.com/d1/
  - https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Turnstile docs: https://developers.cloudflare.com/turnstile/
- Google Maps Platform pricing: https://mapsplatform.google.com/pricing/
- Mapbox pricing: https://www.mapbox.com/pricing/
- Florida sales and use tax overview: https://floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx
- Vercel pricing: https://vercel.com/pricing
- Supabase billing/usage docs:
  - https://supabase.com/docs/guides/platform/billing-on-supabase
  - https://supabase.com/docs/guides/platform/manage-your-usage/disk-iops
- Resend pricing: https://resend.com/pricing
- Twilio SMS pricing (US): https://www.twilio.com/en-us/sms/pricing/usa
