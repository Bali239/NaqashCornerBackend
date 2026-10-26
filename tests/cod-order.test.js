import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePhoneNumber,
  validateOrderInputs,
  calculateOrderTotals,
} from '../src/services/OrderService.js';
import { orderCreateSchema } from '../src/schemas/order.schema.js';

test('normalizePhoneNumber accepts only the masked Pakistani mobile format', () => {
  assert.equal(normalizePhoneNumber('0333-0562174'), '+923330562174');
  assert.equal(normalizePhoneNumber('0333-056217'), '');
  assert.equal(normalizePhoneNumber('03330562174'), '');
  assert.equal(normalizePhoneNumber('0333-05621744'), '');
});

test('validateOrderInputs rejects invalid address and phone input', () => {
  assert.throws(() => validateOrderInputs({
    recipientName: 'A',
    phoneNumber: '123',
    province: 'Punjab',
    district: '',
    city: '',
    address: '',
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  }), /Recipient name is required|valid Pakistani mobile/i);
});

test('validateOrderInputs accepts a valid masked number and address-only payload', () => {
  const payload = {
    recipientName: 'Ali Khan',
    phoneNumber: '0333-0562174',
    address: 'House 31, Gulberg III, Lahore',
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  };

  const parsed = validateOrderInputs(payload);
  assert.equal(parsed.phoneNumber, '+923330562174');
  assert.equal(parsed.address, payload.address);
  assert.equal('province' in parsed, false);
  assert.equal('postalCode' in parsed, false);
});

test('order request schema enforces masked phone format and one delivery address', () => {
  const payload = {
    recipientName: 'Ali Khan',
    phoneNumber: '0333-0562174',
    address: 'House 31, Gulberg III, Lahore',
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  };

  assert.equal(orderCreateSchema.safeParse(payload).success, true);
  assert.equal(orderCreateSchema.safeParse({ ...payload, phoneNumber: '03330562174' }).success, false);
  assert.equal(orderCreateSchema.safeParse({ ...payload, phoneNumber: '0333-05621744' }).success, false);
});

test('checkout accepts a short usable address but rejects an incomplete one', () => {
  const payload = {
    recipientName: 'Ali Khan',
    phoneNumber: '0333-0562174',
    address: 'Flat 4',
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  };

  assert.equal(orderCreateSchema.safeParse(payload).success, true);
  assert.equal(validateOrderInputs(payload).address, 'Flat 4');
  assert.equal(orderCreateSchema.safeParse({ ...payload, address: 'A' }).success, false);
  assert.throws(() => validateOrderInputs({ ...payload, address: 'A' }), /complete delivery address/i);
});

test('checkout accepts the reported village, city, and district address', () => {
  const address = 'village Ratial, City Dina, District Jhelum';
  const payload = {
    recipientName: 'Ali Khan',
    phoneNumber: '0333-0562174',
    address,
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  };

  assert.equal(orderCreateSchema.safeParse(payload).success, true);
  assert.equal(validateOrderInputs(payload).address, address);
});

test('calculateOrderTotals keeps pricing in minor units and respects configured shipping fee', () => {
  const totals = calculateOrderTotals({
    items: [
      { unitPriceMinor: 20000, quantity: 2, discountPercent: 10 },
      { unitPriceMinor: 5000, quantity: 1, discountPercent: 0 },
    ],
    shippingFeeMinor: 300,
    taxRatePercent: 0,
  });

  assert.equal(totals.subtotalMinor, 45000);
  assert.equal(totals.discountAmountMinor, 4000);
  assert.equal(totals.shippingFeeMinor, 300);
  assert.equal(totals.taxMinor, 0);
  assert.equal(totals.totalMinor, 41300);
});
