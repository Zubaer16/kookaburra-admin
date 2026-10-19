import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('compatibility page audits fixture IDs without silently rewriting product prices', async ({
  page,
}) => {
  await go(page, '/alignment', 'Open compatibility review')
  await expect(
    page.getByRole('heading', { name: 'Compatibility review' }),
  ).toBeVisible()
  await expect(page.getByText('Sonic Studio Wireless Headphones')).toBeVisible()
  await expect(page.getByText('p-headphones', { exact: false })).toBeVisible()
  await expect(
    page.getByText('No approved Admin mapping').first(),
  ).toBeVisible()
  await expect(page.getByTestId('draft-api-projection')).toContainText(
    'amountMinor',
  )
  await expect(page.getByTestId('draft-api-projection')).toContainText('p-101')
})

test('missing Lifestyle category can be added locally without replacing existing categories', async ({
  page,
}) => {
  await go(page, '/alignment', 'Open category alignment')
  const action = page.getByRole('button', { name: 'Add Lifestyle locally' })
  await expect(action).toBeVisible()
  await click(page, action, 'Create missing Lifestyle category')
  await expect(page.getByTestId('alignment-categories')).toContainText(
    'Lifestyle',
  )
  await expect(
    page.getByRole('button', { name: 'Add Lifestyle locally' }),
  ).toHaveCount(0)
  await go(page, '/categories', 'Check added category')
  await expect(page.getByText('Lifestyle', { exact: true })).toBeVisible()
})

test('product editor supports color-only variant and storefront editorial metadata', async ({
  page,
}) => {
  await go(page, '/products', 'Open product catalog')
  await click(
    page,
    page.getByRole('button', { name: 'Add product' }),
    'Open new product editor',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product name', exact: true }),
    'Patch Nine Tote',
    'Enter product title',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'SKU', exact: true }),
    'TEST-P09-TOTE',
    'Enter base SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Price (USD)', exact: true }),
    '22',
    'Set selling price',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product URL slug' }),
    'patch-nine-tote',
    'Set URL slug',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Compare-at price (USD)' }),
    '32',
    'Set original price',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Storefront description' }),
    'Preview only color variant',
    'Describe product',
  )
  await select(
    page,
    page.getByRole('combobox', { name: 'Product tag' }),
    'new',
    'Choose new tag',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add variant' }),
    'Add color-only option',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Color 1' }),
    'Natural',
    'Enter color',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Variant SKU 1' }),
    'TEST-P09-TOTE-NAT',
    'Set unique variant SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Variant stock 1' }),
    '5',
    'Set stock',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create product' }),
    'Save color-only product',
  )
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Patch Nine Tote', { exact: true })).toBeVisible()
  await go(page, '/alignment', 'Inspect draft DTO')
  await select(
    page,
    page.getByRole('combobox', { name: 'Inspect Admin product' }),
    { label: 'Patch Nine Tote' },
    'Choose new product',
  )
  const dto = page.getByTestId('draft-api-projection')
  await expect(dto).toContainText('patch-nine-tote')
  await expect(dto).toContainText('Natural')
  await expect(dto).toContainText('2200')
  await expect(dto).not.toContainText('"size"')
})

test('legacy sneaker order flags unresolved variant without inventing size', async ({
  page,
}) => {
  await go(page, '/orders', 'Open sample orders for contract review')
  await click(
    page,
    page
      .getByRole('row', { name: /KB-1047/ })
      .getByRole('button', { name: 'View' }),
    'Open sneaker order',
  )
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByText(
      'Variant identity not recorded in this legacy sample order.',
    ),
  ).toBeVisible()
  await expect(dialog.getByText('Motion Everyday Sneakers')).toBeVisible()
})
