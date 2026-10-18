'use client'
import { useState, type FormEvent } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import {
  categoryPath,
  mediaUrlIsSafe,
  productValidationError,
} from '@/lib/catalog'
import type {
  Product,
  ProductInput,
  ProductMedia,
  ProductVariant,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { controlClass, Field } from '@/components/ui/field'

const tempId = () => `new-${Math.random().toString(36).slice(2, 10)}`
export function ProductForm({
  initial,
  close,
}: {
  initial?: Product
  close: () => void
}) {
  const categories = useAdminStore((s) => s.categories)
  const products = useAdminStore((s) => s.products)
  const addProduct = useAdminStore((s) => s.addProduct)
  const editProduct = useAdminStore((s) => s.editProduct)
  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? '',
  )
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [stock, setStock] = useState(initial ? String(initial.stock) : '0')
  const [status, setStatus] = useState<'Active' | 'Draft'>(
    initial?.status ?? 'Draft',
  )
  const [variants, setVariants] = useState<ProductVariant[]>(
    initial?.variants?.map((v) => ({ ...v })) ?? [],
  )
  const [images, setImages] = useState<ProductMedia[]>(
    initial?.images?.map((i) => ({ ...i })) ?? [],
  )
  const [error, setError] = useState('')
  const variantStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
  function updateVariant(
    id: string,
    field: 'sku' | 'size' | 'color' | 'stock',
    value: string,
  ) {
    setVariants((items) =>
      items.map((item) =>
        item.id !== id
          ? item
          : { ...item, [field]: field === 'stock' ? Number(value) : value },
      ),
    )
  }
  function updateImage(id: string, field: 'url' | 'alt', value: string) {
    setImages((items) =>
      items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    )
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input: ProductInput = {
      name: name.trim(),
      sku: sku.trim(),
      categoryId,
      price: Number(price),
      stock: variants.length ? variantStock : Number(stock),
      status,
      color: initial?.color ?? '#e0eaff',
      variants,
      images,
    }
    const message = productValidationError(input, products, initial?.id)
    if (message) {
      setError(message)
      return
    }
    if (!categories.some((c) => c.id === categoryId)) {
      setError('Choose a valid category.')
      return
    }
    if (initial) editProduct(initial.id, input)
    else if (!addProduct(input)) {
      setError('The product could not be saved. Check the SKUs and try again.')
      return
    }
    close()
  }
  return (
    <form onSubmit={submit} className="space-y-5" data-testid="product-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <input
            className={controlClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Everyday Classic Hoodie"
          />
        </Field>
        <Field label="SKU">
          <input
            className={controlClass}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            placeholder="FS-HDY-120"
          />
        </Field>
        <Field label="Category">
          <select
            className={controlClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryPath(c.id, categories)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (USD)">
          <input
            className={controlClass}
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Stock quantity"
          hint={
            variants.length
              ? 'Calculated from variant stock.'
              : 'Total available stock for a product without variants.'
          }
        >
          <input
            className={controlClass}
            type="number"
            min="0"
            step="1"
            value={variants.length ? String(variantStock) : stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={variants.length > 0}
            required={!variants.length}
          />
        </Field>
        <Field label="Publishing status">
          <select
            value={status}
            className={controlClass}
            onChange={(e) => setStatus(e.target.value as 'Active' | 'Draft')}
          >
            <option>Draft</option>
            <option>Active</option>
          </select>
        </Field>
      </div>
      <section
        aria-label="Product variants"
        className="rounded-2xl border border-line bg-slate-50 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold">Product variants</h3>
            <p className="mt-1 text-xs text-muted">
              Size, color, SKU and available quantity per combination.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => {
              setVariants((v) => [
                ...v,
                { id: tempId(), sku: '', size: '', color: '', stock: 0 },
              ])
              setError('')
            }}
          >
            <Plus size={14} />
            Add variant
          </Button>
        </div>
        {variants.length ? (
          <div className="mt-4 space-y-3">
            {variants.map((v, index) => (
              <div
                key={v.id}
                className="grid gap-2 rounded-xl border border-line bg-white p-3 sm:grid-cols-[1fr_1fr_1.3fr_90px_auto] sm:items-end"
              >
                <Field label={`Size ${index + 1}`}>
                  <input
                    className={controlClass}
                    value={v.size}
                    placeholder="M / 42"
                    onChange={(e) =>
                      updateVariant(v.id, 'size', e.target.value)
                    }
                  />
                </Field>
                <Field label={`Color ${index + 1}`}>
                  <input
                    className={controlClass}
                    value={v.color}
                    placeholder="Black"
                    onChange={(e) =>
                      updateVariant(v.id, 'color', e.target.value)
                    }
                  />
                </Field>
                <Field label={`Variant SKU ${index + 1}`}>
                  <input
                    className={controlClass}
                    value={v.sku}
                    placeholder="SKU-BLK-M"
                    onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                  />
                </Field>
                <Field label={`Variant stock ${index + 1}`}>
                  <input
                    className={controlClass}
                    type="number"
                    min="0"
                    step="1"
                    value={v.stock}
                    onChange={(e) =>
                      updateVariant(v.id, 'stock', e.target.value)
                    }
                  />
                </Field>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="text-red-600"
                  aria-label={`Remove variant ${index + 1}`}
                  onClick={() =>
                    setVariants((items) => items.filter((i) => i.id !== v.id))
                  }
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted">
            No variants. This product uses a single base SKU and stock quantity.
          </p>
        )}
      </section>
      <section
        aria-label="Product images"
        className="rounded-2xl border border-line p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold">Product images</h3>
            <p className="mt-1 text-xs text-muted">
              Preview-only image references (HTTPS or local paths); uploads
              require a backend.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled={images.length >= 6}
            onClick={() =>
              setImages((list) => [...list, { id: tempId(), url: '', alt: '' }])
            }
          >
            <ImagePlus size={14} />
            Add image
          </Button>
        </div>
        {!!images.length && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="space-y-2 rounded-xl border border-line bg-slate-50 p-3"
              >
                {mediaUrlIsSafe(image.url) && (
                  <div
                    className="h-20 rounded-xl bg-cover bg-center"
                    role="img"
                    aria-label={image.alt || 'Image preview'}
                    style={{
                      backgroundImage: `url(${JSON.stringify(image.url)})`,
                    }}
                  />
                )}
                <Field label={`Image URL ${index + 1}`}>
                  <input
                    className={controlClass}
                    value={image.url}
                    placeholder="https://example.com/image.jpg"
                    onChange={(e) =>
                      updateImage(image.id, 'url', e.target.value)
                    }
                  />
                </Field>
                <Field label={`Image alt text ${index + 1}`}>
                  <input
                    className={controlClass}
                    value={image.alt}
                    placeholder="Front view"
                    onChange={(e) =>
                      updateImage(image.id, 'alt', e.target.value)
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() =>
                    setImages((list) => list.filter((i) => i.id !== image.id))
                  }
                >
                  <Trash2 size={13} />
                  Remove image
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">
          {initial ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  )
}
