'use client'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Layers3,
  ShieldAlert,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { PageHeading } from './page-heading'
import {
  storefrontCategories,
  storefrontReference,
  categoryGaps,
  draftApiProduct,
  draftOrderLines,
  productGaps,
} from '@/lib/compatibility-contract'

export function Alignment() {
  const ready = useAdminReady()
  const products = useAdminStore((s) => s.products)
  const categories = useAdminStore((s) => s.categories)
  const orders = useAdminStore((s) => s.orders)
  const addCategory = useAdminStore((s) => s.addCategory)
  const [selected, setSelected] = useState('')
  const [notice, setNotice] = useState('')
  const missing = categoryGaps(categories)
  const activeProduct = products.find((p) => p.id === selected) ?? products[0]
  const incomplete = useMemo(
    () => products.filter((p) => productGaps(p, categories).length),
    [products, categories],
  )
  const unresolved = useMemo(
    () =>
      orders.reduce(
        (count, o) =>
          count +
          draftOrderLines(o).filter((line) => line.needsVariantResolution)
            .length,
        0,
      ),
    [orders],
  )
  function createCategory(slug: string) {
    const entry = storefrontCategories.find((c) => c.slug === slug)
    if (!entry) return
    const ok = addCategory(
      entry.label,
      `Customer storefront category: ${entry.label}`,
    )
    setNotice(
      ok
        ? `${entry.label} added to this browser's Admin categories.`
        : 'Category could not be added. Check duplicates.',
    )
  }
  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="CROSS-FRONTEND PREPARATION"
        title="Compatibility review"
        description="Compare Admin previews against the uploaded customer storefront fixture and inspect draft API-shaped data. Nothing is published or synchronized."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Layers3 size={17} /> Missing store categories
          </div>
          <div className="mt-2 text-3xl font-black">{missing.length}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle size={17} /> Incomplete Admin product metadata
          </div>
          <div className="mt-2 text-3xl font-black">{incomplete.length}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldAlert size={17} /> Legacy order lines without variant IDs
          </div>
          <div className="mt-2 text-3xl font-black">{unresolved}</div>
        </div>
      </div>
      <p
        role="note"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      >
        This is a <strong>fixture comparison only</strong>. Matching product
        names do not approve a migration. Admin and Storefront IDs, prices and
        stock remain independent. USD amounts and inventory here cannot
        authorize a live checkout.
      </p>
      <Panel className="p-5">
        <h2 className="font-extrabold">Category compatibility</h2>
        <p className="mt-1 text-sm text-muted">
          Match categories by slug for review only. New categories are added
          locally without renaming saved IDs or deleting existing categories.
        </p>
        <div className="mt-4 space-y-3" data-testid="alignment-categories">
          {storefrontCategories.map((entry) => {
            const found = categories.find((c) => c.slug === entry.slug)
            return (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2"
                key={entry.slug}
              >
                <span className="text-sm font-semibold">
                  {entry.label}{' '}
                  <span className="font-normal text-muted">/{entry.slug}</span>
                </span>
                {found ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 size={15} /> Admin {found.id}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={!ready}
                    onClick={() => createCategory(entry.slug)}
                  >
                    Add {entry.label} locally
                  </Button>
                )}
              </div>
            )
          })}
        </div>
        {notice && (
          <p role="status" className="mt-3 text-sm font-semibold text-primary">
            {notice}
          </p>
        )}
      </Panel>
      <Panel className="overflow-hidden">
        <div className="p-5">
          <h2 className="font-extrabold">Product fixture candidates</h2>
          <p className="mt-1 text-sm text-muted">
            Associations below are suggestions from source review, not confirmed
            ID mappings. Storefront prices are illustrative.
          </p>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Reference product mapping table"
        >
          <table className="admin-table min-w-[790px]">
            <thead>
              <tr>
                <th>Storefront</th>
                <th>Admin candidate</th>
                <th>USD (Store / Admin)</th>
                <th>Variants (Store / Admin)</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {storefrontReference.map((ref) => {
                const admin = products.find((p) => p.id === ref.adminSeedId)
                return (
                  <tr key={ref.id}>
                    <td>
                      <span className="font-semibold">{ref.name}</span>
                      <div className="text-xs text-muted">
                        {ref.id} · /{ref.slug}
                      </div>
                    </td>
                    <td>
                      {admin ? (
                        <>
                          <span className="font-semibold">{admin.name}</span>
                          <div className="text-xs text-muted">{admin.id}</div>
                        </>
                      ) : (
                        <span className="text-amber-700">
                          No approved Admin mapping
                        </span>
                      )}
                    </td>
                    <td>
                      ${ref.usd}{' '}
                      <ArrowRight size={12} className="inline text-muted" />{' '}
                      {admin ? `$${admin.price}` : '—'}
                    </td>
                    <td>
                      {ref.variantCount} / {admin?.variants?.length ?? '—'}
                    </td>
                    <td>
                      {ref.confidence === 'unconfirmed'
                        ? 'Different fixture; verify identity'
                        : ref.confidence === 'missing'
                          ? 'Needs review'
                          : 'Candidate only'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel className="p-5">
        <h2 className="font-extrabold">Draft API-shaped product projection</h2>
        <p className="mt-1 text-sm text-muted">
          Preview matches the storefront&apos;s proposed Product DTO fields.
          Preview IDs are NOT server IDs; missing images/descriptions are left
          missing instead of invented.
        </p>
        <label className="mt-4 block max-w-lg text-sm font-semibold">
          Inspect Admin product
          <select
            aria-label="Inspect Admin product"
            className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
            value={activeProduct?.id ?? ''}
            onChange={(e) => setSelected(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {activeProduct && (
          <>
            <p className="mt-3 text-sm text-muted">
              Metadata gaps:{' '}
              {productGaps(activeProduct, categories).join(' · ') ||
                'No basic metadata gaps detected'}
            </p>
            <pre
              data-testid="draft-api-projection"
              className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100"
              tabIndex={0}
            >
              {JSON.stringify(
                draftApiProduct(activeProduct, categories),
                null,
                2,
              )}
            </pre>
          </>
        )}
      </Panel>
      <p className="text-sm text-muted">
        Order variant IDs, canonical product identity, shipping quotes, payment
        status, backend RBAC and real publication remain unresolved. See{' '}
        <code>docs/COMPATIBILITY_PATCH09.md</code> before backend
        implementation.
      </p>
    </div>
  )
}
