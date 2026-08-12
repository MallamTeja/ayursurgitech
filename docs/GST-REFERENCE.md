# GST Reference — Surgical & Medical Goods

**Read this before you trust any number in it.**

These rates are a **starting point for a demo catalogue**. They are here so the seed data
looks credible and so the invoice layout can be exercised with realistic figures. They are
not tax advice.

- **The client's accountant must confirm every rate before a single real invoice is issued.**
  Classification is a per-SKU judgement about what a product actually *is* — nobody can make
  that call from a product name, and this document did not try to.
- **Rates change by government notification, not by code.** A GST Council meeting can move a
  whole heading between slabs overnight, with no software release involved. That is precisely
  why the application stores GST as an **editable per-product field** (`products.gstRate` and
  `products.hsnCode`, section 3 of `SPEC.md`) rather than a constant in a lookup table. When
  a rate changes, the admin edits products. Nobody redeploys.
- Every row below is marked **VERIFIED** or **UNVERIFIED**. Verified means the wording was read
  in the cited source. Unverified means it is a plausible classification that was *not*
  confirmed — treat those as questions for the accountant, not as answers.

Snapshot date of this research: **7 August 2026.**

---

## 1. The slab structure

The architect's assumed slabs — `0 | 5 | 12 | 18` — are **out of date.** There is no longer a
12% slab.

India replaced the four-tier structure at the **56th GST Council meeting, New Delhi,
3 September 2025**. The Council's own words:

> "Rationalisation of the current 4-tiered tax rate structure into a citizen-friendly 'Simple
> Tax' — a 2 rate structure with a Standard Rate of 18% and a Merit Rate of 5%; a special
> de-merit rate of 40% for a select few goods and services"

— Ministry of Finance / PIB press release, *Recommendations of the 56th Meeting of the GST
Council*, 3 September 2025. **VERIFIED** (read directly).

Given legal effect by **Notification No. 9/2025-Central Tax (Rate), dated 17 September 2025**
(G.S.R. 641(E)), which **supersedes Notification No. 1/2017-Central Tax (Rate)** and applies
**from 22 September 2025**. Exemptions moved to **Notification No. 10/2025-Central Tax (Rate)**
of the same date, superseding 2/2017. IGST equivalents were notified in parallel.

The schedules in Notification 9/2025, as read from the gazette text — **VERIFIED**:

| Schedule | CGST | Total GST | What is in it |
|---|---|---|---|
| I | 2.5% | **5%** | Merit rate. Effectively all medical and surgical goods. |
| II | 9% | **18%** | Standard rate. |
| III | 20% | **40%** | De-merit: sugary/carbonated drinks, large cars, motorcycles >350cc, yachts, aircraft for personal use, arms. |
| IV | 1.5% | 3% | Bullion, precious metals. |
| V | 0.125% | 0.25% | Rough diamonds and similar. |
| VI | 0.75% | 1.5% | Certain diamond job-work-adjacent entries. |
| VII | 14% | 28% | **Only** pan masala, tobacco, cigarettes, bidis, nicotine inhalation products. |

**There is no 12% schedule and no general 28% schedule.** The 28% figure survives only as
Schedule VII for tobacco and pan masala. So for this shop the live options are **0%, 5% and
18%** — and in practice almost everything is 5%.

Only one amendment since: **Notification No. 01/2026-Central Tax (Rate), dated 30 April 2026**
(in force 1 May 2026), plus a corrigendum of 6 May 2026. It amends four entries, all under
tariff heading **2202** (non-alcoholic beverages). **It touches nothing in Chapters 30, 40, 63
or 90.** The medical rates below therefore stand unchanged as of the snapshot date.
**VERIFIED.**

The 57th GST Council meeting had, as of mid-2026 reporting, been repeatedly deferred, with
compliance and refund process simplification — not further rate changes — flagged as the likely
agenda. **UNVERIFIED** (secondary trade press only, and inherently a moving target). Re-check
before go-live.

---

## 2. Rates by HSN heading

**How to read the "Rate" column.** Notification 9/2025 attaches rates to **4-digit headings**
(occasionally to a longer tariff item). The rate is therefore fully determined by the heading.
The longer 6- and 8-digit codes in the "Typical tariff item" column are the *invoice* codes and
come from the Customs Tariff structure, not from the rate notification — so a wrong 8-digit
code inside the right heading is a paperwork problem, while a wrong heading is a tax problem.

Source keys used below:

- **[N9]** = Notification No. 9/2025-Central Tax (Rate), 17 Sep 2025, in force 22 Sep 2025.
  Gazette text read in full. Schedule and serial numbers cited. **Primary source.**
- **[PIB]** = Ministry of Finance / PIB press release on the 56th GST Council, 3 Sep 2025.
  Read in full. Corroborates [N9] wording and gives the from→to direction.
- **[TAR]** = Customs Tariff 8-digit structure, cross-checked against an HSN directory
  (eximpe.com heading 9018 listing, page reviewed 30 Jun 2025). Structure only — **not** rates.

### Wound care

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **3005** | 3005 10 / 3005 90 | Wadding, gauze, bandages and similar articles (e.g. dressings, adhesive plasters, poultices), **impregnated or coated with pharmaceutical substances, or put up in forms or packings for retail sale** for medical, surgical, dental or veterinary purposes. Adhesive dressings, medicated gauze, retail-packed bandages. | **5%** | **VERIFIED** — [N9] Schedule I, S.No. 235 (exact wording). Was 12%: [PIB]. |
| **5601** | 5601 21 00 | Wadding of textile materials and articles thereof — **absorbent cotton wool**, except cigarette filter rods. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 349. Corroborated [PIB] S.No. 209. |
| **5803** | 5803 00 | **Gauze** (the fabric), other than narrow fabrics of heading 5806. Bulk/unmedicated gauze that is not retail-packed for medical use and so falls outside 3005. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 366. |
| **5208–5212** | — | Woven fabrics of cotton. Catches plain cotton gauze/roll goods classified as fabric. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 334. |

Useful outcome: gauze lands at **5% whichever of 3005 / 5803 / 5208–5212 it falls into**, so
the retail-packing distinction changes the code on the invoice but not the tax. Cotton swabs
follow 3005 if medicated or retail-packed for medical use, otherwise 5601. Both 5%.

### Syringes, needles, IV and infusion

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **9018** | 9018 31 | Syringes, with or without needles — including insulin syringes. | **5%** | Rate **VERIFIED** — [N9] Sch. I, S.No. 483 covers heading 9018 entire, **no exclusions**. Sub-code **UNVERIFIED**. |
| **9018** | 9018 32 | Tubular metal needles and needles for sutures — hypodermic needles, suture needles. | **5%** | Rate **VERIFIED** (same entry). Sub-code **UNVERIFIED** — 8-digit split between injection needles and suture needles not confirmed. |
| **9018** | 9018 39 10 | Catheters (incl. urinary). | **5%** | Rate **VERIFIED**. Sub-code **UNVERIFIED** (trade-data sources only). |
| **9018** | 9018 39 30 | Cannulae — IV cannulas. | **5%** | Rate **VERIFIED**. Sub-code **UNVERIFIED** (trade-data sources only). |
| **9018** | 9018 39 90 | "Other" under syringes/needles/catheters/cannulae — where **IV administration sets, scalp vein / butterfly sets, extension lines and three-way stopcocks** normally sit. | **5%** | Rate **VERIFIED**. Sub-code and the placement of these specific items **UNVERIFIED**. |

The whole-heading coverage of 9018 at 5% is the single most load-bearing fact in this document,
and it is verified against the gazette. The exact wording:

> **483.  9018  —** Instruments and appliances used in medical, surgical, dental or veterinary
> sciences, including scientigraphic apparatus, other electro-medical apparatus and
> sight-testing instruments

No value threshold, no exclusion, no proviso. Anything correctly inside 9018 is 5%.

### Gloves, masks, gowns, caps

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **4015** | 4015 12 | **Surgical rubber gloves or medical examination rubber gloves.** Latex and nitrile (nitrile is synthetic rubber, Chapter 40). | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 275 (exact wording). Corroborated [PIB] S.No. 144. |
| **4015** | 4015 19 | Rubber gloves, mittens and mitts **for all purposes other than surgical** — household, utility, industrial. | **18%** | **VERIFIED** — [N9] Sch. II, S.No. 141: "…for all purposes, of vulcanised rubber other than hard rubber **[other than Surgical gloves]**". |
| **3926** | 3926 20 / 3926 90 | Gloves of **plastic** rather than rubber — PVC / vinyl examination gloves, polythene gloves. | **18%** | Rate **VERIFIED** — [N9] Sch. II, S.No. 127 (3926 other than plastic bangles, plastic beads, feeding bottles). Whether a given vinyl glove is classified here rather than 4015 is **UNVERIFIED** and is a genuine classification question. |
| **6307** | 6307 90 | Face masks of nonwoven / textile — 3-ply surgical masks, N95-type respirators without replaceable filters. Also surgical drapes and other made-up textile articles. | **5%** if sale value **≤ ₹2500 per piece**; **18%** if **> ₹2500 per piece** | **VERIFIED (rate)** — [N9] Sch. I, S.No. 390 (Chapter 63 other than 6305 32 00, 6305 33 00, 6309, ≤ ₹2500/piece) and Sch. II, S.No. 199 (Ch. 63 other than 6309, > ₹2500/piece). **Classification of masks under 6307 90 is UNVERIFIED** — supported only by HSN directories and pre-2025 COVID-era commentary. |
| **6210** / Ch. 62 | 6210 10 | Disposable surgical / isolation **gowns** made up from nonwoven fabrics of heading 5603. | **5%** if ≤ ₹2500 per piece; **18%** if > ₹2500 | Rate for Chapter 62 **VERIFIED** — [N9] Sch. I, S.No. 389 and Sch. II, S.No. 198. Whether a given gown is Chapter 62 (garment) or Chapter 63 (made-up article) is **UNVERIFIED** — either way the same two rates and the same ₹2500 threshold apply, so the threshold matters more than the chapter. |
| **6505** / **6506** | 6505 00 / 6506 99 | Surgical / bouffant **caps**. | **Disputed — see note 5** | **UNVERIFIED.** 6501 "Textile caps" and 6505 "Hats (knitted/crocheted) or made up from lace or other textile fabrics" are at 5% in [N9] Sch. I, S.No. 393 and 394; the *full* 6505 heading and 6506 are at 18% in Sch. II, S.No. 211 and 212. Which side a disposable nonwoven cap falls on is not resolvable from the notification text. **Ask the accountant.** |

### Surgical instruments

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **9018** | 9018 90 22 | **Surgical** knives, scissors and blades — including scalpel handles and scalpel blades. | **5%** | Rate **VERIFIED** — [N9] Sch. I, S.No. 483. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 90 23 | Forceps, forcep clamps, clips, needle holders, introducers, bone-holding and other holding instruments. | **5%** | Rate **VERIFIED**. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 90 25 | Retractors, spatula probes, hooks, dilators, sounds, mallets. | **5%** | Rate **VERIFIED**. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 90 21 | Bone saws, drills, trephines. | **5%** | Rate **VERIFIED**. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 90 24 | Chisels, gouges, elevators, raspatories, osteotomes, craniotomes, bone cutters. | **5%** | Rate **VERIFIED**. Sub-code **VERIFIED** against [TAR]. |
| **8213** | 8213 00 00 | **Scissors, tailors' shears and similar shears, and blades therefor** — i.e. scissors as *cutlery*, not as surgical instruments. | **18%** | **VERIFIED** — [N9] Sch. II, S.No. 373. **This is the trap. See note 1.** |
| **8214** | 8214 20 | Other cutlery; manicure and pedicure sets and instruments including nail files. | **18%** | **VERIFIED** — [N9] Sch. II, S.No. 374. |

### Sutures

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **3006** | 3006 10 | **Sterile** surgical catgut, similar **sterile** suture materials (incl. sterile absorbable surgical or dental yarns), **sterile** tissue adhesives for surgical wound closure; sterile laminaria; sterile absorbable haemostatics; sterile adhesion barriers. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 236 (exact wording, Chapter 30 Note 4). Corroborated [PIB] S.No. 117. |
| **9018** | 9018 32 | The **needle** on a needled suture, considered separately. | **5%** | Rate **VERIFIED**. Same rate either way, so a needled suture is 5% under either reading. |

Note the word **sterile**, which appears four times in the heading text. See note 3.

### Diagnostics

| HSN heading | Typical tariff item | What it covers | GST | Status |
|---|---|---|---|---|
| **9018** | 9018 90 11 | **Instrument and apparatus for measuring blood pressure** — sphygmomanometers, aneroid and digital BP monitors. | **5%** | Rate **VERIFIED** — [N9] Sch. I, S.No. 483. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 90 12 | **Stethoscopes.** | **5%** | Rate **VERIFIED**. Sub-code **VERIFIED** against [TAR]. |
| **9018** | 9018 19 (Other, electro-diagnostic) | **Pulse oximeters.** | **5%** | Rate **VERIFIED** *provided* the product is inside heading 9018 — which it is on any reading. The **sub-heading is UNVERIFIED**; 9018 19 and 9018 90 are both used in practice. Rate is 5% either way. |
| **9025** | 9025 11 / 9025 19 | **Thermometers for medical, surgical, dental or veterinary usage.** | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 488. Was **18%** → 5%: [PIB] "(18% to 5%)" annexure, S.No. 1. |
| **9025** | 9025 11 / 9025 19 | Thermometers, hydrometers, barometers, hygrometers **other than** for medical/surgical/dental/veterinary usage. | **18%** | **VERIFIED** — [N9] Sch. II, S.No. 574, exclusion worded explicitly. **See note 2.** |
| **3822** | 3822 19 / 3822 90 | **All diagnostic kits or reagents**, including certified reference materials. Test strips, rapid test kits, IVD reagents. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 263. |
| **90 or any chapter** | — | **Blood glucose monitoring system (glucometer) and test strips** — named explicitly, regardless of chapter. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 475. |
| **9027** | 9027 80 | Instruments and apparatus **for medical, surgical, dental or veterinary uses**, for physical or chemical analysis. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 489. |
| **9027** | 9027 80 | The same kinds of analysis instruments **not** for medical/surgical/dental/veterinary use — i.e. laboratory and industrial. | **18%** | **VERIFIED** — [N9] Sch. II, S.No. 576, exclusion worded explicitly. **See note 2.** |
| **9019** | 9019 20 | Nebulisers, oxygen therapy, aerosol therapy, artificial respiration apparatus; mechano-therapy; massage apparatus. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 484. |
| **9020** | 9020 00 | Other breathing appliances and gas masks, **excluding protective masks having neither mechanical parts nor replaceable filters**. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 485. **See note 4 — this exclusion is why plain masks are not 9020.** |
| **9021** | 9021 10 etc. | Orthopaedic appliances, surgical belts and trusses, splints and fracture appliances, artificial body parts, intraocular lenses **[other than hearing aids]**. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 486. |
| **9022** | 9022 12 etc. | X-ray and radiation apparatus for medical/surgical/dental/veterinary use. | **5%** | **VERIFIED** — [N9] Sch. I, S.No. 487. |

---

## 3. Notes — the things that trip people up

**1. Surgical scissors are 5%; scissors are 18%. Same object, two slabs.**
Heading **8213** (scissors and shears, and blades therefor) is Schedule II — **18%**. Heading
**9018 90 22** (surgical knives, scissors and blades) is Schedule I — **5%**. The distinction
is whether the item is an *instrument for use in medical/surgical science* or a piece of
*cutlery*. A supplier who copies "scissors → 8213 → 18%" out of a generic HSN lookup will
overcharge on every pair of Mayo scissors in the catalogue. The same reasoning applies to
scalpel blades: 9018, not 8211/8212.

**2. Three headings are split by intended use, with the split written into the text.**
This is the mechanism to understand, because it recurs:

| Heading | 5% wording (Schedule I) | 18% wording (Schedule II) |
|---|---|---|
| 4015 | "Surgical rubber gloves or medical examination rubber gloves" | "…gloves, mittens and mitts, for all purposes… **[other than Surgical gloves]**" |
| 9025 | "Thermometers **for medical, surgical, dental or veterinary usage**" | "…thermometers… **[other than thermometers for medical, surgical, dental or veterinary usage]**" |
| 9027 | "…**for medical, surgical, dental or veterinary uses**, for physical or chemical analysis" | "…**[other than** instruments and apparatus **for medical, surgical, dental or veterinary uses**…**]**" |

So **the HSN code alone does not determine the rate** for these three. A product tagged `9025`
could correctly be 5% or 18%. The catalogue stores the resolved rate per product, which is the
right shape — but it means a bare HSN code is never enough to audit a rate.

Worth flagging to the accountant: the 4015 Schedule I entry says "surgical **or medical
examination**" gloves, while the Schedule II exclusion says only "**[other than Surgical
gloves]**". Read strictly, examination gloves are inside Schedule I's 5% description and are
*not* inside Schedule II's exclusion — two entries that arguably both reach them. In practice
the specific Schedule I entry governs and examination gloves are 5%, which is also what the
Council announced. But it is a drafting seam, and it is exactly the kind of thing a department
officer can raise. **This reading is UNVERIFIED** — no circular or advance ruling on it was
located.

**3. "Sterile" is doing real work in the sutures heading.**
Heading **3006** covers *sterile* catgut, *sterile* suture materials, *sterile* tissue
adhesives. A non-sterile suture thread is not a 3006 good and falls back to whatever textile or
other heading actually describes it, at that heading's rate. Nearly everything a surgical shop
sells is sterile and packaged as such, so this rarely bites — but "suture" on a product name is
not by itself evidence of 3006.

**4. Masks are textiles, not breathing appliances.**
Heading **9020** (5%) explicitly **excludes** "protective masks having neither mechanical parts
nor replaceable filters". A 3-ply surgical mask has neither. Nor does a moulded N95 respirator,
whose filter media is integral rather than replaceable. So both are pushed out of 9020 and land
in Chapter 63 as made-up textile articles (typically 6307 90) — which means their rate is set by
the value threshold in note 5, not by heading 9020. Only masks with mechanical parts or genuinely
replaceable filter cartridges — reusable half-face respirators — stay in 9020.

**5. For masks, gowns, caps and drapes the rate depends on the price, not the product.**
Chapters 61, 62 and 63 are split by **sale value per piece**:

- **≤ ₹2500 per piece → 5%** ([N9] Schedule I, S.No. 388 / 389 / 390)
- **> ₹2500 per piece → 18%** ([N9] Schedule II, S.No. 197 / 198 / 199)

Both **VERIFIED** from the gazette text. Two consequences:

- The old threshold was ₹1000, and a great deal of web commentary still quotes ₹1000 and 12%.
  Those pages are pre-22-September-2025. Ignore them.
- **This is the one case where editing a price should force a review of the GST rate.** Nothing
  in the application links the two. For disposables it never matters — a mask is a few rupees a
  piece. It could matter for a reusable surgical gown or a specialist drape priced above ₹2500.

Also note the threshold is on **sale value**, i.e. the taxable value, which is the
GST-exclusive figure. `products.price` is stored GST-exclusive (section 2 of `SPEC.md`), so
`price > 250000` paise is the correct test. That is a happy accident of the storage decision,
not something it was designed for.

**6. Almost every rate aggregator on the web is stale, and stale in a specific direction.**
Pages consulted during this research still showed:

- ClearTax's HSN 9018 page: "**5/12%**", with its own disclaimer that rates were "updated up to
  the GST (Rate) notification no. 05/2020 dated 16th October 2020."
- Multiple HSN directories: 12% for medical devices, ₹1000 textile threshold, "surgical masks at
  12%".

The 12% figures are not wrong-for-a-different-product, they are **superseded**. If a rate in the
seeded catalogue is 12%, it came from a stale page or from memory, and it is wrong. There is no
12% schedule to be right about.

**7. Where the 5% rate came *from* differs, and the direction matters for old stock and credit.**
Per [PIB], medical goods arrived at 5% along two different paths: 12%→5% for wadding, gauze,
bandages, diagnostic kits, glucometers, syringes, needles, surgical instruments and gloves; and
18%→5% for medical/surgical thermometers and for apparatus for physical or chemical analysis for
medical use. Irrelevant to a fresh invoice, relevant to any transitional-credit or price-revision
question the accountant may ask.

**8. HSN digits required on the invoice depend on turnover, not on the product.**
Under Notification 78/2020-Central Tax (15 October 2020), effective 1 April 2021: aggregate
annual turnover **up to ₹5 crore → 4 digits** (mandatory on B2B, optional on B2C); **above
₹5 crore → 6 digits** on all invoices. **VERIFIED** against a PIB release of 1 April 2021 and
the notification's text as reported; the 2026 status is from secondary sources and is
**UNVERIFIED**. Practical effect: `hsnCode` is a free-text string, so storing the full 8-digit
code is safe — 8 digits satisfies both thresholds. Storing 4 digits does not, if the client ever
crosses ₹5 crore.

---

## 4. What this means for the data model

Three findings, in order of how much they matter.

**a. The `gstRate` enum in `SPEC.md` section 3 is wrong.** It reads
`gstRate: Number // percent: 0 | 5 | 12 | 18`. There is no 12% slab. Two options, both cheap:

- Narrow the comment to `0 | 5 | 18` — correct for this catalogue and for the whole of Chapters
  30, 40, 63 and 90 that it sells from.
- Or drop the enumeration from the comment entirely and validate only "is a non-negative number",
  which is what a field that tracks government notifications actually wants. 40% exists;
  0.25%, 1.5% and 3% exist for bullion and diamonds. None will ever appear in this shop, but a
  hardcoded list is a thing that has to be edited when Delhi changes its mind, and the whole
  point of the per-product field was to avoid that.

Either way `12` should not be offered in the admin form's dropdown, because selecting it would
produce an invoice at a rate that no longer exists. **This is a `SPEC.md` change and is not made
here.**

**b. Nothing links a price edit to a GST-rate review — and for one whole category it should.**
For Chapter 61/62/63 goods (masks, gowns, caps, drapes) the rate is a function of the per-piece
price crossing ₹2500. An admin who raises a gown from ₹2400 to ₹2600 has silently changed its
correct GST rate from 5% to 18%, and the form will happily save the old rate. The lazy fix is not
validation logic — it is a one-line hint next to the rate field on the product form for
HSN codes starting `61`, `62` or `63`, saying the ₹2500/piece threshold applies. A `ponytail:`
comment plus a note in the admin UI is proportionate for a demo; real enforcement is the
accountant's job, not the app's.

**c. `hsnCode` as a single per-product string is the right shape — the model is not wrong.**
Confirmed by the research rather than doubted by it:

- Rates attach to headings, and a product has exactly one heading. One string per product is
  correct.
- Rate and HSN are stored **independently**, which is necessary: for headings 4015, 9025 and 9027
  the same HSN carries two different rates depending on intended use. A model that derived the
  rate from the HSN code would be unable to represent surgical vs. household gloves. The
  architect got this right, possibly by accident.
- Both are **snapshotted into `orders.items[]`** (section 3). This is not merely nice — an
  invoice must show the rate and HSN that applied on the date of supply. When the next Council
  meeting moves a heading, historical invoices must not move with it. The snapshot is what makes
  that true.
- Prices stored **GST-exclusive** matches how the tax is computed and how the ₹2500 threshold is
  measured. Correct.
- Per-line GST rounding (section 2) matches line-item invoice presentation. Correct.

One gap worth naming, not fixing: a real GST invoice needs an **HSN-wise summary** — taxable
value and tax grouped by HSN and rate — and it needs CGST and SGST shown **separately at half
the rate each** for an intra-state supply, or IGST at the full rate for inter-state. The order
model stores a single `gstRate` and `lineGst` per line, which is enough to compute all of that at
render time and is the right place to stop for a demo. It is not enough to call the checkout
breakdown a tax invoice.

---

## 5. Sources

Primary, read directly:

- **Notification No. 9/2025-Central Tax (Rate)**, 17 September 2025, G.S.R. 641(E) — full
  gazette text, 52 pages, all seven schedules. Mirror:
  https://taxo.online/wp-content/uploads/2025/09/09_2025-CTR.pdf
- **Ministry of Finance / PIB, *Recommendations of the 56th Meeting of the GST Council***,
  3 September 2025 — full text, 117 pages including Annexures I and II:
  https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau_0.pdf

Secondary, used only where marked:

- Notification No. 01/2026-Central Tax (Rate), 30 April 2026, and corrigendum of 6 May 2026, as
  reported at https://taxguru.in/goods-and-service-tax/cbic-revises-gst-rate-notification-under-finance-act-2026.html
- Notification No. 10/2025-Central Tax (Rate), 17 September 2025 (exemptions, superseding
  2/2017), as reported by CAclubindia and TaxO.
- Customs Tariff 8-digit structure for heading 9018: https://eximpe.com/hsncode-finder/90189011
  (page reviewed 30 June 2025) — **structure only, its rates were not relied on**.
- Notification 78/2020-Central Tax and PIB release of 1 April 2021 on HSN digit requirements.
- EY India alert, *GST reduction on medicines and medical devices*, 4 September 2025 — direction
  of change only; contains no HSN codes.

Deliberately **not** relied on for any rate: ClearTax HSN pages, busy.in, vakilsearch,
dripcapital, cybex, volza, registerkaro, shipglobal, and similar HSN directories. Several were
consulted and several were demonstrably stale (12% rates, ₹1000 textile threshold). They are
useful for tariff *structure*, not for rates.

CBIC also published a **GST Ready Reckoner of CGST rates on goods as on 22 September 2025**,
which is the practical lookup to hand the accountant. It was not retrieved for this document.
