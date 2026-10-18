'use client'
import { Fragment, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Images,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { categoryPath, stockOf, mediaUrlIsSafe } from '@/lib/catalog'
import type { Product } from '@/lib/types'
import { money, number } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Modal } from '@/components/ui/modal'
import { controlClass } from '@/components/ui/field'
import { PageHeading } from './page-heading'
import { ProductForm } from './product-form'

export function Products() {
  const ready = useAdminReady(),
    products = useAdminStore((s) => s.products),
    categories = useAdminStore((s) => s.categories),
    deleteProduct = useAdminStore((s) => s.deleteProduct)
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('all'),
    [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Product | undefined>()
  const [expanded, setExpanded] = useState<string[]>([])
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!query ||
            `${p.name} ${p.sku} ${(p.variants ?? []).map((v) => v.sku).join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (category === 'all' || p.categoryId === category) &&
          (status === 'all' || p.status === status),
      ),
    [products, query, category, status],
  )
  function openForm(p?: Product) {
    setEditing(p)
    setOpen(true)
  }
  function toggle(id: string) {
    setExpanded((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    )
  }
  return (
    <>
      <PageHeading
        eyebrow="CATALOG MANAGEMENT"
        title="Products"
        description="Manage products, size/color variations, image references, and publishing status."
        action={
          <Button
            disabled={!ready || !categories.length}
            onClick={() => openForm()}
          >
            <Plus size={17} />
            Add product
          </Button>
        }
      />
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4 sm:p-5">
          <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-3 text-muted" />
            <input
              aria-label="Search products"
              className={controlClass + ' pl-10'}
              placeholder="Search product or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <SlidersHorizontal className="text-muted" size={16} />
            <select
              aria-label="Filter category"
              className={controlClass + ' min-w-[135px]'}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryPath(c.id, categories)}
                </option>
              ))}
            </select>
          </label>
          <select
            aria-label="Filter product status"
            className={controlClass + ' w-auto'}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
        <div className="flex items-center justify-between px-5 py-3 text-xs text-muted">
          <span>
            {filtered.length} of {products.length} products
          </span>
          <span>All prices in USD · Browser preview</span>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Variants</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <FragmentRow
                  key={p.id}
                  p={p}
                  path={categoryPath(p.categoryId, categories)}
                  expanded={expanded.includes(p.id)}
                  onToggle={() => toggle(p.id)}
                  onEdit={() => openForm(p)}
                  onDelete={() => {
                    if (
                      window.confirm(
                        `Delete ${p.name}? This only affects local preview data.`,
                      )
                    )
                      deleteProduct(p.id)
                  }}
                />
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <EmptyState
              title="No matching products"
              description="Adjust your search or add a new product."
            />
          )}
        </div>
      </Panel>
      {open && (
        <Modal
          wide
          open={open}
          onOpenChange={setOpen}
          title={editing ? 'Edit product' : 'Add a new product'}
          description="Preview changes save to this browser only. No live catalog is affected."
        >
          <ProductForm initial={editing} close={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
function FragmentRow({
  p,
  path,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  p: Product
  path: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const cover = p.images?.find((i) => mediaUrlIsSafe(i.url))
  return (
    <Fragment>
      <tr>
        <td>
          <div className="flex min-w-[210px] items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cover bg-center"
              style={{
                backgroundColor: p.color,
                ...(cover
                  ? { backgroundImage: `url(${JSON.stringify(cover.url)})` }
                  : {}),
              }}
              role={cover ? 'img' : undefined}
              aria-label={cover?.alt}
            >
              {!cover && (
                <Package size={19} className="m-auto text-slate-600" />
              )}
            </span>
            <span className="font-bold">{p.name}</span>
          </div>
        </td>
        <td className="text-muted">{p.sku}</td>
        <td className="whitespace-nowrap">{path}</td>
        <td className="font-bold">{money(p.price)}</td>
        <td>
          <span
            className={
              stockOf(p) < 10 ? 'font-bold text-amber-700' : 'font-semibold'
            }
          >
            {number(stockOf(p))}
          </span>
        </td>
        <td>
          <span className="text-xs text-muted">{p.variants?.length ?? 0}</span>
        </td>
        <td>
          <Badge kind={statusKind(p.status)}>{p.status}</Badge>
        </td>
        <td>
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Variants for ${p.name}`}
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${p.name}`}
              onClick={onEdit}
            >
              <Edit3 size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-600"
              aria-label={`Delete ${p.name}`}
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-blue-50/40">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <Images size={15} />
                Variant & media overview · {p.images?.length ?? 0} image
                references
              </div>
              {p.variants?.length ? (
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-lg border border-line bg-white px-3 py-2 text-xs"
                    >
                      <strong>
                        {v.size} / {v.color}
                      </strong>
                      <span className="ml-2 text-muted">
                        {v.sku} · {v.stock} units
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Single SKU — no variations configured.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  )
}
