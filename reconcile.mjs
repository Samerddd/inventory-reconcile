import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function indexInventory(rows, label) {
  if (!Array.isArray(rows)) throw new Error(label + ' must be a JSON array');
  const quantities = new Map();
  for (const [index, row] of rows.entries()) {
    const sku = typeof row?.sku === 'string' ? row.sku.trim() : '';
    if (!sku || !Number.isSafeInteger(row.quantity) || row.quantity < 0) {
      throw new Error(label + ': invalid SKU or quantity at row ' + (index + 1));
    }
    if (quantities.has(sku)) throw new Error(label + ': duplicate SKU ' + sku);
    quantities.set(sku, row.quantity);
  }
  return quantities;
}

export function reconcile(expectedRows, countedRows) {
  const expected = indexInventory(expectedRows, 'Expected inventory');
  const counted = indexInventory(countedRows, 'Counted inventory');
  const skus = [...new Set([...expected.keys(), ...counted.keys()])].sort();
  const discrepancies = [];
  for (const sku of skus) {
    const expectedQuantity = expected.get(sku) ?? 0;
    const countedQuantity = counted.get(sku) ?? 0;
    const difference = countedQuantity - expectedQuantity;
    const status = !expected.has(sku) ? 'unexpected'
      : !counted.has(sku) ? 'missing'
      : difference < 0 ? 'shortage'
      : difference > 0 ? 'surplus' : 'matched';
    if (status !== 'matched') {
      discrepancies.push({ sku, expected: expectedQuantity, counted: countedQuantity, difference, status });
    }
  }
  return { checked: skus.length, matched: skus.length - discrepancies.length, discrepancies };
}

async function main(args) {
  if (args.length !== 2) throw new Error('Usage: node reconcile.mjs <expected.json> <counted.json>');
  const rows = await Promise.all(args.map(async (path) => {
    try {
      return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      throw new Error(path + ': ' + error.message);
    }
  }));
  const report = reconcile(...rows);
  console.log(JSON.stringify(report, null, 2));
  return report.discrepancies.length ? 2 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
