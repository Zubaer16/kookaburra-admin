'use client'
import { useMemo, useState, type FormEvent } from 'react'
import {
  BadgePercent,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Search,
  Calculator,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { previewDiscount } from '@/lib/merchandising'
import type { Promotion, Campaign } from '@/lib/types'
import { money } from '@/lib/utils'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, controlClass } from '@/components/ui/field'

const newPromotion = (): Promotion => ({
  id: '',
  code: '',
  kind: 'percent',
  value: 10,
  minimumUsd: 0,
  capUsd: 0,
  limit: 0,
  startDate: '',
  endDate: '',
  scope: 'all',
  categoryId: '',
  enabled: false,
})
const newCampaign = (): Campaign => ({
  id: '',
  title: '',
  slug: '',
  status: 'Draft',
  startDate: '',
  endDate: '',
  description: '',
})

function CouponForm({
  initial,
  close,
}: {
  initial?: Promotion
  close: () => void
}) {
  const [form, setForm] = useState<Promotion>(() =>
    initial ? { ...initial } : newPromotion(),
  )
  const [error, setError] = useState('')
  const save = useAdminStore((s) => s.savePromotion)
  const categories = useAdminStore((s) => s.categories)
  const change = <K extends keyof Promotion>(key: K, value: Promotion[K]) =>
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
    <form onSubmit={submit} className="space-y-4" data-testid="coupon-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Coupon code">
          <input
            className={controlClass}
            value={form.code}
            onChange={(e) => change('code', e.target.value.toUpperCase())}
            placeholder="SAVE10"
            required
          />
        </Field>
        <Field label="Discount type">
          <select
            className={controlClass}
            value={form.kind}
            onChange={(e) =>
              change('kind', e.target.value as Promotion['kind'])
            }
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount (USD)</option>
          </select>
        </Field>
        <Field
          label={form.kind === 'percent' ? 'Discount (%)' : 'Discount (USD)'}
        >
          <input
            className={controlClass}
            type="number"
            min="0.01"
            max={form.kind === 'percent' ? 100 : undefined}
            step="0.01"
            value={form.value}
            onChange={(e) => change('value', Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Minimum order (USD)">
          <input
            className={controlClass}
            type="number"
            min="0"
            step="0.01"
            value={form.minimumUsd}
            onChange={(e) => change('minimumUsd', Number(e.target.value))}
          />
        </Field>
        <Field label="Maximum discount (USD)" hint="0 means no cap">
          <input
            className={controlClass}
            type="number"
            min="0"
            step="0.01"
            value={form.capUsd}
            onChange={(e) => change('capUsd', Number(e.target.value))}
          />
        </Field>
        <Field
          label="Usage limit"
          hint="0 means unlimited; usage is not tracked in preview"
        >
          <input
            className={controlClass}
            type="number"
            min="0"
            step="1"
            value={form.limit}
            onChange={(e) => change('limit', Number(e.target.value))}
          />
        </Field>
        <Field label="Start date (optional)">
          <input
            className={controlClass}
            type="date"
            value={form.startDate}
            onChange={(e) => change('startDate', e.target.value)}
          />
        </Field>
        <Field label="End date (optional)">
          <input
            className={controlClass}
            type="date"
            value={form.endDate}
            onChange={(e) => change('endDate', e.target.value)}
          />
        </Field>
        <Field label="Applies to">
          <select
            className={controlClass}
            value={form.scope}
            onChange={(e) =>
              change('scope', e.target.value as Promotion['scope'])
            }
          >
            <option value="all">All products</option>
            <option value="category">One category</option>
          </select>
        </Field>
        {form.scope === 'category' && (
          <Field label="Eligible category">
            <select
              className={controlClass}
              value={form.categoryId}
              onChange={(e) => change('categoryId', e.target.value)}
              required
            >
              <option value="">Choose category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => change('enabled', e.target.checked)}
        />{' '}
        Enabled in local preview
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
        <Button type="submit">Save coupon</Button>
      </div>
    </form>
  )
}
function CampaignForm({
  initial,
  close,
}: {
  initial?: Campaign
  close: () => void
}) {
  const [form, setForm] = useState<Campaign>(() =>
    initial ? { ...initial } : newCampaign(),
  )
  const [error, setError] = useState('')
  const save = useAdminStore((s) => s.saveCampaign)
  const change = <K extends keyof Campaign>(key: K, value: Campaign[K]) =>
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
    <form onSubmit={submit} data-testid="campaign-form" className="space-y-4">
      <Field label="Campaign name">
        <input
          className={controlClass}
          value={form.title}
          onChange={(e) => change('title', e.target.value)}
          required
          placeholder="Winter Sale"
        />
      </Field>
      <Field label="Description">
        <textarea
          className={controlClass + ' min-h-24 py-3'}
          value={form.description}
          onChange={(e) => change('description', e.target.value)}
          placeholder="Goals and campaign notes"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input
            type="date"
            className={controlClass}
            value={form.startDate}
            onChange={(e) => change('startDate', e.target.value)}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            className={controlClass}
            value={form.endDate}
            onChange={(e) => change('endDate', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Campaign status">
        <select
          className={controlClass}
          value={form.status}
          onChange={(e) =>
            change('status', e.target.value as Campaign['status'])
          }
        >
          {['Draft', 'Scheduled', 'Active', 'Paused'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-muted">
        This is only an editor status. No automated scheduler, pricing change or
        storefront publishing runs here.
      </p>
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
        <Button type="submit">Save campaign</Button>
      </div>
    </form>
  )
}
export function Promotions() {
  const ready = useAdminReady()
  const coupons = useAdminStore((s) => s.promotions)
  const campaigns = useAdminStore((s) => s.campaigns)
  const categories = useAdminStore((s) => s.categories)
  const removeCoupon = useAdminStore((s) => s.removePromotion)
  const removeCampaign = useAdminStore((s) => s.removeCampaign)
  const [tab, setTab] = useState<'coupons' | 'campaigns'>('coupons')
  const [search, setSearch] = useState('')
  const [editingCoupon, setEditingCoupon] = useState<Promotion | undefined>()
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>()
  const [modal, setModal] = useState(false)
  const [subtotal, setSubtotal] = useState(150)
  const filteredCoupons = useMemo(
    () =>
      coupons.filter((c) =>
        c.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [coupons, search],
  )
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [campaigns, search],
  )
  const openCoupon = (c?: Promotion) => {
    setEditingCoupon(c)
    setModal(true)
  }
  const openCampaign = (c?: Campaign) => {
    setEditingCampaign(c)
    setModal(true)
  }
  return (
    <>
      <PageHeading
        eyebrow="MERCHANDISING & GROWTH"
        title="Promotions"
        description="Plan USD discounts and campaigns. All changes are local previews, not live store offers."
        action={
          <Button
            disabled={!ready}
            onClick={() => (tab === 'coupons' ? openCoupon() : openCampaign())}
          >
            <Plus size={17} />{' '}
            {tab === 'coupons' ? 'Add coupon' : 'Add campaign'}
          </Button>
        }
      />
      <Panel className="mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Promotion sections"
            className="inline-flex gap-2 rounded-xl bg-slate-100 p-1"
          >
            <button
              role="tab"
              aria-selected={tab === 'coupons'}
              onClick={() => {
                setTab('coupons')
                setSearch('')
              }}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'coupons' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
            >
              Coupons ({coupons.length})
            </button>
            <button
              role="tab"
              aria-selected={tab === 'campaigns'}
              onClick={() => {
                setTab('campaigns')
                setSearch('')
              }}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'campaigns' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
            >
              Campaigns ({campaigns.length})
            </button>
          </div>
          <label className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              aria-label={`Search ${tab}`}
              className={controlClass + ' pl-9'}
              placeholder={`Search ${tab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </Panel>
      {tab === 'coupons' ? (
        <>
          <Panel className="mb-5 flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <Calculator size={20} className="text-primary" />
            <div className="flex-1">
              <h2 className="text-sm font-extrabold">
                Example discount calculator
              </h2>
              <p className="text-xs text-muted">
                Sample total only; no checkout, use tracking or currency
                conversion
              </p>
            </div>
            <label className="text-xs font-semibold">
              Cart subtotal (USD)
              <input
                aria-label="Sample subtotal USD"
                className={controlClass + ' mt-1 w-36'}
                type="number"
                min="0"
                step="1"
                value={subtotal}
                onChange={(e) => setSubtotal(Number(e.target.value))}
              />
            </label>
          </Panel>
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredCoupons.map((c) => (
              <Panel key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-blue-50 p-3 text-primary">
                      <BadgePercent size={20} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold">{c.code}</h2>
                      <p className="mt-1 text-xs text-muted">
                        {c.kind === 'percent'
                          ? `${c.value}% off`
                          : `${money(c.value)} off`}{' '}
                        · min {money(c.minimumUsd)}
                      </p>
                    </div>
                  </div>
                  <Badge kind={c.enabled ? 'success' : 'neutral'}>
                    {c.enabled ? 'Preview enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <p>
                    Applies to:{' '}
                    <strong className="text-ink">
                      {c.scope === 'all'
                        ? 'All products'
                        : (categories.find((x) => x.id === c.categoryId)
                            ?.name ?? 'Missing category')}
                    </strong>
                  </p>
                  <p>
                    Usage limit:{' '}
                    <strong className="text-ink">
                      {c.limit || 'Unlimited (preview)'}
                    </strong>
                  </p>
                  <p>
                    Window:{' '}
                    <strong className="text-ink">
                      {c.startDate || 'Any time'} → {c.endDate || 'Any time'}
                    </strong>
                  </p>
                  <p>
                    Cap:{' '}
                    <strong className="text-ink">
                      {c.capUsd ? money(c.capUsd) : 'None'}
                    </strong>
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm">
                    Example saving:{' '}
                    <strong data-testid={`saving-${c.code}`}>
                      {money(previewDiscount(c, subtotal))}
                    </strong>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit coupon ${c.code}`}
                      onClick={() => openCoupon(c)}
                    >
                      <Pencil size={15} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      aria-label={`Delete coupon ${c.code}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete coupon ${c.code} from local preview?`,
                          )
                        )
                          removeCoupon(c.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
          {!filteredCoupons.length && (
            <Panel>
              <EmptyState
                title="No coupons found"
                description="Create a discount or try another search."
              />
            </Panel>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredCampaigns.map((c) => (
              <Panel key={c.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-indigo-50 p-3 text-primary">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <h2 className="font-extrabold">{c.title}</h2>
                      <p className="text-xs text-muted">/{c.slug}</p>
                    </div>
                  </div>
                  <Badge
                    kind={
                      c.status === 'Active'
                        ? 'success'
                        : c.status === 'Scheduled'
                          ? 'info'
                          : 'neutral'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted">
                  {c.description || 'No campaign notes yet.'}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {c.startDate || 'No start'} → {c.endDate || 'No end'}
                </p>
                <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit campaign ${c.title}`}
                    onClick={() => openCampaign(c)}
                  >
                    <Pencil size={15} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    aria-label={`Delete campaign ${c.title}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete campaign ${c.title} from preview?`,
                        )
                      )
                        removeCampaign(c.id)
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
          {!filteredCampaigns.length && (
            <Panel>
              <EmptyState
                title="No campaigns found"
                description="Create a campaign or try another search."
              />
            </Panel>
          )}
        </>
      )}
      {modal && (
        <Modal
          open={modal}
          onOpenChange={setModal}
          wide
          title={
            tab === 'coupons'
              ? editingCoupon
                ? 'Edit coupon'
                : 'Create coupon'
              : editingCampaign
                ? 'Edit campaign'
                : 'Create campaign'
          }
          description="Saved locally for UI testing. No customer discount is activated."
        >
          {tab === 'coupons' ? (
            <CouponForm initial={editingCoupon} close={() => setModal(false)} />
          ) : (
            <CampaignForm
              initial={editingCampaign}
              close={() => setModal(false)}
            />
          )}
        </Modal>
      )}
    </>
  )
}
