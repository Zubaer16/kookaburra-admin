'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ClipboardList,
  PackageCheck,
  RotateCcw,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge, statusKind } from '@/components/ui/badge'
import { controlClass } from '@/components/ui/field'
import { useAdminStore } from '@/lib/store'
import { orderTotal } from '@/lib/fixtures'
import {
  canCancelOrder,
  canDecideReturn,
  canRecordRefund,
  canRequestReturn,
  canSaveShipment,
  remainingRefundable,
  refundedTotal,
  statusOptions,
  timelineFor,
} from '@/lib/order-workflow'
import { money, shortDate } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

const boxStyle = 'rounded-xl border border-line bg-white p-4 sm:p-5'

export function OrderDetails({
  id,
  onClose,
}: {
  id: string | null
  onClose: () => void
}) {
  const orders = useAdminStore((s) => s.orders)
  const customers = useAdminStore((s) => s.customers)
  const products = useAdminStore((s) => s.products)
  const advance = useAdminStore((s) => s.updateOrderStatus)
  const saveShipment = useAdminStore((s) => s.saveShipment)
  const cancelOrder = useAdminStore((s) => s.cancelOrder)
  const requestReturn = useAdminStore((s) => s.requestReturn)
  const decideReturn = useAdminStore((s) => s.decideReturn)
  const recordRefund = useAdminStore((s) => s.recordRefund)
  const order = orders.find((o) => o.id === id)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [service, setService] = useState('')
  const [eta, setEta] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [refundValue, setRefundValue] = useState('')
  const [refundNote, setRefundNote] = useState('')

  useEffect(() => {
    const current = orders.find((o) => o.id === id)
    setCarrier(current?.shipment?.carrier ?? '')
    setTracking(current?.shipment?.trackingNumber ?? '')
    setService(current?.shipment?.service ?? '')
    setEta(current?.shipment?.estimatedDelivery ?? '')
    setError('')
    setNotice('')
    setShowCancel(false)
    setCancelReason('')
    setReturnReason('')
    setRefundValue('')
    setRefundNote('')
    // Sync editing fields when a different order is opened, not on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function outcome(ok: boolean, message: string, fail: string) {
    setNotice(ok ? message : '')
    setError(ok ? '' : fail)
  }

  return (
    <Modal
      title={order ? `Order ${order.id}` : 'Order'}
      description="Frontend-only fulfillment preview. No carrier, payment or customer systems are contacted."
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      wide
    >
      {order && (
        <div className="space-y-5">
          <p
            className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800"
            role="note"
          >
            Preview data is stored in this browser only. No real shipment,
            cancellation, return or refund is performed.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
            >
              {notice}
            </p>
          )}
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted">Customer</p>
              <p className="mt-1 font-bold">
                {customers.find((c) => c.id === order.customerId)?.name ??
                  'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Country</p>
              <p className="mt-1 font-bold">{order.country}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Channel</p>
              <p className="mt-1 font-bold">{order.channel}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Current status</p>
              <div className="mt-1">
                <Badge kind={statusKind(order.status)}>{order.status}</Badge>
              </div>
            </div>
          </div>
          <section className={boxStyle} aria-label="Order items">
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <ClipboardList size={17} /> Order items
            </h3>
            {order.items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-4 border-b border-line py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.variantId ? (
                    <p className="mt-1 text-xs text-muted">
                      Variant: {item.variantId}
                      {item.sku ? ` · SKU: ${item.sku}` : ''}
                      {item.optionSnapshot &&
                      Object.keys(item.optionSnapshot).length
                        ? ` · ${Object.entries(item.optionSnapshot)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ')}`
                        : ''}
                    </p>
                  ) : products.find((p) => p.id === item.productId)?.variants
                      ?.length ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Variant identity not recorded in this legacy sample order.
                    </p>
                  ) : null}
                  <p className="text-xs text-muted">
                    Qty: {item.qty} · {money(item.price)} each
                  </p>
                </div>
                <strong>{money(item.qty * item.price)}</strong>
              </div>
            ))}
            <div className="mt-3 flex justify-between font-black">
              <span>Order subtotal</span>
              <span>{money(orderTotal(order))}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Product-only sample total. Taxes and shipping are not charged.
            </p>
          </section>
          <section className={boxStyle} aria-label="Fulfillment workflow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold">
                <PackageCheck size={17} /> Fulfillment
              </h3>
              <Badge kind={statusKind(order.status)}>{order.status}</Badge>
            </div>
            <label className="mt-4 block text-sm font-semibold">
              Fulfillment status
              <select
                aria-label="Change order status"
                className={controlClass + ' mt-2'}
                value={order.status}
                onChange={(e) =>
                  outcome(
                    advance(order.id, e.target.value as OrderStatus),
                    'Fulfillment status updated in this browser.',
                    'This status transition is not permitted.',
                  )
                }
              >
                {statusOptions(order.status).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs text-muted">
              Allowed progression: Pending → Processing → Shipped → Delivered.
              Terminal states cannot be reversed.
            </p>
            {canCancelOrder(order) && (
              <div className="mt-4 border-t border-line pt-4">
                {!showCancel ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancel(true)}
                  >
                    Cancel order
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold">
                      Cancellation reason
                      <textarea
                        aria-label="Cancellation reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className={controlClass + ' mt-2 min-h-20 py-2'}
                        placeholder="Explain the cancellation"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const ok = cancelOrder(order.id, cancelReason)
                          outcome(
                            ok,
                            'Cancellation recorded in local preview.',
                            'Enter a cancellation reason of at least 5 characters.',
                          )
                          if (ok) setShowCancel(false)
                        }}
                      >
                        Confirm cancellation
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowCancel(false)
                          setError('')
                        }}
                      >
                        Keep order
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {order.cancellationReason && (
              <p className="mt-3 text-sm text-red-700">
                <strong>Cancellation reason:</strong> {order.cancellationReason}
              </p>
            )}
          </section>
          {(canSaveShipment(order) || order.shipment) && (
            <section className={boxStyle} aria-label="Shipment management">
              <h3 className="flex items-center gap-2 font-bold">
                <Truck size={17} /> Shipment details
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Carrier
                  <input
                    aria-label="Carrier"
                    className={controlClass + ' mt-1.5'}
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g. Global Parcel"
                    disabled={!canSaveShipment(order)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Tracking number
                  <input
                    aria-label="Tracking number"
                    className={controlClass + ' mt-1.5'}
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="e.g. INT-12345"
                    disabled={!canSaveShipment(order)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Service (optional)
                  <input
                    aria-label="Shipping service"
                    className={controlClass + ' mt-1.5'}
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="Standard"
                    disabled={!canSaveShipment(order)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Estimated delivery (optional)
                  <input
                    aria-label="Estimated delivery"
                    type="date"
                    className={controlClass + ' mt-1.5'}
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    disabled={!canSaveShipment(order)}
                  />
                </label>
              </div>
              {canSaveShipment(order) && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() =>
                    outcome(
                      saveShipment(order.id, {
                        carrier,
                        trackingNumber: tracking,
                        service,
                        estimatedDelivery: eta,
                      }),
                      'Shipment preview saved. Status is Shipped.',
                      'Carrier and tracking number are required.',
                    )
                  }
                >
                  Save shipment
                </Button>
              )}
              {order.shipment && (
                <p className="mt-3 text-xs text-muted">
                  Saved preview: {order.shipment.carrier} ·{' '}
                  {order.shipment.trackingNumber}
                </p>
              )}
            </section>
          )}
          <section className={boxStyle} aria-label="Returns and refunds">
            <h3 className="flex items-center gap-2 font-bold">
              <RotateCcw size={17} /> Returns & refunds
            </h3>
            {canRequestReturn(order) && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-semibold">
                  Return reason
                  <textarea
                    aria-label="Return reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className={controlClass + ' mt-2 min-h-20 py-2'}
                    placeholder="Reason for requesting a return"
                  />
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    outcome(
                      requestReturn(order.id, returnReason),
                      'Return request created in local preview.',
                      'Enter a return reason of at least 5 characters.',
                    )
                  }
                >
                  Request return
                </Button>
              </div>
            )}
            {order.returnRequest && (
              <div className="mt-3 space-y-3 text-sm">
                <p>
                  <strong>Return status:</strong>{' '}
                  <Badge
                    kind={
                      order.returnRequest.status === 'Approved'
                        ? 'success'
                        : order.returnRequest.status === 'Rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {order.returnRequest.status}
                  </Badge>
                </p>
                <p className="text-muted">
                  Reason: {order.returnRequest.reason}
                </p>
                {canDecideReturn(order) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        outcome(
                          decideReturn(order.id, 'Approved'),
                          'Return approved for preview.',
                          'Return cannot be approved.',
                        )
                      }
                    >
                      Approve return
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        outcome(
                          decideReturn(order.id, 'Rejected'),
                          'Return rejected for preview.',
                          'Return cannot be rejected.',
                        )
                      }
                    >
                      Reject return
                    </Button>
                  </div>
                )}
              </div>
            )}
            {canRecordRefund(order) && (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <p className="text-sm font-semibold">
                  Remaining refundable: {money(remainingRefundable(order))}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Refund amount (USD)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      aria-label="Refund amount (USD)"
                      value={refundValue}
                      onChange={(e) => setRefundValue(e.target.value)}
                      className={controlClass + ' mt-1.5'}
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Refund note
                    <input
                      aria-label="Refund note"
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      className={controlClass + ' mt-1.5'}
                      placeholder="Reason for refund"
                    />
                  </label>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={remainingRefundable(order) <= 0}
                  onClick={() => {
                    const ok = recordRefund(
                      order.id,
                      Number(refundValue),
                      refundNote,
                    )
                    outcome(
                      ok,
                      'Refund noted locally. No Stripe transaction was performed.',
                      'Refund requires a valid amount within the remaining balance and a note.',
                    )
                    if (ok) {
                      setRefundValue('')
                      setRefundNote('')
                    }
                  }}
                >
                  Record preview refund
                </Button>
              </div>
            )}
            {!!order.refunds?.length && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-sm font-bold">
                  Recorded preview refunds: {money(refundedTotal(order))}
                </p>
                {order.refunds.map((item) => (
                  <p className="mt-2 text-xs text-muted" key={item.id}>
                    {shortDate(item.at)} · {money(item.amount)} · {item.note}
                  </p>
                ))}
              </div>
            )}
            {!order.returnRequest && !canRequestReturn(order) && (
              <p className="mt-3 flex gap-2 text-xs text-muted">
                <AlertTriangle size={15} /> Return requests are available for
                delivered orders only.
              </p>
            )}
          </section>
          <section className={boxStyle} aria-label="Order activity timeline">
            <h3 className="font-bold">Activity timeline</h3>
            <ol className="mt-3 space-y-3">
              {timelineFor(order).map((event) => (
                <li
                  key={event.id}
                  className="border-l-2 border-blue-200 py-1 pl-4 text-sm"
                >
                  <p className="font-bold">{event.title}</p>
                  <p className="text-xs text-muted">
                    {shortDate(event.at)} · {event.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
