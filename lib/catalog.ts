import type { Category, Product, ProductInput } from './types'

export function stockOf(product: Product): number {
  return product.variants?.length
    ? product.variants.reduce((total, variant) => total + variant.stock, 0)
    : product.stock
}
export function mediaUrlIsSafe(value: string): boolean {
  const url = value.trim()
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\'))
    return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !!parsed.hostname
  } catch {
    return false
  }
}
export function categoryPath(
  categoryId: string,
  categories: Category[],
): string {
  const parts: string[] = []
  const seen = new Set<string>()
  let current = categories.find((c) => c.id === categoryId)
  while (current && !seen.has(current.id)) {
    parts.unshift(current.name)
    seen.add(current.id)
    current = categories.find((c) => c.id === current?.parentId)
  }
  return parts.join(' / ') || 'Uncategorized'
}
export function categoryParentWouldCycle(
  categoryId: string,
  parentId: string | undefined,
  categories: Category[],
): boolean {
  if (!parentId) return false
  const seen = new Set([categoryId])
  let cursor: string | undefined = parentId
  while (cursor) {
    if (seen.has(cursor)) return true
    seen.add(cursor)
    cursor = categories.find((c) => c.id === cursor)?.parentId ?? undefined
  }
  return false
}
export function productValidationError(
  input: ProductInput,
  products: Product[],
  editingId?: string,
): string | null {
  if (
    !input.name.trim() ||
    !input.sku.trim() ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isInteger(input.stock) ||
    input.stock < 0 ||
    !input.categoryId
  )
    return 'Enter a product name, base SKU, category, positive price and valid stock.'
  const used = new Set<string>()
  for (const product of products) {
    if (product.id === editingId) continue
    used.add(product.sku.trim().toLowerCase())
    for (const variant of product.variants ?? [])
      used.add(variant.sku.trim().toLowerCase())
  }
  const baseSku = input.sku.trim().toLowerCase()
  if (used.has(baseSku))
    return 'This SKU is already used by another product or variant.'
  used.add(baseSku)
  const combinations = new Set<string>()
  for (const variant of input.variants ?? []) {
    if (
      !variant.sku.trim() ||
      !variant.color.trim() ||
      !variant.size.trim() ||
      !Number.isInteger(variant.stock) ||
      variant.stock < 0
    )
      return 'Every variant needs a SKU, size, color and valid stock quantity.'
    const sku = variant.sku.trim().toLowerCase()
    if (used.has(sku)) return 'Every base and variant SKU must be unique.'
    used.add(sku)
    const signature = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`
    if (combinations.has(signature))
      return 'Duplicate size and color combination.'
    combinations.add(signature)
  }
  if ((input.images ?? []).length > 6)
    return 'A product can have up to six image references.'
  if (
    (input.images ?? []).some(
      (image) => !mediaUrlIsSafe(image.url) || !image.alt.trim(),
    )
  )
    return 'Images require a safe HTTPS or local URL and descriptive alt text.'
  return null
}
