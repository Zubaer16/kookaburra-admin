import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const must = [
  'app/layout.tsx',
  'app/(admin)/dashboard/page.tsx',
  'app/(admin)/products/page.tsx',
  'app/(admin)/categories/page.tsx',
  'app/(admin)/inventory/page.tsx',
  'app/(admin)/orders/page.tsx',
  'app/(admin)/customers/page.tsx',
  'components/admin/dashboard.tsx',
  'components/admin/products.tsx',
  'components/admin/categories.tsx',
  'components/admin/inventory.tsx',
  'components/admin/orders.tsx',
  'components/admin/customers.tsx',
  'lib/store.ts',
  'lib/types.ts',
  'playwright.config.mjs',
  'e2e/01-admin-workspace.spec.mjs',
  'e2e/02-catalog-advanced.spec.mjs',
  'lib/catalog.ts',
  'components/admin/product-form.tsx',
]
const missing = must.filter((file) => !existsSync(join(process.cwd(), file)))
if (missing.length) {
  console.error('Missing expected files:', missing)
  process.exit(1)
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
if (pkg.name !== 'kookaburra-admin' || !pkg.scripts['test:e2e:visual']) {
  console.error('Package scripts missing')
  process.exit(1)
}
const source = [
  ...readdirSync('app', { withFileTypes: true }).map((i) => i.name),
]
if (!source.length) {
  process.exit(1)
}
console.log(
  `Kookaburra Admin project structure OK (${must.length} required files checked). This is not a production build.`,
)
