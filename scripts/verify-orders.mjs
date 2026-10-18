import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { strict as assert } from 'node:assert'
const require = createRequire(import.meta.url)
let ts
try {
  ts = require('typescript')
} catch {
  console.log(
    'Install npm dev dependencies before running order workflow verification.',
  )
  process.exit(1)
}
const path = join(process.cwd(), 'lib/order-workflow.ts')
assert(existsSync(path))
const src = readFileSync(path, 'utf8')
const compiled = ts.transpileModule(src, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText
const m = { exports: {} }
// No untrusted input: executes the project's own fixed pure rules module only.
new Function('module', 'exports', compiled)(m, m.exports)
const rules = m.exports
const sample = {
  status: 'Delivered',
  items: [
    { price: 19.99, qty: 2 },
    { price: 10, qty: 1 },
  ],
  refunds: [],
  returnRequest: { status: 'Approved' },
}
assert.deepEqual(rules.statusOptions('Processing'), ['Processing', 'Shipped'])
assert(!rules.canAdvanceStatus('Delivered', 'Processing'))
assert(!rules.canAdvanceStatus('Cancelled', 'Pending'))
assert(!rules.canAdvanceStatus('Pending', 'Delivered'))
assert(rules.canAdvanceStatus('Shipped', 'Delivered'))
assert(rules.canCancelOrder({ status: 'Pending' }))
assert(!rules.canCancelOrder({ status: 'Shipped' }))
assert(rules.canRequestReturn({ status: 'Delivered' }))
assert(
  !rules.canRequestReturn({
    status: 'Delivered',
    returnRequest: { status: 'Requested' },
  }),
)
assert(!rules.canRecordRefund({ status: 'Delivered' }))
assert.equal(rules.orderValue(sample), 49.98)
assert(rules.validRefund(sample, 49.98))
assert(!rules.validRefund(sample, 49.99))
assert(!rules.validRefund(sample, 0))
assert(!rules.validRefund(sample, Number.NaN))
const after = { ...sample, refunds: [{ amount: 20 }] }
assert.equal(rules.remainingRefundable(after), 29.98)
assert(!rules.validRefund(after, 30))
assert(rules.validRefund(after, 29.98))
const expected = [
  'components/admin/order-details.tsx',
  'e2e/03-order-workflows.spec.mjs',
  'docs/ORDER_WORKFLOWS.md',
]
for (const path of expected) assert(existsSync(path), `Missing ${path}`)
console.log('Order preview workflow rules and required files passed.')
