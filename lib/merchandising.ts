import type {
  Category,
  Product,
  Promotion,
  Campaign,
  StoreBanner,
  FeaturedCollection,
} from './types'
import { mediaUrlIsSafe } from './catalog'

export const couponCode = (code: string) => code.trim().toUpperCase()
export const campaignSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const validDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const value = new Date(`${date}T00:00:00Z`)
  return (
    !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date
  )
}
export const validWindow = (from: string, to: string) =>
  (!from || validDate(from)) &&
  (!to || validDate(to)) &&
  (!from || !to || from <= to)

export function promotionError(
  input: Promotion,
  others: Promotion[],
  categories: Category[],
): string | null {
  const code = couponCode(input.code)
  if (!/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code))
    return 'Code must be 3–24 letters, numbers, underscores or hyphens.'
  if (
    others.some(
      (other) => other.id !== input.id && couponCode(other.code) === code,
    )
  )
    return 'Coupon code already exists.'
  if (
    !Number.isFinite(input.value) ||
    input.value <= 0 ||
    (input.kind === 'percent' && input.value > 100)
  )
    return 'Enter a valid percentage (1–100) or fixed USD amount.'
  if (input.kind !== 'percent' && input.kind !== 'fixed')
    return 'Choose a valid discount type.'
  if (
    !Number.isFinite(input.minimumUsd) ||
    input.minimumUsd < 0 ||
    !Number.isFinite(input.capUsd) ||
    input.capUsd < 0
  )
    return 'Minimum and discount cap cannot be negative.'
  if (!Number.isInteger(input.limit) || input.limit < 0)
    return 'Usage limit must be a whole number or zero for unlimited.'
  if (!validWindow(input.startDate, input.endDate))
    return 'Check the start and end dates.'
  if (
    input.scope === 'category' &&
    !categories.some((category) => category.id === input.categoryId)
  )
    return 'Select an existing category.'
  if (!['all', 'category'].includes(input.scope))
    return 'Choose a valid discount scope.'
  return null
}
export function campaignError(
  input: Campaign,
  others: Campaign[],
): string | null {
  if (input.title.trim().length < 3)
    return 'Campaign name must be at least three characters.'
  const slug = campaignSlug(input.title)
  if (!slug || others.some((c) => c.id !== input.id && c.slug === slug))
    return 'Campaign name must produce a unique slug.'
  if (!validWindow(input.startDate, input.endDate))
    return 'Check the campaign date range.'
  if (!['Draft', 'Scheduled', 'Active', 'Paused'].includes(input.status))
    return 'Choose a valid campaign status.'
  if (
    (input.status === 'Scheduled' || input.status === 'Active') &&
    (!input.startDate || !input.endDate)
  )
    return 'Scheduled and active campaigns require both dates.'
  return null
}
export const internalDestination = (value: string) =>
  /^\/(?:$|[a-z0-9/_?=&%#.-]*$)/i.test(value) &&
  !value.startsWith('//') &&
  !value.includes('..')
export function bannerError(input: StoreBanner): string | null {
  if (input.headline.trim().length < 3 || input.ctaText.trim().length < 2)
    return 'Add a headline and CTA label.'
  if (!internalDestination(input.ctaHref))
    return 'CTA must be a safe internal store path such as /shop.'
  if (input.imageUrl.trim() && !mediaUrlIsSafe(input.imageUrl))
    return 'Use a local image path or HTTPS image reference.'
  if (
    !Number.isInteger(input.position) ||
    input.position < 1 ||
    input.position > 99
  )
    return 'Position must be between 1 and 99.'
  return null
}
export function collectionError(
  input: FeaturedCollection,
  products: Product[],
  others: FeaturedCollection[],
): string | null {
  if (input.title.trim().length < 3)
    return 'Collection title must be at least three characters.'
  if (!campaignSlug(input.title)) return 'Collection title is invalid.'
  if (
    others.some(
      (other) =>
        other.id !== input.id &&
        other.title.trim().toLowerCase() === input.title.trim().toLowerCase(),
    )
  )
    return 'Collection title already exists.'
  if (
    !Number.isInteger(input.position) ||
    input.position < 1 ||
    input.position > 99
  )
    return 'Position must be between 1 and 99.'
  if (!input.productIds.length) return 'Select at least one product.'
  if (
    new Set(input.productIds).size !== input.productIds.length ||
    input.productIds.some((id) => !products.some((p) => p.id === id))
  )
    return 'Collection has missing or duplicate products.'
  return null
}
export function previewDiscount(coupon: Promotion, subtotal: number): number {
  if (
    !coupon.enabled ||
    !Number.isFinite(subtotal) ||
    subtotal < coupon.minimumUsd
  )
    return 0
  const raw =
    coupon.kind === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
  return (
    Math.round(Math.min(raw, coupon.capUsd || Infinity, subtotal) * 100) / 100
  )
}
