# AyurSurgiTech — UX Conventions for Indian Surgical Supply

Category conventions for the pages. Subordinate to `SPEC.md` and `DESIGN-SYSTEM.md` — where
this file and those disagree, those win. Every rule below is buildable with the frozen
section 3 schema. Anything needing a new field is in the last section only.

The buyer is institutional: hospitals, clinics, nursing homes, small distributors, and
practitioners buying for a practice — not a patient buying one item
([IndiaMART surgical disposables](https://dir.indiamart.com/impcat/medical-surgical-disposables.html),
[STS Medicals](https://stsmedicals.com/blog/surgical-disposable-products-manufactured-in-india-for-hospitals-export-market/)).
Every rule below follows from that.

---

## 1. GST presentation

The category is split, and the split is by buyer, not by product:

- **Retail pharma** (Tata 1mg, Netmeds, PharmEasy) shows an MRP inclusive of tax and
  **never mentions GST while browsing** — verified on
  [1mg's gloves category](https://www.1mg.com/categories/medical-devices/gloves-398): price
  is `₹660 ₹1026 36% off`, no tax text anywhere.
- **Trade / B2B** quotes bare per-unit prices with tax added on: IndiaMART tiles read
  `₹ 78 / Piece`, `₹ 3,500 / Pack`; Dispowear lists `Rs 21.5 per piece + 12% GST`
  ([Dispowear](https://www.dispowear.co.in/surgical-disposables.html)). Medikabazaar leads
  with quotes and "GST invoice" as a feature, not with tax-inclusive shelf prices
  ([Medikabazaar](https://www.medikabazaar.com/shop)).

SPEC's bare-price-then-GST-at-checkout is the **trade** convention. It is correct, and the
legal footing is real: LMPC Rules 2011 Rule 3 exempts packages meant for institutional and
industrial consumers from the MRP / inclusive-of-all-taxes declaration
([Dept. of Consumer Affairs FAQ](https://consumeraffairs.gov.in/public/upload/admin/cmsfiles/whatsnews/Frequently_Asked_Questions_on_Legal_Metrology_whatsnews.pdf),
[TaxGuru](https://taxguru.in/corporate-law/faqs-legal-metrology-packaged-commodities-rules-2011.html)).
That exemption is conditional on the site presenting itself as trade. So:

1. **Declare the trade framing in exactly two places, verbatim:**
   footer line and checkout summary heading —
   *"All prices are trade prices, exclusive of GST. GST is added at checkout."*
   Without this, a bare price on a browse page reads as a bait price and loses the Rule 3
   footing. This one line is what makes the whole GST-exclusive model legitimate.
2. **Cart, under the subtotal, one muted `text-sm` line:**
   *"GST and delivery calculated at checkout."* This is a note, not a figure — SPEC's "cart
   shows no GST, no delivery" still holds. Without it the number jumps at checkout and the
   buyer re-checks the arithmetic instead of paying.
3. **Card and detail price keep exactly `+ GST`** per DESIGN-SYSTEM. Do not put the rate
   next to the price. The rate belongs in one place: the checkout GST row.
4. **Say "GST invoice" as a trust line, not "tax invoice".** Put it in the footer and on the
   order confirmation: *"GST invoice with HSN codes issued for every order."* Medikabazaar
   headlines exactly this because ITC-claiming buyers filter on it. The order detail page
   already prints `hsnCode` per line (SPEC §2), so this is a true claim as built.
5. Never show a per-line GST figure in the cart or on a product page. Buyers compare
   pre-tax numbers because that is the number a competitor quotes.

> **Ambiguity for the architect, not a schema change.** SPEC §2 says the checkout GST row is
> "one line, with the rate", but `gstRate` is per product, so a cart mixing 5% and 12% items
> has no single rate. Recommended reading, no arithmetic change: keep the single `gstTotal`
> row; label it `GST (12%)` when every line shares a rate, and `GST (5%, 12%)` when they do
> not. 12% is the common rate for bandages, gauze, gloves and dressings
> ([ClearTax](https://cleartax.in/s/impact-of-gst-rate-on-pharmaceutical-industry)), so
> mixed carts will be routine, not rare.

## 2. Pack size and unit of measure

Every established player writes the pack into the product title. Nobody makes the buyer hunt
for it:

- Moglix: `Surgicare Sterile Latex Surgical Gloves, Size: 6 (Pack of 25)`
- Kogland: `MEDISMART Sterile Latex Pre-Powdered Surgical Gloves; Pack of 500`
- IndiaMART: `Cotton Bandages (120 Rolls) — ₹ 599/Pack`
- 1mg: `Tata 1mg Latex Non-Sterile Examination Gloves Medium` then `100 Gloves` on its own line

Rules:

6. **The pack size goes into `name` as a suffix after a comma.** Field order inside the name:
   brand → product → size or spec → pack.
   `Sterile Gauze Swab 10x10cm 12-Ply, Pack of 100`. Never lead with the pack.
7. **Fixed vocabulary for that suffix — no synonyms:** `Pack of 100`, `Box of 50`,
   `Roll of 5m`, `Strip of 10`, `Bottle of 500ml`, `Pair`. Not `Qty 100`, not `x100`, not
   `(100 pcs)`, not `100's`. Inconsistent pack vocabulary across a grid is the fastest way to
   look like a scraped catalogue.
8. **Product card names clamp to 2 lines minimum, never 1.** The pack size lives at the end
   of the name, so a single-line ellipsis deletes the most important number on the card. This
   is a hard layout constraint, not a preference.
9. **Search must match the pack suffix.** `/products?q=pack of 100` and `q=box` have to
   return sensible results, because the pack is the only place that data exists. SPEC's `q`
   already searches `name`; do not narrow it.
10. Category and subcategory names stay in trade language — `Gauze & Swabs`, `Sutures`,
    `IV Cannulae`, `Wound Care` — not consumer language like `First Aid Essentials`.

## 3. Minimum order quantity

11. **Prefill the stepper at `minOrderQty`, never at 1.** A stepper showing `1` on a product
    with a minimum of 10 is a trap the buyer walks into.
12. **When `minOrderQty > 1`, show a permanent line under the stepper:** `Minimum order: 10`.
    Always visible, not only after a violation. DESIGN-SYSTEM's *"Minimum order 10 pieces"*
    stays as the on-violation message; this is the resting state. B2B guidance is explicit
    that the constraint has to be stated up front rather than enforced on submit
    ([B2Bridge on quantity rules](https://b2bridge.io/blog/product-quantity-increments/),
    [Shopify B2B quantity rules](https://help.shopify.com/en/manual/b2b/catalogs/quantity-pricing)).
13. **Product card gets a `Min 10` pill only when `minOrderQty > 1`.** Suppress it entirely at
    1 — a `Min 1` badge on every card is noise that trains people to ignore the badge.
14. **The cart re-checks `minOrderQty` and blocks "Proceed to checkout" with the number
    shown.** The cart is `localStorage` and the admin can raise a minimum after the item was
    added. SPEC's `POST /orders` 400 is the backstop, not the UX.
15. Phrase the minimum as a sale unit, never as a restriction. `Minimum order: 10` — not
    "You must buy at least 10", not "Order limit".

## 4. Tone and density

16. **The description is a spec sheet, not sales copy.** `description` is plain text with
    newlines preserved, so seed it as `Label: value` lines and render with
    `white-space: pre-line`:

    ```
    Material: 100% absorbent cotton, bleached
    Size: 10cm x 10cm, 12 ply
    Sterility: Sterile, EO gas sterilised
    Packaging: 100 swabs per pack
    Single use only. For professional use.
    ```

    No paragraph explaining what gauze is for. This audience knows. Explaining the product is
    the single loudest tell of a consumer template dropped on a trade catalogue.
17. **Sterility, single-use and professional-use notices live in that description block**, not
    as badges — there is no field for them and inventing a badge from parsed prose is worse
    than prose.
18. **Search is a visible field in the header at every breakpoint, not an icon that expands.**
    Institutional buyers arrive with a product name or a brand in mind; browse is the fallback.
19. **Render nothing at all when `ratingCount === 0`** — no empty stars, no "0 reviews", no
    "Be the first to review". Empty stars on a surgical consumable read as a product defect.
    In this category credentials outrank reviews, so ratings never appear above the price.
20. **Address label placeholders lead institutional:** suggest `Clinic`, `Hospital`, `Store`,
    then `Home`. SPEC's schema comment already hints `"Clinic"`.
21. **Reorder is the dominant journey, not discovery.** Give each row on `/orders` an
    "Order again" control that repopulates the cart from the order's snapshotted
    `items[].productId` and `qty`. No new field. *(New control, not in SPEC §5's page list —
    architect may cut it for scope, but it is the highest-value single button on the site for
    this audience.)*

## 5. Trust signals this category carries and ordinary retail does not

22. **Compliance block in the footer, its own column, not fine print.** Contents, in order:
    legal entity name; registered address; GSTIN; Drug Licence No. (wholesale and retail);
    ISO 13485 / CE line if claimed. IndiaMART sellers headline `ISO, CE & WHO:GMP certified`
    and display the seller GSTIN on the product page itself
    ([Surgeons Solution](https://m.indiamart.com/surgeons-solution)); pharmacy name and
    licence number displayed on the website is a regulatory requirement for anything
    drug-scheduled
    ([PSR Compliance](https://www.psrcompliance.com/blog/online-pharmacy-license-india)).
23. **Grievance Officer block: name, email, phone.** Mandatory under the Consumer Protection
    (E-Commerce) Rules 2020 along with legal name, principal geographic address and customer
    care contact
    ([TeamLease RegTech](https://www.teamleaseregtech.com/blogs/134/e-commerce-compliance-in-india-understanding-the-consumer-protection-e-commerce-rules-2020/),
    [Trilegal](https://trilegal.com/knowledge_repository/consumer-protection-e-commerce-rules-2020/)).
    A generic Indian retail footer omits this; a legitimate medical one cannot.
24. **All licence and GSTIN values in the demo are obviously-formatted placeholders and are
    labelled as such** in a `ponytail:` comment at the site. A fabricated drug licence number
    on a live page is a fake compliance claim, not sample data.
25. **Footer column order:** Company → Compliance → Policies → Contact & Grievance. Policies
    must include Shipping, Returns & Replacement, and Cancellation as separate links — a
    single "Policies" link is a retail habit and reads as evasive here.
26. **Footer must NOT contain** a newsletter signup as its dominant block, app-store badges,
    press or "as seen on" logos, or a social-icon row above the compliance block. None of the
    trade players carry these; they are consumer-retail furniture.
27. **One line, footer and checkout:** *"For professional and institutional use."* This is
    also what supports the Rule 3 institutional framing in §1.

## 6. Availability and lead time

28. **Show the exact `stockQty` on the product detail page, always** — `142 in stock`. This
    inverts consumer retail, where a count is a scarcity gimmick shown only when low. A buyer
    ordering 200 of something needs to know whether one order covers it before they build a
    cart. Highest-value non-obvious rule in this document.
29. **Product cards show a count only when `0 < stockQty <= 10`:** `Only 8 left`. Above that,
    the in-stock badge alone.
30. **The out-of-stock badge reads `Out of stock`, never `Sold out`.** Trade vocabulary, and
    DESIGN-SYSTEM already forbids red for it — out of stock here means "call us", not "gone".
31. **Dispatch window, not a delivery date.** One static line on product detail and checkout:
    *"Dispatched in 24–48 hours."* The category norm is a stated dispatch window
    ([MeddeyGo: 24–48 hours](https://meddeygo.com/collections/surgical),
    [Skytech: 3 working days](https://surgicalshoppe.co.in/)); Moglix shows both a
    `24 hrs Dispatch` badge and a `Get it by Friday, 14 August` estimate. Never promise a
    dated arrival — there is no courier integration and a missed date on a clinic's
    consumables order is the complaint that kills the account.
32. **State the flat delivery fee in the Shipping policy and at checkout, not on product
    pages.** SPEC §2 keeps product pages to the unit price; the flat-fee model is unusual
    enough in trade that it needs explaining once, in the policy, in full sentences.

---

## Would require a schema change — architect decides

Not build instructions. Each is a `products` field unless stated.

| Field | Why it might be worth it |
|---|---|
| `packSize: Number` + `uom: String` | Enables IndiaMART's universal `₹599 / Pack` price format and a per-piece unit price. Per-unit cost is *the* comparison in this category, and with the pack trapped inside `name` nothing can compute it. Also the LMPC "unit sale price" declaration. |
| `mrp: Number` | Every Indian medical seller shows a struck MRP and a % off — 1mg `₹660 ₹1026 36% off`, Moglix `₹552 ₹1,950`. With one `price` field the site has no discount presentation at all, which is the largest visual divergence from every competitor. |
| `brand: String` | Brand is the primary filter for institutional buyers (Romsons, 3M, Medismart, Datar). Currently trapped in `name`, so no brand facet and no brand landing page is possible. Subcategory chips are the only filter the site has. |
| `orderMultiple: Number` | SPEC explicitly rejected pack multiples. Real trade buys in cases; without it someone orders 137 units of a 50-per-box item and the warehouse has to phone them. |
| `users.gstin` + `orders.buyerGstin` snapshot | A hospital or clinic cannot claim input tax credit without its own GSTIN on the invoice ([Adrine](https://www.adrine.in/blog/gst-for-hospitals-india-2026)). For a GST-registered buyer this is the most likely reason to abandon at checkout. Snapshot it on the order like the address. |
| `sterile: Boolean`, `singleUse: Boolean` | Turns the sterility notice into a badge and a filter instead of prose inside `description`. Sterile vs non-sterile is a hard purchase criterion, not a nice-to-have. |
| `leadTimeDays: Number` | Per-product dispatch window. Stocked disposables and indent items behave differently and one site-wide "24–48 hours" line will eventually be a lie. |
| `settings.freeDeliveryOverPaise` | Free freight above an order value is the trade norm; one flat fee on a ₹40,000 bulk order looks arbitrary. Small change, settings-only. |

**Deliberately not recommended:** `batchNo` and `expiryDate` on `products`. Both are
per-consignment, belong on the pack and the invoice, and modelling them on a catalogue
document means the displayed value is wrong the moment stock rotates. Labelling rules require
them on the physical label — `Lot No.`, `Expiry date` / `Shelf Life` — not on a listing
([CDSCO labelling requirements](https://morulaa.com/knowledge-hub/regulations/india/medical-device-labeling-india-cdsco)).
