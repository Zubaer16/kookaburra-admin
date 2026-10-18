'use client'
import { useMemo, useState, type FormEvent } from 'react'
import { Boxes, AlertTriangle, ArrowUpDown, Search } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { stockOf } from '@/lib/catalog'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, controlClass } from '@/components/ui/field'
import type { Product } from '@/lib/types'
import { shortDate } from '@/lib/utils'

export function Inventory() {
  const products = useAdminStore((s) => s.products),
    events = useAdminStore((s) => s.stockEvents),
    adjust = useAdminStore((s) => s.adjustStock)
  const [query, setQuery] = useState(''),
    [lowOnly, setLowOnly] = useState(false),
    [selected, setSelected] = useState<Product | null>(null)
  const [variantId, setVariantId] = useState(''),
    [delta, setDelta] = useState(''),
    [note, setNote] = useState(''),
    [error, setError] = useState('')
  const list = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (!lowOnly || stockOf(p) < 10) &&
            `${p.name} ${p.sku} ${(p.variants ?? []).map((v) => v.sku).join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => stockOf(a) - stockOf(b)),
    [products, lowOnly, query],
  )
  const selectedVariant = selected?.variants?.find((v) => v.id === variantId)
  function openAdjustment(p: Product) {
    setSelected(p)
    setVariantId(p.variants?.[0]?.id ?? '')
    setDelta('')
    setNote('')
    setError('')
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    if (
      !selected ||
      !adjust(
        selected.id,
        Number(delta),
        note,
        selected.variants?.length ? variantId : undefined,
      )
    ) {
      setError(
        'Enter a non-zero whole number. Resulting stock cannot be negative.',
      )
      return
    }
    setSelected(null)
    setDelta('')
    setNote('')
    setError('')
  }
  return (
    <>
      <PageHeading
        eyebrow="STOCK CONTROL"
        title="Inventory"
        description="Review variant-level stock and simulate manual adjustments."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <div className="flex gap-2 text-muted">
            <Boxes size={18} />
            <span className="text-xs font-bold">Total units</span>
          </div>
          <p className="mt-3 text-2xl font-black">
            {products.reduce((s, p) => s + stockOf(p), 0)}
          </p>
        </Panel>
        <Panel className="p-5">
          <div className="flex gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold">Low stock (&lt;10)</span>
          </div>
          <p className="mt-3 text-2xl font-black">
            {products.filter((p) => stockOf(p) > 0 && stockOf(p) < 10).length}
          </p>
        </Panel>
        <Panel className="p-5">
          <div className="flex gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold">Out of stock</span>
          </div>
          <p className="mt-3 text-2xl font-black">
            {products.filter((p) => stockOf(p) === 0).length}
          </p>
        </Panel>
      </div>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <label className="relative min-w-48 flex-1">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              aria-label="Search inventory"
              placeholder="Search inventory or variant SKU..."
              className={controlClass + ' pl-10'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Low stock only
          </label>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Inventory table (scroll horizontally for more columns)"
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available</th>
                <th>Stock health</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>{p.name}</div>
                    {!!p.variants?.length && (
                      <span className="text-xs font-normal text-muted">
                        {p.variants.length} variants
                      </span>
                    )}
                  </td>
                  <td className="text-muted">{p.sku}</td>
                  <td>{stockOf(p)}</td>
                  <td>
                    <Badge
                      kind={
                        stockOf(p) === 0
                          ? 'danger'
                          : stockOf(p) < 10
                            ? 'warning'
                            : 'success'
                      }
                    >
                      {stockOf(p) === 0
                        ? 'Out of stock'
                        : stockOf(p) < 10
                          ? 'Low stock'
                          : 'In stock'}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAdjustment(p)}
                    >
                      <ArrowUpDown size={14} />
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <EmptyState title="No matching inventory" />}
        </div>
      </Panel>
      <Panel className="mt-5 p-5">
        <h2 className="font-extrabold">Recent adjustments</h2>
        <p className="mt-1 text-xs text-muted">
          Local changes are recorded in this browser only.
        </p>
        <div className="mt-4 space-y-2">
          {events.length ? (
            events.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="flex justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs"
              >
                <span>
                  <strong>
                    {products.find((p) => p.id === e.productId)?.name ??
                      'Removed product'}
                  </strong>
                  {e.variantId && (
                    <span className="ml-1 text-muted">
                      (
                      {products
                        .find((p) => p.id === e.productId)
                        ?.variants?.find((v) => v.id === e.variantId)?.sku ??
                        'Variant'}
                      )
                    </span>
                  )}
                  <span className="ml-2 text-muted">{e.note}</span>
                </span>
                <span className="whitespace-nowrap font-bold">
                  {e.delta > 0 ? '+' : ''}
                  {e.delta}{' '}
                  <span className="ml-1 font-normal text-muted">
                    {shortDate(e.at)}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted">No adjustments yet.</div>
          )}
        </div>
      </Panel>
      {selected && (
        <Modal
          title={`Adjust stock — ${selected.name}`}
          description="Enter a positive or negative change. Stock cannot become negative."
          open={!!selected}
          onOpenChange={(v) => {
            if (!v) setSelected(null)
          }}
        >
          <form onSubmit={submit} className="space-y-4">
            {!!selected.variants?.length && (
              <Field label="Stock variant">
                <select
                  className={controlClass}
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                >
                  {selected.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} · {v.sku} ({v.stock} units)
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <p className="text-xs text-muted">
              Current quantity:{' '}
              {selectedVariant ? selectedVariant.stock : stockOf(selected)}
            </p>
            <Field
              label="Quantity change"
              hint="Examples: +5 for received items, -2 for damaged items"
            >
              <input
                className={controlClass}
                type="number"
                step="1"
                required
                placeholder="e.g. 5"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </Field>
            <Field label="Reason">
              <input
                className={controlClass}
                placeholder="Stock count correction"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save adjustment</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
