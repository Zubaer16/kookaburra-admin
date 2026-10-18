'use client'
import { useState, type FormEvent } from 'react'
import {
  Layers3,
  Plus,
  Trash2,
  Package,
  Edit3,
  CornerDownRight,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { categoryPath } from '@/lib/catalog'
import type { Category } from '@/lib/types'
import { PageHeading } from './page-heading'
import { Panel } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, controlClass } from '@/components/ui/field'

function CategoryForm({
  initial,
  close,
}: {
  initial?: Category
  close: () => void
}) {
  const categories = useAdminStore((s) => s.categories)
  const add = useAdminStore((s) => s.addCategory),
    update = useAdminStore((s) => s.updateCategory)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [parentId, setParentId] = useState(initial?.parentId ?? '')
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = initial
      ? update(initial.id, name, description, parentId)
      : add(name, description, parentId)
    if (!ok) {
      setError(
        'Check the name, duplicate slug and parent category. A category cannot be nested under itself.',
      )
      return
    }
    close()
  }
  return (
    <form className="space-y-4" onSubmit={submit} data-testid="category-form">
      <Field label="Category name">
        <input
          className={controlClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Outdoor & Travel"
        />
      </Field>
      <Field label="Description">
        <textarea
          className={controlClass + ' min-h-24 py-3'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description"
        />
      </Field>
      <Field
        label="Parent category"
        hint="Choose top level or nest under an existing category."
      >
        <select
          className={controlClass}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">Top level (no parent)</option>
          {categories
            .filter((c) => c.id !== initial?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {categoryPath(c.id, categories)}
              </option>
            ))}
        </select>
      </Field>
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
        <Button type="submit">
          {initial ? 'Save category' : 'Create category'}
        </Button>
      </div>
    </form>
  )
}
export function Categories() {
  const ready = useAdminReady(),
    categories = useAdminStore((s) => s.categories),
    products = useAdminStore((s) => s.products),
    promotions = useAdminStore((s) => s.promotions),
    remove = useAdminStore((s) => s.deleteCategory)
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Category | undefined>()
  function openForm(c?: Category) {
    setEditing(c)
    setOpen(true)
  }
  const sorted = [...categories].sort((a, b) =>
    categoryPath(a.id, categories).localeCompare(
      categoryPath(b.id, categories),
    ),
  )
  return (
    <>
      <PageHeading
        eyebrow="ORGANIZE YOUR STORE"
        title="Categories"
        description="Build a multi-level product catalog with parent categories and subcategories."
        action={
          <Button disabled={!ready} onClick={() => openForm()}>
            <Plus size={17} />
            Add category
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((c) => {
          const count = products.filter((p) => p.categoryId === c.id).length
          const children = categories.filter(
            (item) => item.parentId === c.id,
          ).length
          const linkedCoupons = promotions.filter(
            (p) => p.scope === 'category' && p.categoryId === c.id,
          ).length
          const canRemove = count === 0 && children === 0 && linkedCoupons === 0
          return (
            <Panel key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ background: c.color }}
                >
                  <Layers3 size={20} className="text-slate-700" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit category ${c.name}`}
                    onClick={() => openForm(c)}
                  >
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${c.name}`}
                    disabled={!canRemove}
                    title={
                      !canRemove
                        ? 'Remove linked products, subcategories and scoped coupons first'
                        : 'Delete category'
                    }
                    onClick={() => {
                      if (window.confirm(`Delete ${c.name}?`)) remove(c.id)
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <h2 className="mt-5 font-extrabold">{c.name}</h2>
              {c.parentId && (
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <CornerDownRight size={14} />
                  Under {categoryPath(c.parentId, categories)}
                </p>
              )}
              <p className="mt-2 min-h-9 text-xs leading-relaxed text-muted">
                {c.description || 'No description'}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs font-bold text-muted">
                <Package size={15} />
                {count} {count === 1 ? 'product' : 'products'}
                <span className="ml-auto">
                  {children} subcategories · {linkedCoupons} coupons
                </span>
              </div>
            </Panel>
          )
        })}
      </div>
      {open && (
        <Modal
          open={open}
          onOpenChange={setOpen}
          title={editing ? 'Edit category' : 'Create category'}
          description="Organize categories into a hierarchy. Changes are saved to this browser only."
        >
          <CategoryForm initial={editing} close={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
