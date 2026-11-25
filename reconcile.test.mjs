import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcile } from './reconcile.mjs';

test('classifies differences and sorts by SKU', () => {
  const expected = [{ sku: 'D', quantity: 5 }, { sku: 'C', quantity: 2 },
    { sku: 'B', quantity: 4 }, { sku: 'E', quantity: 0 }];
  const counted = [{ sku: 'D', quantity: 5 }, { sku: 'A', quantity: 1 },
    { sku: 'C', quantity: 3 }, { sku: 'B', quantity: 1 }];
  const report = reconcile(expected, counted);
  assert.equal(report.checked, 5);
  assert.equal(report.matched, 1);
  assert.deepEqual(report.discrepancies.map(({ sku, status, difference }) => [sku, status, difference]),
    [['A', 'unexpected', 1], ['B', 'shortage', -3], ['C', 'surplus', 1], ['E', 'missing', 0]]);
});

test('rejects ambiguous and invalid inventory data', () => {
  const row = { sku: 'A', quantity: 1 };
  assert.throws(() => reconcile([row, { ...row, sku: ' A ' }], []), /duplicate SKU/);
  assert.throws(() => reconcile([], [{ ...row, quantity: -1 }]), /invalid SKU or quantity/);
  assert.throws(() => reconcile({}, []), /must be a JSON array/);
});

test('reports a clean count', () => {
  const rows = [{ sku: 'A', quantity: 0 }];
  assert.deepEqual(reconcile(rows, rows), { checked: 1, matched: 1, discrepancies: [] });
});
