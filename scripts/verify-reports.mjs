import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync('lib/reporting.ts', 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const exports = {}
vm.runInNewContext(
  js,
  {
    exports,
    require: (name) => {
      if (name !== './fixtures') throw new Error(`Unexpected module: ${name}`)
      return {
        orderTotal: (order) =>
          order.items.reduce((sum, i) => sum + i.qty * i.price, 0),
      }
    },
  },
  { filename: 'lib/reporting.ts (transpiled)' },
)
const { reportRangeError, reportRange, buildReports, reportCsv } = exports
const products = [
  {
    id: 'p1',
    name: '=2+2',
    sku: 'TST-1',
    stock: 99,
    status: 'Active',
    variants: [{ stock: 3 }, { stock: 4 }],
  },
  { id: 'p2', name: 'Second', sku: 'TST-2', stock: 0, status: 'Draft' },
]
const customers = [
  {
    id: 'c1',
    name: 'Test',
    email: 'sample@example.test',
    location: 'Canada',
    joinedAt: '2026-01-01',
  },
]
const orders = [
  {
    id: '1',
    createdAt: '2026-10-17',
    customerId: 'c1',
    country: 'Canada',
    channel: 'Web',
    status: 'Delivered',
    items: [{ productId: 'p1', name: '=2+2', qty: 2, price: 30 }],
    refunds: [{ amount: 10 }],
  },
  {
    id: '2',
    createdAt: '2026-10-16',
    customerId: 'c1',
    country: 'Canada',
    channel: 'Web',
    status: 'Cancelled',
    items: [{ productId: 'p2', name: 'Second', qty: 1, price: 100 }],
  },
  {
    id: '3',
    createdAt: '2026-10-11',
    customerId: 'c1',
    country: 'Canada',
    channel: 'Web',
    status: 'Pending',
    items: [{ productId: 'p1', name: '=2+2', qty: 1, price: 30 }],
  },
]
assert.equal(
  reportRangeError({ period: 'custom', from: '2026-10-17', to: '2026-10-16' }),
  'From date must not be after To date.',
)
assert.equal(
  reportRangeError({ period: 'custom', from: '2026-02-30', to: '2026-10-16' }),
  'Choose valid From and To dates.',
)
assert.equal(reportRange(orders, { period: 'last7' }).from, '2026-10-11')
const all = buildReports(orders, products, customers, [], { period: 'all' })
assert.equal(all.placedCount, 3)
assert.equal(all.nonCancelledCount, 2)
assert.equal(all.bookedValueUsd, 90)
assert.equal(all.refundPreviewUsd, 10)
assert.equal(all.afterRefundPreviewUsd, 80)
assert.equal(all.products.find((p) => p.id === 'p1').stock, 7)
assert.equal(all.products.find((p) => p.id === 'p1').units, 3)
assert.equal(all.inventory.outOfStock, 1)
assert.equal(all.customers[0].orderCount, 2)
const slice = buildReports(orders, products, customers, [], {
  period: 'custom',
  from: '2026-10-17',
  to: '2026-10-17',
})
assert.equal(slice.placedCount, 1)
assert.equal(slice.bookedValueUsd, 60)
assert.ok(
  reportCsv('products', all).includes("'=2+2"),
  'CSV must escape potential formulas',
)
assert.ok(reportCsv('sales', slice).includes('"1"'))
console.log(
  'Report calculations, inclusive date windows, variant stock and CSV formula escaping OK.',
)
