'use client'
import { useState, type FormEvent } from 'react'
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Layers3,
  ExternalLink,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import type { StoreBanner, FeaturedCollection } from '@/lib/types'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, controlClass } from '@/components/ui/field'

const newBanner = (): StoreBanner => ({
  id: '',
  headline: '',
  subtitle: '',
  ctaText: 'Shop now',
  ctaHref: '/shop',
  imageUrl: '',
  position: 1,
  enabled: false,
})
const newCollection = (): FeaturedCollection => ({
  id: '',
  title: '',
  description: '',
  productIds: [],
  position: 1,
  enabled: false,
})
function BannerForm({
  initial,
  close,
}: {
  initial?: StoreBanner
  close: () => void
}) {
  const [form, setForm] = useState<StoreBanner>(() =>
    initial ? { ...initial } : newBanner(),
  )
  const [error, setError] = useState('')
  const save = useAdminStore((s) => s.saveBanner)
  const change = <K extends keyof StoreBanner>(key: K, value: StoreBanner[K]) =>
    setForm((s) => ({ ...s, [key]: value }))
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const message = save(form)
    if (message) {
      setError(message)
      return
    }
    close()
  }
  return (
    <form className="space-y-4" data-testid="banner-form" onSubmit={submit}>
      <Field label="Banner headline">
        <input
          className={controlClass}
          required
          value={form.headline}
          onChange={(e) => change('headline', e.target.value)}
        />
      </Field>
      <Field label="Subtitle">
        <textarea
          className={controlClass + ' min-h-20 py-3'}
          value={form.subtitle}
          onChange={(e) => change('subtitle', e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CTA label">
          <input
            className={controlClass}
            required
            value={form.ctaText}
            onChange={(e) => change('ctaText', e.target.value)}
          />
        </Field>
        <Field label="CTA link" hint="Store route only, e.g. /shop">
          <input
            className={controlClass}
            required
            value={form.ctaHref}
            onChange={(e) => change('ctaHref', e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="Image URL"
        hint="Optional local path or HTTPS image reference; no upload is performed"
      >
        <input
          className={controlClass}
          placeholder="/images/banner.jpg"
          value={form.imageUrl}
          onChange={(e) => change('imageUrl', e.target.value)}
        />
      </Field>
      <Field label="Display position">
        <input
          className={controlClass}
          type="number"
          min="1"
          max="99"
          step="1"
          value={form.position}
          onChange={(e) => change('position', Number(e.target.value))}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => change('enabled', e.target.checked)}
        />{' '}
        Visible in local content preview
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">Save banner</Button>
      </div>
    </form>
  )
}
function CollectionForm({
  initial,
  close,
}: {
  initial?: FeaturedCollection
  close: () => void
}) {
  const [form, setForm] = useState<FeaturedCollection>(() =>
    initial
      ? { ...initial, productIds: [...initial.productIds] }
      : newCollection(),
  )
  const products = useAdminStore((s) => s.products)
  const save = useAdminStore((s) => s.saveCollection)
  const [error, setError] = useState('')
  const change = <K extends keyof FeaturedCollection>(
    key: K,
    value: FeaturedCollection[K],
  ) => setForm((s) => ({ ...s, [key]: value }))
  function toggle(id: string, checked: boolean) {
    change(
      'productIds',
      checked
        ? [...form.productIds, id]
        : form.productIds.filter((pid) => pid !== id),
    )
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const message = save(form)
    if (message) {
      setError(message)
      return
    }
    close()
  }
  return (
    <form className="space-y-4" data-testid="collection-form" onSubmit={submit}>
      <Field label="Collection title">
        <input
          className={controlClass}
          required
          value={form.title}
          onChange={(e) => change('title', e.target.value)}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={controlClass + ' min-h-20 py-3'}
          value={form.description}
          onChange={(e) => change('description', e.target.value)}
        />
      </Field>
      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">
          Products ({form.productIds.length} selected)
        </legend>
        <div className="grid max-h-60 gap-3 overflow-y-auto sm:grid-cols-2">
          {products.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.productIds.includes(p.id)}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
              <span>
                {p.name}{' '}
                <span className="text-xs text-muted">({p.status})</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Display position">
        <input
          className={controlClass}
          type="number"
          min="1"
          max="99"
          step="1"
          value={form.position}
          onChange={(e) => change('position', Number(e.target.value))}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => change('enabled', e.target.checked)}
        />{' '}
        Visible in local content preview
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">Save collection</Button>
      </div>
    </form>
  )
}
export function StoreContent() {
  const ready = useAdminReady()
  const banners = useAdminStore((s) => s.banners)
  const collections = useAdminStore((s) => s.collections)
  const products = useAdminStore((s) => s.products)
  const removeBanner = useAdminStore((s) => s.removeBanner)
  const removeCollection = useAdminStore((s) => s.removeCollection)
  const [tab, setTab] = useState<'banners' | 'collections'>('banners')
  const [modal, setModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<StoreBanner | undefined>()
  const [editingCollection, setEditingCollection] = useState<
    FeaturedCollection | undefined
  >()
  const openBanner = (b?: StoreBanner) => {
    setEditingBanner(b)
    setModal(true)
  }
  const openCollection = (c?: FeaturedCollection) => {
    setEditingCollection(c)
    setModal(true)
  }
  return (
    <>
      <PageHeading
        eyebrow="STOREFRONT MERCHANDISING"
        title="Store content"
        description="Arrange hero banners and curated products without editing the storefront code. Local preview only."
        action={
          <Button
            disabled={!ready}
            onClick={() =>
              tab === 'banners' ? openBanner() : openCollection()
            }
          >
            <Plus size={17} />{' '}
            {tab === 'banners' ? 'Add banner' : 'Add collection'}
          </Button>
        }
      />
      <Panel className="mb-5 p-4 sm:p-5">
        <div
          role="tablist"
          aria-label="Content sections"
          className="inline-flex gap-2 rounded-xl bg-slate-100 p-1"
        >
          <button
            role="tab"
            aria-selected={tab === 'banners'}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'banners' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
            onClick={() => setTab('banners')}
          >
            Banners ({banners.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === 'collections'}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'collections' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
            onClick={() => setTab('collections')}
          >
            Featured collections ({collections.length})
          </button>
        </div>
      </Panel>
      {tab === 'banners' ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {[...banners]
            .sort((a, b) => a.position - b.position)
            .map((b) => (
              <Panel key={b.id} className="overflow-hidden">
                <div className="relative min-h-40 overflow-hidden bg-gradient-to-r from-[#163fa7] via-[#2459e8] to-[#6390f8] p-6 text-white">
                  <ImageIcon size={24} className="mb-3 opacity-75" />
                  <h2 className="max-w-md text-lg font-extrabold">
                    {b.headline}
                  </h2>
                  <p className="mt-1 max-w-md text-xs text-blue-50">
                    {b.subtitle}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-blue-700">
                    {b.ctaText} <ExternalLink size={13} />
                  </span>
                  {b.imageUrl && (
                    <p className="mt-2 break-all text-[11px] opacity-80">
                      Image reference: {b.imageUrl}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="space-y-1">
                    <Badge kind={b.enabled ? 'success' : 'neutral'}>
                      {b.enabled ? 'Preview visible' : 'Hidden'}
                    </Badge>
                    <p className="text-xs text-muted">
                      Position {b.position} · Destination: {b.ctaHref}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit banner ${b.headline}`}
                      onClick={() => openBanner(b)}
                    >
                      <Pencil size={15} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      aria-label={`Delete banner ${b.headline}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete banner ${b.headline} from preview?`,
                          )
                        )
                          removeBanner(b.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {[...collections]
            .sort((a, b) => a.position - b.position)
            .map((c) => (
              <Panel key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-blue-50 p-3 text-primary">
                      <Layers3 size={20} />
                    </span>
                    <div>
                      <h2 className="font-extrabold">{c.title}</h2>
                      <p className="text-xs text-muted">
                        Position {c.position}
                      </p>
                    </div>
                  </div>
                  <Badge kind={c.enabled ? 'success' : 'neutral'}>
                    {c.enabled ? 'Preview visible' : 'Hidden'}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted">{c.description}</p>
                <p className="mt-3 text-xs font-semibold">
                  {c.productIds.length} products
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {c.productIds.map((id) => (
                    <li
                      key={id}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs"
                    >
                      {products.find((p) => p.id === id)?.name ??
                        'Product removed'}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit collection ${c.title}`}
                    onClick={() => openCollection(c)}
                  >
                    <Pencil size={15} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    aria-label={`Delete collection ${c.title}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete collection ${c.title} from preview?`,
                        )
                      )
                        removeCollection(c.id)
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Panel>
            ))}
        </div>
      )}
      {((tab === 'banners' && !banners.length) ||
        (tab === 'collections' && !collections.length)) && (
        <Panel>
          <EmptyState
            title="Nothing here yet"
            description="Add content to prepare a storefront merchandising layout."
          />
        </Panel>
      )}
      {modal && (
        <Modal
          wide
          open={modal}
          onOpenChange={setModal}
          title={
            tab === 'banners'
              ? editingBanner
                ? 'Edit banner'
                : 'Add banner'
              : editingCollection
                ? 'Edit collection'
                : 'Add collection'
          }
          description="This editor only changes local admin preview data."
        >
          {tab === 'banners' ? (
            <BannerForm initial={editingBanner} close={() => setModal(false)} />
          ) : (
            <CollectionForm
              initial={editingCollection}
              close={() => setModal(false)}
            />
          )}
        </Modal>
      )}
    </>
  )
}
