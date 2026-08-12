// Wipes the six collections and inserts a demo catalogue. Safe to run repeatedly.
//   npm run seed
import 'dotenv/config'
import { computeOrderTotals } from './lib/pricing.js'
import { recomputeProductRating } from './lib/rating.js'
import {
  DEFAULT_DELIVERY_FEE,
  categories as Categories,
  orders as Orders,
  products as Products,
  reviews as Reviews,
  settings as SettingsStore,
  users as Users,
} from './lib/store.js'

// Placeholder art, on brand. Real photos arrive through the admin uploader.
const img = (text) => `https://placehold.co/800x800/FAF8F4/14432A?text=${text.replace(/ /g, '+')}`

const CATEGORIES = [
  {
    name: 'Wound Care',
    slug: 'wound-care',
    order: 1,
    image: img('Wound Care'),
    subcategories: [
      { name: 'Gauze & Swabs', slug: 'gauze-swabs' },
      { name: 'Bandages', slug: 'bandages' },
      { name: 'Adhesive Dressings', slug: 'adhesive-dressings' },
      { name: 'Cotton & Wool', slug: 'cotton-wool' },
    ],
  },
  {
    name: 'Syringes & Needles',
    slug: 'syringes-needles',
    order: 2,
    image: img('Syringes'),
    subcategories: [
      { name: 'Disposable Syringes', slug: 'disposable-syringes' },
      { name: 'Hypodermic Needles', slug: 'hypodermic-needles' },
      { name: 'Insulin Syringes', slug: 'insulin-syringes' },
      { name: 'Scalp Vein Sets', slug: 'scalp-vein-sets' },
    ],
  },
  {
    name: 'Gloves & PPE',
    slug: 'gloves-ppe',
    order: 3,
    image: img('Gloves and PPE'),
    subcategories: [
      { name: 'Examination Gloves', slug: 'examination-gloves' },
      { name: 'Surgical Gloves', slug: 'surgical-gloves' },
      { name: 'Face Masks', slug: 'face-masks' },
      { name: 'Gowns & Caps', slug: 'gowns-caps' },
    ],
  },
  {
    name: 'Surgical Instruments',
    slug: 'surgical-instruments',
    order: 4,
    image: img('Instruments'),
    subcategories: [
      { name: 'Scissors & Forceps', slug: 'scissors-forceps' },
      { name: 'Scalpels & Blades', slug: 'scalpels-blades' },
      { name: 'Sutures', slug: 'sutures' },
      { name: 'Clamps', slug: 'clamps' },
    ],
  },
  {
    name: 'Diagnostics',
    slug: 'diagnostics',
    order: 5,
    image: img('Diagnostics'),
    subcategories: [
      { name: 'BP Monitors', slug: 'bp-monitors' },
      { name: 'Thermometers', slug: 'thermometers' },
      { name: 'Pulse Oximeters', slug: 'pulse-oximeters' },
      { name: 'Stethoscopes', slug: 'stethoscopes' },
    ],
  },
  {
    name: 'IV & Infusion',
    slug: 'iv-infusion',
    order: 6,
    image: img('IV and Infusion'),
    subcategories: [
      { name: 'IV Sets', slug: 'iv-sets' },
      { name: 'IV Cannulas', slug: 'iv-cannulas' },
      { name: 'Extension Lines', slug: 'extension-lines' },
      { name: 'Three-way Stopcocks', slug: 'three-way-stopcocks' },
    ],
  },
]

// ---------------------------------------------------------------------------
// GST RATES AND HSN CODES BELOW ARE DEMO DATA.
//
// Source of every rate here: docs/GST-REFERENCE.md, which cites Notification
// No. 9/2025-Central Tax (Rate) dated 17 Sep 2025 (in force 22 Sep 2025) and
// the 56th GST Council press release of 3 Sep 2025.
//
// THE CLIENT'S ACCOUNTANT MUST CONFIRM EVERY RATE AND CODE BEFORE THIS TOUCHES
// A REAL INVOICE. Classification is a per-SKU judgement about what a product
// actually is; it cannot be made from a product name. GST slabs change by
// government order, not by code.
//
// What that document establishes, and why these numbers look the way they do:
//   - There is NO 12% slab. It was abolished on 22 Sep 2025. The live options
//     are 0 / 5 / 18 (plus 40% de-merit, which this shop never touches).
//   - Heading 9018 is 5% ENTIRE — no exclusions, no price threshold. Syringes,
//     needles, cannulae, IV sets, BP monitors, stethoscopes, oximeters,
//     surgical scissors, scalpel blades, forceps and clamps are all 5%.
//   - Trap: surgical scissors and blades are 9018 (5%). Scissors as cutlery
//     are 8213 (18%). A generic HSN lookup returns 8213 and would overcharge
//     every instrument in this catalogue.
//   - Trap: masks, gowns and caps are TEXTILES (Ch. 62/63), not appliances —
//     heading 9020 explicitly excludes masks with neither mechanical parts nor
//     replaceable filters, which is exactly a 3-ply or a moulded N95.
//   - ponytail: for those Ch. 62/63 goods the rate is a function of PRICE —
//     5% at or below Rs 2500 per piece, 18% above (i.e. price > 250000 paise,
//     since prices are stored GST-exclusive). Everything here is a few rupees
//     a piece, so all are 5%. Nothing in the app links a price edit to a rate
//     review; the upgrade path is a hint on the admin product form for HSN
//     codes starting 61/62/63. Real enforcement is the accountant's job.
//   - Caps are deliberately absent from this catalogue: whether a disposable
//     nonwoven cap is 5% or 18% is not resolvable from the notification text.
//
// `price` is integer paise and GST-EXCLUSIVE. 24000 means Rs 240.00.
// ---------------------------------------------------------------------------
const PRODUCTS = [
  // --- Wound Care ---
  {
    sub: 'gauze-swabs',
    name: 'Sterile Gauze Swab 10cm × 10cm, Pack of 100',
    slug: 'sterile-gauze-swab-10x10-pack-100',
    brand: 'Datar',
    hsnCode: '3005',
    gstRate: 5,
    price: 24000,
    mrp: 28500,
    stockQty: 480,
    minOrderQty: 10, // sold by the carton
    images: [img('Gauze Swab')],
    description:
      '8-ply absorbent cotton gauze swab, 10cm × 10cm, folded with the cut edges tucked in so no loose threads reach the wound bed. Sterilised by ethylene oxide and individually pouched. Pack of 100 swabs.',
  },
  {
    sub: 'bandages',
    name: 'Elastic Crepe Bandage 10cm × 4m',
    slug: 'elastic-crepe-bandage-10cm-4m',
    brand: 'Nulife',
    hsnCode: '3005',
    gstRate: 5,
    price: 9500,
    mrp: 11000,
    stockQty: 620,
    minOrderQty: 25,
    images: [img('Crepe Bandage')],
    description:
      'Cotton-and-spandex crepe bandage with even lengthwise stretch, for sprains, post-operative compression and holding dressings in place. Washable and reusable. Supplied with two stainless clips.',
  },
  {
    sub: 'adhesive-dressings',
    name: 'Waterproof Adhesive Dressing 6cm × 7cm, Box of 50',
    slug: 'waterproof-adhesive-dressing-6x7-box-50',
    brand: '3M',
    hsnCode: '3005',
    gstRate: 5,
    price: 34500,
    mrp: 42000,
    stockQty: 130,
    images: [img('Dressing Front'), img('Dressing Pack'), img('Dressing Detail')], // three images: gallery
    description:
      'Transparent polyurethane film dressing with a low-adherent absorbent pad. Waterproof and breathable, so the patient can shower without changing the dressing. Sterile, individually wrapped, 50 per box.',
  },
  {
    sub: 'adhesive-dressings',
    name: 'Sterile Adhesive Wound Strips, Assorted, Box of 100',
    slug: 'sterile-adhesive-wound-strips-assorted-box-100',
    brand: 'Smith & Nephew',
    hsnCode: '3005',
    gstRate: 5,
    price: 12000,
    mrp: 14500,
    stockQty: 0, // deliberately out of stock
    images: [img('Wound Strips')],
    description:
      'Assorted-size fabric wound strips for minor cuts and abrasions — 40 standard, 30 large, 20 knuckle and 10 fingertip. Hypoallergenic acrylic adhesive. Sterile until the wrapper is opened.',
  },
  {
    sub: 'cotton-wool',
    name: 'Absorbent Cotton Wool IP 500g Roll',
    slug: 'absorbent-cotton-wool-ip-500g',
    brand: 'Datar',
    hsnCode: '5601', // wadding of textile materials, not a 3005 medicated dressing

    gstRate: 5,
    price: 42000,
    stockQty: 95,
    images: [img('Cotton Wool')],
    description: [
      'Absorbent cotton wool conforming to Indian Pharmacopoeia, supplied as a 500 gram continuous roll interleaved with blue tissue so a clean length can be torn off without touching the rest.',
      'The fibre is de-seeded, scoured and bleached, then combed into a uniform lap. It wets instantly and holds roughly twenty times its own weight, which is what separates pharmacopoeial cotton from the cosmetic grade sold in general stores. There is no residual oil or wax, so it will not repel water at the moment you need it to soak.',
      'Standard uses: skin preparation before injection, swabbing and cleaning wounds, padding under plaster casts and splints, and general dressing work where a shaped pad is more useful than a pre-cut swab.',
      'Store in the sealed polybag, away from damp and direct sunlight. Once opened, keep the roll in a covered dispenser — this product is clean but NOT sterile, and it is not intended for packing an open surgical wound.',
    ].join('\n\n'), // long, multi-paragraph — newlines are preserved
  },

  // --- Syringes & Needles ---
  {
    sub: 'disposable-syringes',
    name: 'Disposable Syringe 5ml with Needle, Box of 100',
    slug: 'disposable-syringe-5ml-with-needle-box-100',
    brand: 'Hindustan Syringes',
    hsnCode: '9018',
    gstRate: 5,
    price: 63000,
    mrp: 72000,
    stockQty: 210,
    images: [img('Syringe 5ml')],
    description:
        'Three-part disposable syringe, 5ml, with a latex-free rubber plunger tip for smooth travel and a clear barrel with bold graduations. Supplied with a 23G × 1" needle. Sterile, single use, 100 per box.',
  },
  {
    sub: 'hypodermic-needles',
    name: 'Hypodermic Needle 24G × 1 inch, Box of 100',
    slug: 'hypodermic-needle-24g-1inch-box-100',
    brand: 'Hindustan Syringes',
    hsnCode: '9018',
    gstRate: 5,
    price: 18000,
    stockQty: 940,
    minOrderQty: 50,
    images: [img('Needle 24G')],
    description:
      'Siliconised stainless steel hypodermic needle, 24 gauge × 1 inch, tri-bevel ground for low penetration force. Colour-coded luer hub. Sterile, single use, 100 per box.',
  },
  {
    sub: 'insulin-syringes',
    name: 'Insulin Syringe 1ml 31G, Pack of 100',
    slug: 'insulin-syringe-1ml-31g-pack-100',
    brand: 'Hindustan Syringes',
    hsnCode: '9018',
    gstRate: 5,
    price: 95000,
    mrp: 118000,
    stockQty: 78,
    images: [img('Insulin Syringe')],
    description:
      'U-100 insulin syringe with a permanently attached 31G × 6mm needle and a fixed-needle dead space of effectively zero. Half-unit graduations on a 1ml barrel. Sterile, single use, 100 per pack.',
  },
  {
    sub: 'scalp-vein-sets',
    name: 'Scalp Vein Set 23G Butterfly, Pack of 25',
    slug: 'scalp-vein-set-23g-butterfly-pack-25',
    brand: 'Romsons',
    hsnCode: '9018',
    gstRate: 5,
    price: 27500,
    mrp: 30000,
    stockQty: 145,
    images: [img('Scalp Vein Set')],
    description:
      'Winged infusion set with a 23G siliconised needle, flexible 30cm PVC tubing and a colour-coded luer lock. The soft wings sit flat for taping, which is what makes it usable on paediatric and geriatric veins. Sterile, 25 per pack.',
  },

  // --- Gloves & PPE ---
  {
    sub: 'examination-gloves',
    name: 'Latex Examination Gloves, Powder-Free, Medium, Box of 100',
    slug: 'latex-examination-gloves-powder-free-medium-box-100',
    brand: 'Medismart',
    hsnCode: '4015',
    gstRate: 5,
    price: 52000,
    mrp: 65000,
    stockQty: 320,
    images: [img('Exam Gloves')],
    description:
      'Ambidextrous powder-free latex examination gloves, medium, with a micro-textured fingertip finish for wet grip and a beaded cuff. Non-sterile, 100 gloves per box.',
  },
  {
    // The one 18% product in the catalogue, and genuinely 18%: vinyl gloves are PLASTIC
    // (Chapter 39), not rubber, so they fall outside the 4015 medical-glove entry that
    // makes the latex pair above 5%. Seeded so the checkout breakdown, which renders one
    // GST row per distinct rate, is exercised by real data rather than never running.
    // Whether a specific vinyl glove is 3926 or 4015 is a real classification question —
    // docs/GST-REFERENCE.md marks it UNVERIFIED. One for the accountant.
    sub: 'examination-gloves',
    name: 'Vinyl Examination Gloves, Powder-Free, Medium, Box of 100',
    slug: 'vinyl-examination-gloves-powder-free-medium-box-100',
    brand: 'Medismart',
    hsnCode: '3926',
    gstRate: 18,
    price: 38000,
    stockQty: 240,
    images: [img('Vinyl Gloves')],
    description:
      'Powder-free PVC vinyl examination gloves, medium, latex-free for staff and patients with a latex sensitivity. Smooth finish, beaded cuff, ambidextrous. Non-sterile, 100 gloves per box.',
  },
  {
    sub: 'surgical-gloves',
    name: 'Sterile Surgical Gloves Size 7.5, Pack of 50 Pairs',
    slug: 'sterile-surgical-gloves-7-5-pack-50-pairs',
    brand: 'Romsons',
    hsnCode: '4015',
    gstRate: 5,
    price: 145000,
    mrp: 175000,
    stockQty: 84,
    images: [img('Surgical Gloves')],
    description:
      'Anatomically shaped sterile surgical gloves, size 7.5, powder-free with a polymer inner coating for damp-hand donning. Each pair individually wrapped in a peel-open pouch. 50 pairs per pack.',
  },
  {
    sub: 'face-masks',
    name: '3-Ply Surgical Face Mask with Earloops, Box of 100',
    slug: '3-ply-surgical-face-mask-earloop-box-100',
    brand: 'Medismart',
    hsnCode: '6307',
    gstRate: 5,
    price: 15000,
    mrp: 19500,
    stockQty: 1250,
    images: [img('3 Ply Mask')],
    description:
      'Three-layer mask — spunbond outer, meltblown filter, soft inner facing — with an adjustable nose clip and soft round earloops. Bacterial filtration efficiency above 95%. 100 masks per box.',
  },
  {
    sub: 'face-masks',
    name: 'N95 Respirator FFP2, Cup Style, Pack of 20',
    slug: 'n95-respirator-ffp2-cup-pack-20',
    brand: '3M',
    hsnCode: '6307',
    gstRate: 5,
    price: 44000,
    mrp: 62000,
    stockQty: 0, // deliberately out of stock
    images: [img('N95 Respirator')],
    description:
      'Moulded cup-style N95 / FFP2 respirator with five layers, an aluminium nose bridge and a foam nose cushion. Head-harness straps rather than earloops, for a seal that survives a full shift. 20 per pack.',
  },
  {
    sub: 'gowns-caps',
    name: 'Disposable SMS Surgical Gown 35 GSM, Pack of 10',
    slug: 'disposable-sms-surgical-gown-35gsm-pack-10',
    brand: 'Nulife',
    hsnCode: '6210', // nonwoven garment; Ch. 62 or 63 carries the same rate and threshold
    gstRate: 5,
    price: 72000,
    stockQty: 115,
    images: [img('Surgical Gown')],
    description:
      'Full-sleeve SMS non-woven surgical gown, 35 GSM, with knitted cuffs, a tie-back neck and a waist belt. Fluid-resistant and breathable. Free size, sterile, 10 gowns per pack.',
  },

  // --- Surgical Instruments ---
  {
    sub: 'scissors-forceps',
    name: 'Mayo Dissecting Scissors 14cm, Straight',
    slug: 'mayo-dissecting-scissors-14cm-straight',
    brand: 'Datar',
    hsnCode: '9018',
    gstRate: 5,
    price: 68000,
    mrp: 79000,
    stockQty: 48,
    images: [img('Mayo Scissors')], // single image: no gallery
    description:
      'German-pattern Mayo dissecting scissors in AISI 420 stainless steel, 14cm, straight blades with a satin finish to cut reflected light. Autoclavable to 134°C.',
  },
  {
    sub: 'scalpels-blades',
    name: 'Surgical Scalpel Blades No. 22, Box of 100',
    slug: 'surgical-scalpel-blades-no-22-box-100',
    brand: 'Datar',
    hsnCode: '9018',
    gstRate: 5,
    price: 26000,
    stockQty: 265,
    images: [img('Scalpel Blades')],
    description:
      'Carbon steel No. 22 scalpel blades for a No. 4 handle, each in a foil wrapper with a rust inhibitor. Sterile, single use, 100 blades per box.',
  },
  {
    sub: 'sutures',
    name: 'Polyglycolic Acid Absorbable Suture 3-0, Box of 12',
    slug: 'polyglycolic-acid-suture-3-0-box-12',
    brand: 'Smith & Nephew',
    hsnCode: '3006',
    gstRate: 5,
    price: 168000,
    mrp: 195000,
    stockQty: 58,
    images: [img('PGA Suture')],
    description:
      'Braided coated polyglycolic acid absorbable suture, USP 3-0, 90cm, on a 26mm half-circle reverse cutting needle. Absorption is essentially complete by 60 to 90 days. Sterile, 12 foils per box.',
  },
  {
    sub: 'clamps',
    name: 'Backhaus Towel Clamp 13cm',
    slug: 'backhaus-towel-clamp-13cm',
    brand: 'Datar',
    hsnCode: '9018',
    gstRate: 5,
    price: 47000,
    mrp: 51500,
    stockQty: 7,
    images: [img('Towel Clamp')],
    description:
      'Backhaus towel clamp, 13cm, stainless steel with curved cross-over tips and a ratchet lock, for securing drapes to the field. Autoclavable.',
  },

  // --- Diagnostics ---
  {
    sub: 'bp-monitors',
    name: 'Aneroid BP Monitor with Stethoscope',
    slug: 'aneroid-bp-monitor-with-stethoscope',
    brand: 'Medismart',
    hsnCode: '9018',
    gstRate: 5,
    price: 185000,
    mrp: 240000,
    stockQty: 29,
    images: [img('BP Monitor'), img('BP Cuff'), img('BP Dial')], // three images: gallery
    description:
      'Aneroid sphygmomanometer with a 300 mmHg dial, latex bladder, nylon adult cuff with a D-ring, and a bundled dual-head stethoscope. Deflation valve is serviceable. Supplied in a zip carry case.',
  },
  {
    sub: 'thermometers',
    name: 'Digital Clinical Thermometer, Waterproof Tip',
    slug: 'digital-clinical-thermometer-waterproof',
    brand: 'Medismart',
    // 9025, not 9018 — and 5% only because it is FOR medical usage. The same heading
    // is 18% for a thermometer that is not. The HSN code alone does not fix the rate.
    hsnCode: '9025',
    gstRate: 5,
    price: 12500,
    mrp: 16500,
    stockQty: 350,
    images: [img('Thermometer')],
    description:
      'Digital clinical thermometer reading to 0.1°C in about ten seconds, with a flexible waterproof tip, fever beep and last-reading memory. Oral, axillary or rectal use. Battery included.',
  },
  {
    sub: 'pulse-oximeters',
    name: 'Fingertip Pulse Oximeter with OLED Display',
    slug: 'fingertip-pulse-oximeter-oled',
    brand: 'Medismart',
    hsnCode: '9018',
    gstRate: 5,
    price: 138000,
    mrp: 189000,
    stockQty: 66,
    images: [img('Pulse Oximeter')],
    description:
      'Fingertip pulse oximeter showing SpO2, pulse rate, perfusion index and a plethysmograph on a four-way rotating OLED display. Auto power-off, low-battery warning, lanyard included. Adult and paediatric fingers.',
  },
  {
    sub: 'stethoscopes',
    name: 'Dual-Head Cardiology Stethoscope, Stainless Steel',
    slug: 'dual-head-cardiology-stethoscope',
    brand: 'Romsons',
    hsnCode: '9018',
    gstRate: 5,
    price: 450000,
    stockQty: 3,
    images: [img('Stethoscope')],
    description:
      'Cardiology-grade dual-head stethoscope with a hand-polished stainless chestpiece, tunable diaphragm and a thick-walled single-lumen tube that keeps out room noise. Includes spare eartips and a diaphragm.',
  },

  // --- IV & Infusion ---
  {
    sub: 'iv-sets',
    name: 'IV Infusion Set with Air Vent, 20 drops/ml, Pack of 25',
    slug: 'iv-infusion-set-air-vent-20-drops-pack-25',
    brand: 'Nulife',
    hsnCode: '9018',
    gstRate: 5,
    price: 58000,
    mrp: 66000,
    stockQty: 185,
    images: [img('IV Set')],
    description:
      'Gravity IV infusion set delivering 20 drops per ml, with a vented spike, transparent drip chamber, 150cm kink-resistant tube, roller clamp and a latex Y-injection site. Sterile, single use, 25 per pack.',
  },
  {
    sub: 'iv-cannulas',
    name: 'IV Cannula 20G with Injection Port, Box of 50',
    slug: 'iv-cannula-20g-injection-port-box-50',
    brand: 'Romsons',
    hsnCode: '9018',
    gstRate: 5,
    price: 96000,
    stockQty: 98,
    images: [img('IV Cannula')],
    description:
      'Radio-opaque FEP IV cannula, 20G pink, with a back-cut siliconised needle, flashback chamber, injection port and wings. Sterile, single use, 50 per box.',
  },
  {
    sub: 'extension-lines',
    name: 'IV Extension Line 100cm, Pack of 25',
    slug: 'iv-extension-line-100cm-pack-25',
    brand: 'Nulife',
    hsnCode: '9018',
    gstRate: 5,
    price: 39000,
    stockQty: 135,
    images: [img('Extension Line')],
    description:
      'Low-volume IV extension line, 100cm, with male and female luer locks and a slide clamp. Keeps the infusion set away from the cannula site so dressings stay undisturbed. Sterile, 25 per pack.',
  },
  {
    sub: 'three-way-stopcocks',
    name: 'Three-Way Stopcock with 10cm Extension',
    slug: 'three-way-stopcock-10cm-extension',
    brand: 'Romsons',
    hsnCode: '9018',
    gstRate: 5,
    price: 4000,
    mrp: 4400,
    stockQty: 430,
    images: [img('Three Way Stopcock')],
    description:
      'Three-way stopcock with a colour-coded rotating handle, luer lock ports and a 10cm extension tube. Handle position shows flow direction at a glance. Sterile, single use.',
  },
]

const USER = {
  name: 'Ramesh Kumar',
  phone: '9876543210',
  password: 'demo1234', // plain text, per SPEC's known holes
  addresses: [
    {
      label: 'Clinic',
      line1: 'Kumar Polyclinic, 2nd Floor, 14 Sarojini Devi Road',
      line2: 'Near Clock Tower',
      city: 'Secunderabad',
      state: 'Telangana',
      pincode: '500003',
      phone: '9876543210',
    },
    {
      label: 'Home',
      line1: 'Flat 302, Sai Residency, Road No. 7',
      line2: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      phone: '9876543211',
    },
  ],
}

// [product slug, rating, status, text]
const REVIEWS = [
  ['sterile-gauze-swab-10x10-pack-100', 5, 'approved', 'Edges are properly tucked, no loose threads. We go through a carton a week at the clinic and the quality has been consistent.'],
  ['digital-clinical-thermometer-waterproof', 4, 'approved', 'Reads in about ten seconds and the tip actually survives being wiped down. Beep is quieter than I expected, which is fine.'],
  ['latex-examination-gloves-powder-free-medium-box-100', 5, 'approved', 'Good wet grip and the cuff does not roll down. Medium fits our whole front desk team.'],
  ['fingertip-pulse-oximeter-oled', 4, 'approved', 'Display rotates properly and the reading settles fast. Perfusion index is a nice extra at this price.'],
  ['elastic-crepe-bandage-10cm-4m', 3, 'pending', 'Stretch is even but the clips bend easily. Still usable — I just tape the end instead.'],
]

// [status, days ago, [[product slug, qty], ...]]
const ORDERS = [
  ['delivered', 21, [['elastic-crepe-bandage-10cm-4m', 25], ['three-way-stopcock-10cm-extension', 50]]],
  ['shipped', 9, [['dual-head-cardiology-stethoscope', 1], ['fingertip-pulse-oximeter-oled', 2]]],
  // mixed-rate order (5% + 18%), so the admin order view shows two GST rows out of the box
  ['placed', 4, [['insulin-syringe-1ml-31g-pack-100', 1], ['latex-examination-gloves-powder-free-medium-box-100', 3], ['vinyl-examination-gloves-powder-free-medium-box-100', 2]]],
  ['paymentPending', 0, [['sterile-gauze-swab-10x10-pack-100', 10], ['3-ply-surgical-face-mask-earloop-box-100', 2]]],
]

const DELIVERY_FEE = DEFAULT_DELIVERY_FEE // ₹40, same constant the API falls back to
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

async function seed() {
  // Idempotent by demolition: wipe the six collections, then insert.
  for (const store of [Categories, Products, Reviews, Orders, Users, SettingsStore]) await store.deleteMany()

  const categories = await Categories.insertMany(CATEGORIES)
  const subBySlug = new Map(
    categories.flatMap((c) => c.subcategories.map((s) => [s.slug, { categoryId: c._id, subcategoryId: s._id }])),
  )

  // Staggered createdAt so "New arrivals" and the newest-first sort have real ordering.
  const products = await Products.insertMany(
    PRODUCTS.map(({ sub, ...p }, i) => ({ ...p, ...subBySlug.get(sub), createdAt: daysAgo(PRODUCTS.length - i) })),
  )
  const bySlug = new Map(products.map((p) => [p.slug, p]))

  const user = await Users.insert(USER)
  await SettingsStore.insert({ _id: 'settings', deliveryFee: DELIVERY_FEE })

  await Reviews.insertMany(
    REVIEWS.map(([slug, rating, status, text], i) => ({
      productId: bySlug.get(slug)._id,
      userId: user._id,
      userName: user.name,
      rating,
      text,
      status,
      createdAt: daysAgo(30 - i * 4),
    })),
  )
  // Same code path the admin panel uses on approve, so ratingAvg/ratingCount match.
  await Promise.all(REVIEWS.map(([slug]) => recomputeProductRating(bySlug.get(slug)._id)))

  // One order in each status, priced through the one pricing function.
  // ponytail: seeded orders do not decrement stockQty — the stock numbers above are
  // already the intended opening balance. Real orders decrement in POST /api/orders.
  await Orders.insertMany(
    ORDERS.map(([status, ago, lines]) => {
      const address = user.addresses[status === 'delivered' ? 1 : 0]
      const totals = computeOrderTotals(
        lines.map(([slug, qty]) => {
          const p = bySlug.get(slug)
          return {
            productId: p._id,
            name: p.name,
            image: p.images[0],
            unitPrice: p.price,
            qty,
            gstRate: p.gstRate,
            hsnCode: p.hsnCode,
          }
        }),
        DELIVERY_FEE,
      )
      return {
        userId: user._id,
        userName: user.name,
        userPhone: user.phone,
        address: {
          label: address.label,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          phone: address.phone,
        },
        ...totals,
        status,
        createdAt: daysAgo(ago),
      }
    }),
  )

  console.log(
    [
      `categories ${categories.length}`,
      `products   ${products.length} (${PRODUCTS.filter((p) => p.stockQty === 0).length} out of stock, ${
        PRODUCTS.filter((p) => p.stockQty > 0 && p.stockQty <= 10).length
      } low stock, ${PRODUCTS.filter((p) => p.mrp).length} with an MRP)`,
      `user       ${user.phone} / ${USER.password} — ${user.addresses.length} addresses`,
      `reviews    ${REVIEWS.length} (${REVIEWS.filter((r) => r[2] === 'pending').length} pending moderation)`,
      `orders     ${ORDERS.length} (${ORDERS.map((o) => o[0]).join(', ')})`,
      `settings   deliveryFee ${DELIVERY_FEE} paise`,
    ].join('\n'),
  )
}

await seed()
