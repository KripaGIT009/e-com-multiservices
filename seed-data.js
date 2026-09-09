#!/usr/bin/env node
/**
 * Seeds the stack with realistic data for local testing.
 *
 * Goes through the BFF and the service APIs rather than writing SQL, so everything
 * created here passes the same validation a real user would hit — if the seed works,
 * the API works. Idempotent: re-running skips anything already present.
 *
 * Usage:  node seed-data.js
 *         BASE_URL=http://localhost:4200 node seed-data.js
 */

const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:4200';
const ITEM_SERVICE = process.env.ITEM_SERVICE_URL || 'http://localhost:8005';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8003';
const SELLER_SERVICE = process.env.SELLER_SERVICE_URL || 'http://localhost:8021';

const DEFAULT_PASSWORD = 'Passw0rd@123';

// ── Sellers ──────────────────────────────────────────────────────────────────
// GSTINs follow the real 15-character format (2 state + 10 PAN + entity + Z + check)
// so they pass validation. They are not registered numbers.
const SELLERS = [
  {
    businessName: 'Varanasi Silk House', contactName: 'Anita Deshpande',
    email: 'seller.varanasi@example.com', password: DEFAULT_PASSWORD, phone: '9876500101',
    gstin: '09ABCDE1234F1Z5', pickupAddress: '12 Godowlia Road', pickupCity: 'Varanasi',
    pickupPostalCode: '221001', approve: true,
  },
  {
    businessName: 'Malabar Spice Traders', contactName: 'Rajesh Nair',
    email: 'seller.malabar@example.com', password: DEFAULT_PASSWORD, phone: '9876500102',
    gstin: '32FGHIJ5678K1Z2', pickupAddress: '45 Broadway', pickupCity: 'Kochi',
    pickupPostalCode: '682031', approve: true,
  },
  {
    businessName: 'Jaipur Craft Bazaar', contactName: 'Meera Sharma',
    email: 'seller.jaipur@example.com', password: DEFAULT_PASSWORD, phone: '9876500103',
    gstin: '08KLMNO9012P1Z8', pickupAddress: '7 Johari Bazaar', pickupCity: 'Jaipur',
    pickupPostalCode: '302003', approve: true,
  },
  {
    // Left unapproved on purpose, so the admin approval queue has something in it.
    businessName: 'Nashik Organics', contactName: 'Sunil Patil',
    email: 'seller.nashik@example.com', password: DEFAULT_PASSWORD, phone: '9876500104',
    gstin: '27PQRST3456U1Z1', pickupAddress: '22 College Road', pickupCity: 'Nashik',
    pickupPostalCode: '422005', approve: false,
  },
];

// ── Catalogue ────────────────────────────────────────────────────────────────
// Real product categories and plausible Indian retail prices, in rupees.
const CATALOGUE = [
  // Varanasi Silk House — apparel
  ['VSH-SAREE-001', 'Banarasi Katan Silk Saree — Gold Zari', 'Handwoven pure Katan silk with traditional gold zari brocade and unstitched blouse piece.', 8750, 24, 'CLOTHING', 0],
  ['VSH-SAREE-002', 'Banarasi Georgette Saree — Indigo', 'Lightweight georgette with silver zari border, suited to everyday wear.', 4250, 40, 'CLOTHING', 0],
  ['VSH-KURTA-003', "Men's Chikankari Kurta — Ivory", 'Hand-embroidered Lucknowi chikankari on cotton mulmul.', 1899, 60, 'CLOTHING', 0],
  ['VSH-DUPT-004', 'Banarasi Silk Dupatta — Rani Pink', 'Pure silk dupatta with all-over buti work.', 1450, 75, 'CLOTHING', 0],
  ['VSH-LEHN-005', 'Bridal Lehenga — Deep Maroon', 'Raw silk lehenga with zardozi work, includes choli and dupatta.', 24500, 6, 'CLOTHING', 0],

  // Malabar Spice Traders — grocery
  ['MST-SPICE-001', 'Malabar Black Pepper Whole — 500g', 'Single-estate Tellicherry peppercorns, sun-dried and hand-sorted.', 649, 200, 'GROCERY', 1],
  ['MST-SPICE-002', 'Cardamom Green Pods — 250g', 'Grade AGEB Idukki cardamom, 8mm bold pods.', 899, 150, 'GROCERY', 1],
  ['MST-SPICE-003', 'Lakadong Turmeric Powder — 500g', 'Meghalaya Lakadong turmeric, naturally high curcumin.', 449, 180, 'GROCERY', 1],
  ['MST-SPICE-004', 'Garam Masala Blend — 200g', 'Stone-ground blend of twelve whole spices, roasted in small batches.', 249, 240, 'GROCERY', 1],
  ['MST-OIL-005', 'Cold Pressed Coconut Oil — 1L', 'Wood-pressed from sun-dried Kerala copra, unrefined.', 549, 120, 'GROCERY', 1],
  ['MST-TEA-006', 'Nilgiri Orthodox Tea — 500g', 'High-grown loose leaf from a single Nilgiri estate.', 675, 90, 'GROCERY', 1],

  // Jaipur Craft Bazaar — home and decor
  ['JCB-DECOR-001', 'Blue Pottery Serving Bowl Set of 4', 'Hand-painted Jaipur blue pottery, quartz-based and lead-free.', 2450, 30, 'HOME_DECOR', 2],
  ['JCB-DECOR-002', 'Brass Diya Set of 6 — Hand Etched', 'Solid brass oil lamps with traditional etched detailing.', 1250, 85, 'HOME_DECOR', 2],
  ['JCB-DECOR-003', 'Block Print Cotton Bedsheet — Queen', 'Hand block printed with natural dyes, includes two pillow covers.', 2199, 45, 'HOME_DECOR', 2],
  ['JCB-DECOR-004', 'Marble Inlay Coaster Set', 'Makrana marble with semi-precious stone inlay, set of six.', 1650, 40, 'HOME_DECOR', 2],
  ['JCB-JEWEL-005', 'Kundan Choker Necklace Set', 'Gold-plated kundan with pearl drops, includes matching earrings.', 4850, 18, 'JEWELLERY', 2],
  ['JCB-JEWEL-006', 'Oxidised Silver Jhumka Earrings', 'Tribal-style oxidised jhumkas in 92.5 sterling silver.', 1350, 55, 'JEWELLERY', 2],

  // First-party stock — sellerIndex null means sold by MyIndianStore itself
  ['MIS-ELEC-001', 'Wireless Earbuds — Active Noise Cancelling', '40dB hybrid ANC, 36-hour total battery, IPX5 water resistance.', 3499, 100, 'ELECTRONICS', null],
  ['MIS-ELEC-002', 'Smart Fitness Band — AMOLED', '1.47" AMOLED, SpO2 and heart-rate tracking, 14-day battery.', 2299, 120, 'ELECTRONICS', null],
  ['MIS-ELEC-003', 'Power Bank 20000mAh — 22.5W', 'Fast charge with USB-C PD, triple output, airline safe.', 1899, 140, 'ELECTRONICS', null],
  ['MIS-BOOK-004', 'The Discovery of India — Jawaharlal Nehru', 'Paperback, 656 pages. Penguin Modern Classics edition.', 499, 70, 'BOOKS', null],
  ['MIS-BOOK-005', 'Midnights Children — Salman Rushdie', 'Booker Prize winner. Paperback, 672 pages.', 425, 65, 'BOOKS', null],
  ['MIS-SPORT-006', 'Cricket Bat — Grade 2 English Willow', 'Short handle, 1180g, knocked in and ready to play.', 6499, 25, 'SPORTS', null],
  ['MIS-SPORT-007', 'Yoga Mat — 6mm TPE Non-Slip', 'Closed-cell TPE, 183 x 61cm, carry strap included.', 1299, 80, 'SPORTS', null],
  ['MIS-BEAUTY-008', 'Ayurvedic Hair Oil — 200ml', 'Cold-infused bhringraj, amla and coconut. No mineral oil.', 649, 160, 'BEAUTY', null],
];

// ── Customers ────────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '9876500201', gender: 'FEMALE',
    address: { addressLine1: '14 Residency Road', addressLine2: 'Shanthala Nagar', city: 'Bengaluru', state: 'Karnataka', postalCode: '560025' } },
  { name: 'Vikram Chauhan', email: 'vikram.chauhan@example.com', phone: '9876500202', gender: 'MALE',
    address: { addressLine1: '221 Linking Road', addressLine2: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050' } },
  { name: 'Fatima Sheikh', email: 'fatima.sheikh@example.com', phone: '9876500203', gender: 'FEMALE',
    address: { addressLine1: '9 Park Street', addressLine2: '', city: 'Kolkata', state: 'West Bengal', postalCode: '700016' } },
];

const log = (...a) => console.log(...a);
const ok = (m) => log('  ✓ ' + m);
const skip = (m) => log('  · ' + m + ' (already present)');
const fail = (m, e) => log('  ✗ ' + m + ' — ' + (e.response?.data?.error || e.response?.data?.message || e.message));

async function seedSellers() {
  log('\nSellers');
  const created = [];
  for (const s of SELLERS) {
    try {
      const { data } = await axios.post(`${SELLER_SERVICE}/api/sellers/register`, s);
      created.push(data);
      ok(`${s.businessName} (${data.status})`);
    } catch (e) {
      if (e.response?.status === 409) {
        const all = (await axios.get(`${SELLER_SERVICE}/api/sellers`)).data;
        const found = all.find((x) => x.email === s.email.toLowerCase());
        if (found) { created.push(found); skip(s.businessName); continue; }
      }
      fail(s.businessName, e);
      created.push(null);
    }
  }

  // Approve the ones meant to be trading.
  for (let i = 0; i < SELLERS.length; i++) {
    const seller = created[i];
    if (!seller || !SELLERS[i].approve || seller.status === 'APPROVED') continue;
    try {
      await axios.put(`${SELLER_SERVICE}/api/sellers/${seller.id}/status`, { status: 'APPROVED' });
      created[i] = { ...seller, status: 'APPROVED' };
      ok(`approved ${seller.businessName}`);
    } catch (e) { fail(`approve ${seller.businessName}`, e); }
  }
  return created;
}

async function seedCatalogue(sellers) {
  log('\nCatalogue');
  const existing = (await axios.get(`${ITEM_SERVICE}/items`)).data || [];
  const bySku = new Set(existing.map((i) => i.sku));
  let added = 0;

  for (const [sku, name, description, price, quantity, itemType, sellerIndex] of CATALOGUE) {
    if (bySku.has(sku)) { skip(sku); continue; }
    const seller = sellerIndex === null ? null : sellers[sellerIndex];
    try {
      await axios.post(`${ITEM_SERVICE}/items`, {
        sku, name, description, price, quantity, itemType,
        sellerId: seller ? seller.id : null,
        sellerName: seller ? seller.businessName : null,
      });
      ok(`${sku}  ${name.slice(0, 46)}${seller ? '  [' + seller.businessName + ']' : '  [MyIndianStore]'}`);
      added++;
    } catch (e) { fail(sku, e); }
  }
  log(`  ${added} added, ${CATALOGUE.length - added} already present`);
}

async function seedInventory() {
  log('\nInventory');
  const items = (await axios.get(`${ITEM_SERVICE}/items`)).data || [];
  let added = 0;
  for (const item of items) {
    try {
      await axios.post(`${INVENTORY_SERVICE}/inventory`, {
        sku: item.sku, quantity: item.quantity, reservedQuantity: 0,
      });
      added++;
    } catch (e) { /* already stocked, or the service models it differently */ }
  }
  log(`  ${added} of ${items.length} inventory records written`);
}

async function seedCustomers() {
  log('\nCustomers');
  const created = [];
  for (const c of CUSTOMERS) {
    try {
      const { data } = await axios.post(`${BASE}/api/auth/register`, {
        name: c.name, email: c.email, password: DEFAULT_PASSWORD,
        phone: c.phone, gender: c.gender,
      });
      created.push({ ...c, token: data.token, id: data.user.id });
      ok(`${c.name} <${c.email}>`);
    } catch (e) {
      if (e.response?.status === 409) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/login`, {
            email: c.email, password: DEFAULT_PASSWORD,
          });
          created.push({ ...c, token: data.token, id: data.user.id });
          skip(c.name);
          continue;
        } catch (_) { /* fall through */ }
      }
      fail(c.name, e);
    }
  }
  return created;
}

async function seedOrders(customers) {
  log('\nOrders');
  const items = (await axios.get(`${BASE}/api/items`)).data || [];
  if (!items.length) { log('  no catalogue to order from'); return; }

  for (const c of customers) {
    if (!c.token) continue;
    const auth = { headers: { Authorization: `Bearer ${c.token}` } };
    try {
      const existing = (await axios.get(`${BASE}/api/orders`, auth)).data || [];
      if (existing.length) { skip(`orders for ${c.name}`); continue; }

      const picks = items.slice(0, 2);
      const { data } = await axios.post(`${BASE}/api/orders`, {
        items: picks.map((i) => ({ itemId: i.id, name: i.name, quantity: 1, price: i.price, sku: i.sku })),
        shippingAddress: { fullName: c.name, ...c.address, phone: c.phone, country: 'India' },
      }, auth);
      ok(`${data.orderNumber} for ${c.name} — ₹${data.totalAmount}`);
    } catch (e) { fail(`order for ${c.name}`, e); }
  }
}

(async () => {
  log('Seeding MyIndianStore with test data');
  log(`  BFF: ${BASE}`);
  try {
    await axios.get(`${BASE}/health`);
  } catch (e) {
    log('\nThe BFF is not reachable. Start the stack first: docker compose up -d');
    process.exit(1);
  }

  const sellers = await seedSellers();
  await seedCatalogue(sellers);
  await seedInventory();
  const customers = await seedCustomers();
  await seedOrders(customers);

  log('\nDone.\n');
  log('Sign in with:');
  log(`  Customer  ananya.iyer@example.com        / ${DEFAULT_PASSWORD}`);
  log(`  Seller    seller.varanasi@example.com    / ${DEFAULT_PASSWORD}   (approved)`);
  log(`  Seller    seller.nashik@example.com      / ${DEFAULT_PASSWORD}   (awaiting approval)`);
  log('  Admin     admin@example.com              / password123');
  log('');
})();
