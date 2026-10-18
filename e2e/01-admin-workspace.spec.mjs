import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('dashboard displays preview insights and navigation', async ({ page }) => {
  await go(page, '/dashboard', 'Open dashboard')
  await expect(
    page.getByRole('heading', { name: 'Good to see you again.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Recent orders' }),
  ).toBeVisible()
  await click(
    page,
    page.getByRole('link', { name: 'Products', exact: true }).first(),
    'Open products',
  )
  await expect(
    page.getByRole('heading', { name: 'Products', exact: true }),
  ).toBeVisible()
})

test('create, edit and remove a product in local preview', async ({ page }) => {
  await go(page, '/products', 'Open product management')
  await click(
    page,
    page.getByRole('button', { name: 'Add product' }),
    'Open add product',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product name' }),
    'Test Trail Backpack',
    'Enter product name',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'SKU' }),
    'TS-TRAIL-001',
    'Enter SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Price (USD)' }),
    '47',
    'Enter USD price',
  )
  await select(
    page,
    page.getByRole('combobox', { name: 'Publishing status' }),
    'Active',
    'Activate preview product',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create product' }),
    'Save new product',
  )
  await expect(page.getByText('Test Trail Backpack')).toBeVisible()
  await click(
    page,
    page.getByRole('button', { name: 'Edit Test Trail Backpack' }),
    'Edit product',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product name' }),
    'Test Trail Backpack Plus',
    'Rename product',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save changes' }),
    'Save changes',
  )
  await expect(page.getByText('Test Trail Backpack Plus')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await click(
    page,
    page.getByRole('button', { name: 'Delete Test Trail Backpack Plus' }),
    'Delete preview product',
  )
  await expect(page.getByText('Test Trail Backpack Plus')).toHaveCount(0)
})

test('add and remove a product-free category', async ({ page }) => {
  await go(page, '/categories', 'Open categories')
  await click(
    page,
    page.getByRole('button', { name: 'Add category' }),
    'Open category form',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Category name' }),
    'Outdoor & Travel',
    'Set category name',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create category' }),
    'Create category',
  )
  await expect(
    page.getByRole('heading', { name: 'Outdoor & Travel' }),
  ).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await click(
    page,
    page.getByRole('button', { name: 'Delete Outdoor & Travel' }),
    'Delete unused category',
  )
  await expect(
    page.getByRole('heading', { name: 'Outdoor & Travel' }),
  ).toHaveCount(0)
})

test('inventory adjustment updates product stock', async ({ page }) => {
  await go(page, '/inventory', 'Open stock control')
  const row = page.getByRole('row', { name: /Dew Hydrating Face Serum/ })
  await expect(row).toContainText('6')
  await click(
    page,
    row.getByRole('button', { name: 'Adjust' }),
    'Open stock adjustment',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Quantity change' }),
    '5',
    'Receive five units',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Reason' }),
    'Delivery received',
    'Record adjustment reason',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save adjustment' }),
    'Save stock',
  )
  await expect(row).toContainText('11')
})

test('order preview allows status review and update', async ({ page }) => {
  await go(page, '/orders', 'Open orders')
  const row = page.getByRole('row', { name: /KB-1047/ })
  await click(
    page,
    row.getByRole('button', { name: 'View' }),
    'Open sample order',
  )
  await expect(page.getByRole('dialog')).toContainText(
    'Motion Everyday Sneakers',
  )
  await select(
    page,
    page.getByRole('combobox', { name: 'Change order status' }),
    'Shipped',
    'Mark shipped in preview',
  )
  await click(page, page.getByRole('button', { name: 'Done' }), 'Close order')
  await expect(row).toContainText('Shipped')
})

test('responsive mobile menu can open customers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 })
  await go(page, '/dashboard', 'Open mobile admin')
  await click(
    page,
    page.getByRole('button', { name: 'Open navigation' }),
    'Open mobile menu',
  )
  await click(
    page,
    page.getByRole('link', { name: 'Customers', exact: true }),
    'Open customers',
  )
  await expect(
    page.getByRole('heading', { name: 'Customers', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Olivia Bennett')).toBeVisible()
})
