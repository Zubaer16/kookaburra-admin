import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('create a product with size/color variant SKUs and image reference', async ({
  page,
}) => {
  await go(page, '/products', 'Open products')
  await click(
    page,
    page.getByRole('button', { name: 'Add product' }),
    'Start product creation',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product name' }),
    'Trail Everyday Hoodie',
    'Enter name',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'SKU', exact: true }),
    'FS-TRAIL-900',
    'Enter base SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Price (USD)' }),
    '64',
    'Enter USD price',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add variant' }),
    'Create a size/color variant',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Size 1' }),
    'M',
    'Enter variant size',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Color 1' }),
    'Navy',
    'Enter variant color',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Variant SKU 1' }),
    'FS-TRAIL-900-NVY-M',
    'Enter unique variant SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Variant stock 1' }),
    '4',
    'Enter variant stock',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add image' }),
    'Add product image',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Image URL 1' }),
    'https://example.com/hoodie.jpg',
    'Enter HTTPS reference',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Image alt text 1' }),
    'Navy hoodie front',
    'Describe image',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create product' }),
    'Save preview product',
  )
  await expect(page.getByText('Trail Everyday Hoodie')).toBeVisible()
  await click(
    page,
    page.getByRole('button', { name: 'Variants for Trail Everyday Hoodie' }),
    'Inspect saved variants',
  )
  await expect(page.getByText('FS-TRAIL-900-NVY-M')).toBeVisible()
  await expect(page.getByText(/1 image references/)).toBeVisible()
  await go(page, '/inventory', 'Open inventory')
  const row = page.getByRole('row', { name: /Trail Everyday Hoodie/ })
  await expect(row).toContainText('4')
  await click(
    page,
    row.getByRole('button', { name: 'Adjust' }),
    'Adjust variant stock',
  )
  await expect(
    page.getByRole('combobox', { name: 'Stock variant' }),
  ).toContainText('FS-TRAIL-900-NVY-M')
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Quantity change' }),
    '2',
    'Receive two units',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save adjustment' }),
    'Save variant adjustment',
  )
  await expect(row).toContainText('6')
})

test('duplicate variant SKU and duplicate color/size are rejected', async ({
  page,
}) => {
  await go(page, '/products', 'Open products')
  await click(
    page,
    page.getByRole('button', { name: 'Add product' }),
    'Open form',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Product name' }),
    'Another Product',
    'Set product name',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'SKU', exact: true }),
    'EL-SNC-101',
    'Use existing SKU',
  )
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Price (USD)' }),
    '20',
    'Set price',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create product' }),
    'Attempt duplicate SKU',
  )
  await expect(page.getByRole('alert')).toContainText('already used')
  await fill(
    page,
    page.getByRole('textbox', { name: 'SKU', exact: true }),
    'TEST-BASE-200',
    'Set unique SKU',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add variant' }),
    'Add first variant',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Size 1' }),
    'L',
    'Set size',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Color 1' }),
    'Black',
    'Set color',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Variant SKU 1' }),
    'TEST-VAR-200',
    'Set variant SKU',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add variant' }),
    'Add second variant',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Size 2' }),
    'L',
    'Repeat size',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Color 2' }),
    'Black',
    'Repeat color',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Variant SKU 2' }),
    'TEST-VAR-201',
    'Set different SKU',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create product' }),
    'Attempt duplicate combination',
  )
  await expect(page.getByRole('alert')).toContainText(
    'Duplicate size and color',
  )
})

test('nested categories protect parent deletion and support editing', async ({
  page,
}) => {
  await go(page, '/categories', 'Open category management')
  await click(
    page,
    page.getByRole('button', { name: 'Add category' }),
    'Add parent',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Category name' }),
    'Outdoor & Travel',
    'Enter parent name',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create category' }),
    'Create parent category',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add category' }),
    'Create subcategory',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Category name' }),
    'Camping Gear',
    'Enter child name',
  )
  await select(
    page,
    page.getByRole('combobox', { name: 'Parent category' }),
    { label: 'Outdoor & Travel' },
    'Choose parent',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Create category' }),
    'Save subcategory',
  )
  await expect(
    page.getByRole('heading', { name: 'Camping Gear' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Delete Outdoor & Travel' }),
  ).toBeDisabled()
  await click(
    page,
    page.getByRole('button', { name: 'Edit category Camping Gear' }),
    'Edit child',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Category name' }),
    'Camping Essentials',
    'Rename child',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save category' }),
    'Save renamed category',
  )
  await expect(
    page.getByRole('heading', { name: 'Camping Essentials' }),
  ).toBeVisible()
})
