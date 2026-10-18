'use client'
import { useMemo, useState, type FormEvent } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Calculator,
  Truck,
  ReceiptText,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import {
  destinationCountries,
  deliveryKinds,
  serviceLabel,
  previewQuote,
} from '@/lib/commerce-policy'
import type { ShippingZone, TaxRule, ShippingService } from '@/lib/types'
import { money } from '@/lib/utils'
import { PageHeading } from './page-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Panel, EmptyState } from '@/components/ui/panel'

const newZone = (): ShippingZone => ({
  id: '',
  name: '',
  countries: [],
  enabled: true,
  services: [
    {
      kind: 'standard',
      feeUsd: 18,
      freeOverUsd: 0,
      enabled: true,
      etaNote: 'Timing to be confirmed',
    },
    {
      kind: 'express',
      feeUsd: 35,
      freeOverUsd: 0,
      enabled: true,
      etaNote: 'Availability to be confirmed',
    },
  ],
})
const newTax = (): TaxRule => ({
  id: '',
  country: '',
  ratePercent: 0,
  note: '',
  enabled: false,
})

function ZoneEditor({
  initial,
  close,
}: {
  initial?: ShippingZone
  close: () => void
}) {
  const [form, setForm] = useState<ShippingZone>(() =>
    initial
      ? {
          ...initial,
          countries: [...initial.countries],
          services: initial.services.map((s) => ({ ...s })),
        }
      : newZone(),
  )
  const [error, setError] = useState('')
  const save = useAdminStore((s) => s.saveShippingZone)
  const zones = useAdminStore((s) => s.shippingZones)
  const taken = useMemo(
    () =>
      new Set(
        zones.filter((z) => z.id !== form.id).flatMap((z) => z.countries),
      ),
    [zones, form.id],
  )
  const serviceChange = (
    kind: ShippingService['kind'],
    patch: Partial<ShippingService>,
  ) =>
    setForm((f) => ({
      ...f,
      services: f.services.map((s) =>
        s.kind === kind ? { ...s, ...patch } : s,
      ),
    }))
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = save(form)
    if (message) {
      setError(message)
      return
    }
    close()
  }
  return (
    <form className="space-y-5" onSubmit={submit} data-testid="zone-editor">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shipping zone name">
          <input
            className={controlClass}
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Pacific destinations"
          />
        </Field>
        <Field label="Availability">
          <label className="flex h-10 items-center gap-2 text-sm font-normal">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
            />{' '}
            Enabled in local preview
          </label>
        </Field>
      </div>
      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-bold">
          Destination countries
        </legend>
        <p className="mb-3 text-xs text-muted">
          Match the Storefront example country choices. Countries already
          assigned to another zone are unavailable.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {destinationCountries.map((country) => (
            <label className="flex items-center gap-2 text-sm" key={country}>
              <input
                type="checkbox"
                disabled={taken.has(country)}
                checked={form.countries.includes(country)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    countries: e.target.checked
                      ? [...f.countries, country]
                      : f.countries.filter((c) => c !== country),
                  }))
                }
              />
              {country}
              {taken.has(country) && (
                <span className="text-[10px] text-muted">assigned</span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-4">
        {deliveryKinds.map((kind) => {
          const service = form.services.find((s) => s.kind === kind)!
          return (
            <fieldset key={kind} className="rounded-xl border border-line p-4">
              <legend className="px-1 text-sm font-bold">
                {serviceLabel(kind)}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={`${kind === 'standard' ? 'Standard' : 'Express'} flat fee (USD)`}
                >
                  <input
                    className={controlClass}
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={service.feeUsd}
                    onChange={(e) =>
                      serviceChange(kind, { feeUsd: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field
                  label={`${kind === 'standard' ? 'Standard' : 'Express'} free over (USD)`}
                  hint="0 disables free-shipping threshold"
                >
                  <input
                    className={controlClass}
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={service.freeOverUsd}
                    onChange={(e) =>
                      serviceChange(kind, {
                        freeOverUsd: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field
                  label={`${kind === 'standard' ? 'Standard' : 'Express'} delivery note`}
                >
                  <input
                    className={controlClass}
                    maxLength={100}
                    value={service.etaNote}
                    onChange={(e) =>
                      serviceChange(kind, { etaNote: e.target.value })
                    }
                  />
                </Field>
                <Field label="Service availability">
                  <label className="flex h-10 items-center gap-2 text-sm font-normal">
                    <input
                      type="checkbox"
                      checked={service.enabled}
                      onChange={(e) =>
                        serviceChange(kind, { enabled: e.target.checked })
                      }
                    />{' '}
                    Enabled in preview
                  </label>
                </Field>
              </div>
            </fieldset>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">Save shipping zone</Button>
      </div>
    </form>
  )
}
function TaxEditor({
  initial,
  close,
}: {
  initial?: TaxRule
  close: () => void
}) {
  const [form, setForm] = useState<TaxRule>(() =>
    initial ? { ...initial } : newTax(),
  )
  const [error, setError] = useState('')
  const save = useAdminStore((s) => s.saveTaxRule)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = save(form)
    if (message) {
      setError(message)
      return
    }
    close()
  }
  return (
    <form className="space-y-4" onSubmit={submit} data-testid="tax-editor">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      <Field label="Tax destination">
        <select
          className={controlClass}
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          required
        >
          <option value="">Select destination</option>
          {destinationCountries.map((c) => (
            <option value={c} key={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Illustrative tax percent"
        hint="Demonstration-only arithmetic, not a legal tax rate or final checkout quote"
      >
        <input
          className={controlClass}
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.ratePercent}
          onChange={(e) =>
            setForm((f) => ({ ...f, ratePercent: Number(e.target.value) }))
          }
        />
      </Field>
      <Field label="Internal note">
        <textarea
          className={`${controlClass} h-20 py-2`}
          value={form.note}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="Configure with verified jurisdictional tax policy later"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, enabled: e.target.checked }))
          }
        />{' '}
        Enable illustration in preview calculator
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">Save tax preview rule</Button>
      </div>
    </form>
  )
}
function QuoteCalculator({
  zones,
  taxes,
}: {
  zones: ShippingZone[]
  taxes: TaxRule[]
}) {
  const [country, setCountry] = useState('United States')
  const [kind, setKind] = useState<ShippingService['kind']>('standard')
  const [subtotal, setSubtotal] = useState(150)
  const quote = useMemo(
    () => previewQuote(zones, taxes, country, kind, subtotal),
    [zones, taxes, country, kind, subtotal],
  )
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Calculator size={20} className="text-primary" />
        <h2 className="font-extrabold">Shipping & tax illustration</h2>
      </div>
      <p className="mt-1 text-xs text-muted">
        Admin-only simulation. The Storefront does not read these settings; live
        rates/taxes need a validated backend.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Preview country">
          <select
            className={controlClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {destinationCountries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Delivery method">
          <select
            className={controlClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as ShippingService['kind'])}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </Field>
        <Field label="Sample subtotal (USD)">
          <input
            type="number"
            min="0"
            max="10000"
            step="0.01"
            className={controlClass}
            value={subtotal}
            onChange={(e) => setSubtotal(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <span className="text-muted">Matched zone</span>
          <p className="mt-1 font-bold" data-testid="matched-zone">
            {quote.zoneName ?? 'Not configured'}
          </p>
        </div>
        <div>
          <span className="text-muted">Preview shipping</span>
          <p className="mt-1 font-bold" data-testid="preview-shipping">
            {quote.deliveryUsd === null
              ? 'Unavailable'
              : money(quote.deliveryUsd)}
          </p>
        </div>
        <div>
          <span className="text-muted">Illustrative tax (subtotal only)</span>
          <p className="mt-1 font-bold" data-testid="preview-tax">
            {quote.taxUsd === null ? 'Not configured' : money(quote.taxUsd)}
          </p>
        </div>
        <div>
          <span className="text-muted">Subtotal + shipping, excluding tax</span>
          <p className="mt-1 font-bold" data-testid="preview-without-tax">
            {quote.subtotalAndDeliveryUsd === null
              ? 'Unavailable'
              : money(quote.subtotalAndDeliveryUsd)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-amber-800">
        Not an executable checkout quote. Customs, duties, shipping-taxability,
        exemptions and real country eligibility are intentionally not
        calculated.
      </p>
    </Panel>
  )
}
export function Shipping() {
  const ready = useAdminReady()
  const zones = useAdminStore((s) => s.shippingZones)
  const taxes = useAdminStore((s) => s.taxRules)
  const removeZone = useAdminStore((s) => s.removeShippingZone)
  const removeTax = useAdminStore((s) => s.removeTaxRule)
  const [tab, setTab] = useState<'zones' | 'taxes'>('zones')
  const [zoneModal, setZoneModal] = useState(false)
  const [taxModal, setTaxModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | undefined>()
  const [editingTax, setEditingTax] = useState<TaxRule | undefined>()
  if (!ready)
    return <p className="text-sm text-muted">Loading local settings preview…</p>
  return (
    <>
      <PageHeading
        eyebrow="Store configuration"
        title="Shipping & taxes"
        description="International delivery policies and illustrative tax rules, saved only in this browser."
        action={<Badge kind="warning">Not published to Storefront</Badge>}
      />
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Shipping settings tabs"
      >
        <button
          role="tab"
          aria-selected={tab === 'zones'}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'zones' ? 'bg-primary text-white' : 'bg-white text-ink'}`}
          onClick={() => setTab('zones')}
        >
          <Truck className="mr-1 inline" size={15} />
          Shipping zones
        </button>
        <button
          role="tab"
          aria-selected={tab === 'taxes'}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'taxes' ? 'bg-primary text-white' : 'bg-white text-ink'}`}
          onClick={() => setTab('taxes')}
        >
          <ReceiptText className="mr-1 inline" size={15} />
          Tax preview rules
        </button>
      </div>
      {tab === 'zones' ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Delivery destinations</h2>
            <Button
              onClick={() => {
                setEditingZone(undefined)
                setZoneModal(true)
              }}
            >
              <Plus size={17} />
              Add shipping zone
            </Button>
          </div>
          {zones.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {zones.map((z) => (
                <Panel key={z.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold">{z.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {z.countries.length} example destinations
                      </p>
                    </div>
                    <Badge kind={z.enabled ? 'success' : 'neutral'}>
                      {z.enabled ? 'Enabled preview' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {z.countries.join(' · ')}
                  </p>
                  <div className="mt-4 space-y-2 border-t border-line pt-3">
                    {z.services.map((s) => (
                      <div
                        key={s.kind}
                        className="flex justify-between gap-2 text-sm"
                      >
                        <span>
                          {serviceLabel(s.kind)} {s.enabled ? '' : '(disabled)'}
                        </span>
                        <strong>{money(s.feeUsd)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Edit shipping zone ${z.name}`}
                      onClick={() => {
                        setEditingZone(z)
                        setZoneModal(true)
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="danger"
                      aria-label={`Delete shipping zone ${z.name}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove shipping zone ${z.name} from local preview?`,
                          )
                        )
                          removeZone(z.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel>
              <EmptyState
                title="No shipping zones"
                description="Add a zone to preview example international delivery prices."
              />
            </Panel>
          )}
        </div>
      ) : (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Tax illustrations</h2>
            <Button
              onClick={() => {
                setEditingTax(undefined)
                setTaxModal(true)
              }}
            >
              <Plus size={17} />
              Add tax preview rule
            </Button>
          </div>
          {taxes.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {taxes.map((r) => (
                <Panel className="p-5" key={r.id}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{r.country}</h3>
                    <Badge kind={r.enabled ? 'info' : 'neutral'}>
                      {r.enabled ? 'Example enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-2xl font-black">{r.ratePercent}%</p>
                  <p className="mt-2 text-sm text-muted">
                    {r.note || 'No internal note'}
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit tax rule ${r.country}`}
                      onClick={() => {
                        setEditingTax(r)
                        setTaxModal(true)
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="danger"
                      aria-label={`Delete tax rule ${r.country}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove tax rule ${r.country} from preview?`,
                          )
                        )
                          removeTax(r.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel>
              <EmptyState
                title="No tax preview rules"
                description="Tax amounts are intentionally marked as not configured."
              />
            </Panel>
          )}
        </div>
      )}
      <QuoteCalculator zones={zones} taxes={taxes} />
      {zoneModal && (
        <Modal
          wide
          open={zoneModal}
          onOpenChange={setZoneModal}
          title={editingZone ? 'Edit shipping zone' : 'Add shipping zone'}
          description="Browser-local delivery setup. Nothing is published to the Storefront."
        >
          <ZoneEditor initial={editingZone} close={() => setZoneModal(false)} />
        </Modal>
      )}
      {taxModal && (
        <Modal
          open={taxModal}
          onOpenChange={setTaxModal}
          title={editingTax ? 'Edit tax preview rule' : 'Add tax preview rule'}
          description="These are illustrative percentages, not verified statutory tax rates."
        >
          <TaxEditor initial={editingTax} close={() => setTaxModal(false)} />
        </Modal>
      )}
    </>
  )
}
