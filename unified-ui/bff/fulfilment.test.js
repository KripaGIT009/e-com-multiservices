// Run with: node --test bff/
const test = require('node:test');
const assert = require('node:assert/strict');
const f = require('./fulfilment');

const mixedOrder = {
  status: 'PAYMENT_COMPLETED',
  items: [
    { productId: '9', sellerId: 3, sellerName: 'Varanasi Silk House', fulfilmentModel: 'SELLER', quantity: 1, unitPrice: 2499 },
    { productId: '1', sellerId: null, fulfilmentModel: 'FIRST_PARTY', quantity: 2, unitPrice: 199 },
    { productId: '40', sellerId: null, fulfilmentModel: 'DROPSHIP', fulfilmentPartnerCode: 'qikink', quantity: 1, unitPrice: 599 },
    { productId: '12', sellerId: 5, sellerName: 'Malabar Spice Traders', fulfilmentModel: 'SELLER', quantity: 3, unitPrice: 349 },
    { productId: '2', sellerId: null, fulfilmentModel: 'FIRST_PARTY', quantity: 1, unitPrice: 99 },
  ],
};

test('legacy lines without a model resolve from sellerId', () => {
  assert.equal(f.lineModel({ sellerId: 4 }), 'SELLER');
  assert.equal(f.lineModel({ sellerId: null }), 'FIRST_PARTY');
  assert.equal(f.lineModel({}), 'FIRST_PARTY');
});

test('groups a mixed basket by who ships it, own stock first', () => {
  const groups = f.groupLines(mixedOrder);
  assert.deepEqual(groups.map((g) => g.fulfilmentKey),
    ['FIRST_PARTY', 'SELLER:3', 'SELLER:5', 'DROPSHIP:QIKINK']);
  assert.equal(groups[0].lines.length, 2);
  assert.equal(f.primaryGroup(groups).fulfilmentKey, 'FIRST_PARTY');
});

test('the dropship partner is never named in the customer label', () => {
  const dropship = f.groupLines(mixedOrder).find((g) => g.model === 'DROPSHIP');
  assert.ok(!/qikink/i.test(dropship.label));
});

test('primary group falls back to the first seller when there is no own stock', () => {
  const groups = f.groupLines({ items: [mixedOrder.items[2], mixedOrder.items[3]] });
  assert.equal(f.primaryGroup(groups).fulfilmentKey, 'SELLER:5');
  assert.equal(f.primaryGroup(f.groupLines({ items: [mixedOrder.items[2]] })), null);
});

test('an order is shipped only when every group is', () => {
  const groups = f.groupLines(mixedOrder);
  const partial = f.attachProgress(groups,
    [{ fulfilmentKey: 'FIRST_PARTY' }, { fulfilmentKey: 'SELLER:3' }],
    [{ partnerCode: 'QIKINK', status: 'SHIPPED' }]);
  assert.equal(f.allShipped(partial), false);
  assert.equal(partial.find((g) => g.fulfilmentKey === 'SELLER:5').shipped, false);

  const complete = f.attachProgress(groups,
    [{ fulfilmentKey: 'FIRST_PARTY' }, { fulfilmentKey: 'SELLER:3' }, { fulfilmentKey: 'SELLER:5' }],
    [{ partnerCode: 'QIKINK', status: 'DELIVERED' }]);
  assert.equal(f.allShipped(complete), true);
});

test('a supplier order that is only placed does not count as shipped', () => {
  const groups = f.groupLines({ items: [mixedOrder.items[2]] });
  const progress = f.attachProgress(groups, [], [{ partnerCode: 'QIKINK', status: 'AWAITING_MANUAL_PLACEMENT' }]);
  assert.equal(progress[0].shipped, false);
});

test('a shipment from before fulfilment keys covers the courier-shipped groups', () => {
  const groups = f.groupLines(mixedOrder);
  const progress = f.attachProgress(groups, [{ fulfilmentKey: null, trackingNumber: 'DEL1' }], []);
  assert.equal(progress.filter((g) => g.model !== 'DROPSHIP').every((g) => g.shipped), true);
  assert.equal(progress.find((g) => g.model === 'DROPSHIP').shipped, false);
});

test('paid statuses', () => {
  assert.equal(f.isPaid({ status: 'PENDING' }), false);
  assert.equal(f.isPaid({ status: 'PAYMENT_COMPLETED' }), true);
  assert.equal(f.isPaid({ status: 'CANCELLED' }), false);
});
