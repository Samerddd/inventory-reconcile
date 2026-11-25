# Inventory Reconcile

A dependency-free Node.js command-line tool that compares an expected inventory snapshot against a physical count. It reports shortages, surpluses, missing SKUs, and unexpected SKUs in a deterministic JSON report.

## Quick start

Requires Node.js 24 or newer.

~~~sh
node --test
node reconcile.mjs expected.example.json counted.example.json
~~~

Each input is a JSON array containing objects such as {"sku":"BALL-01","quantity":12}. Quantities must be nonnegative safe integers. SKU values are case-sensitive and trimmed. Duplicate SKUs produce an input error.

The example checks three SKUs and finds a shortage of two units for BALL-01 and two unexpected units for PUMP-03. Missing and unexpected SKUs are reportable even when their quantity is zero.

| Exit code | Meaning |
| --- | --- |
| 0 | Counts match |
| 1 | Invalid input or unreadable file |
| 2 | Report generated with discrepancies |

The report is written to standard output, so it can be redirected into a file. Input errors go to standard error.
