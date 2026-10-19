import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')

function load(file, requireModule = () => ({})) {
  const source = readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
    fileName: file,
  })
  assert.equal(
    output.diagnostics?.filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    ).length ?? 0,
    0,
    `Parsing ${file}`,
  )
  const compiledModule = { exports: {} }
  new Function('require', 'module', 'exports', output.outputText)(
    requireModule,
    compiledModule,
    compiledModule.exports,
  )
  return compiledModule.exports
}
const catalog = load('lib/catalog.ts')
const m = load('lib/merchandising.ts', (id) => {
  assert.equal(id, './catalog')
  return catalog
})
const cats = [{ id: 'fashion', name: 'Fashion' }]
const product = [{ id: 'p-1' }]
const coupon = {
  id: 'new',
  code: 'SAVE20',
  kind: 'percent',
  value: 20,
  minimumUsd: 50,
  capUsd: 15,
  limit: 0,
  startDate: '2026-10-01',
  endDate: '2027-01-01',
  scope: 'all',
  categoryId: '',
  enabled: true,
}
assert.equal(m.promotionError(coupon, [], cats), null)
assert.match(
  m.promotionError(coupon, [{ ...coupon, id: 'prior', code: 'save20' }], cats),
  /already exists/,
)
assert.match(
  m.promotionError({ ...coupon, value: 110 }, [], cats),
  /percentage/,
)
assert.match(
  m.promotionError(
    { ...coupon, scope: 'category', categoryId: 'missing' },
    [],
    cats,
  ),
  /category/,
)
assert.match(
  m.promotionError(
    { ...coupon, startDate: '2026-12-10', endDate: '2026-11-01' },
    [],
    cats,
  ),
  /dates/,
)
assert.equal(m.previewDiscount(coupon, 100), 15)
assert.equal(m.previewDiscount(coupon, 30), 0)
assert.equal(m.previewDiscount({ ...coupon, enabled: false }, 100), 0)
const camp = {
  id: 'c',
  title: 'Spring offers',
  slug: 'spring-offers',
  status: 'Scheduled',
  startDate: '',
  endDate: '',
  description: '',
}
assert.match(m.campaignError(camp, []), /both dates/)
assert.equal(
  m.campaignError(
    { ...camp, startDate: '2027-03-01', endDate: '2027-03-31' },
    [],
  ),
  null,
)
const banner = {
  id: 'b',
  headline: 'Fresh arrivals',
  subtitle: '',
  ctaText: 'Shop now',
  ctaHref: '/shop',
  imageUrl: '',
  position: 1,
  enabled: false,
}
assert.equal(m.bannerError(banner), null)
assert.match(
  m.bannerError({ ...banner, ctaHref: 'https://evil.example' }),
  /internal/,
)
assert.match(
  m.bannerError({ ...banner, imageUrl: 'javascript:alert(1)' }),
  /image/,
)
assert.match(m.bannerError({ ...banner, position: -1 }), /Position/)
const collection = {
  id: 'c',
  title: 'Featured now',
  description: '',
  productIds: ['p-1'],
  position: 1,
  enabled: false,
}
assert.equal(m.collectionError(collection, product, []), null)
assert.match(
  m.collectionError({ ...collection, productIds: [] }, product, []),
  /at least one/,
)
assert.match(
  m.collectionError({ ...collection, productIds: ['p-1', 'p-1'] }, product, []),
  /duplicate/,
)
assert.match(
  m.collectionError({ ...collection, productIds: ['missing'] }, product, []),
  /missing/,
)
console.log(
  'Merchandising rules verified: coupons, campaigns, banners, collections, discount preview.',
)
