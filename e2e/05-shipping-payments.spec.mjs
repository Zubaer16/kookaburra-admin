import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('shipping zone with international destination persists and changes local fee preview', async ({
  page,
}) => {
  await go(page, '/shipping', 'Open international shipping')
  await expect(page.getByTestId('preview-shipping')).toHaveText('$18.00')
  await click(
    page,
    page.getByRole('button', { name: 'Add shipping zone' }),
    'Open shipping zone editor',
  )
  const dialog = page.getByRole('dialog')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Shipping zone name' }),
    'Pacific shipping',
    'Name shipping zone',
  )
  await click(
    page,
    dialog.getByRole('checkbox', { name: 'Australia' }),
    'Assign Australia',
  )
  await fill(
    page,
    dialog.getByRole('spinbutton', { name: 'Standard flat fee (USD)' }),
    '22',
    'Set standard shipping fee',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save shipping zone' }),
    'Save delivery zone',
  )
  await expect(
    page.getByText('Pacific shipping', { exact: true }),
  ).toBeVisible()
  await select(
    page,
    page.getByRole('combobox', { name: 'Preview country' }),
    'Australia',
    'Preview Australia delivery',
  )
  await expect(page.getByTestId('matched-zone')).toHaveText('Pacific shipping')
  await expect(page.getByTestId('preview-shipping')).toHaveText('$22.00')
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await expect(
    page.getByText('Pacific shipping', { exact: true }),
  ).toBeVisible()
})

test('shipping zone editor prevents reused countries and supports free delivery threshold', async ({
  page,
}) => {
  await go(page, '/shipping', 'Open shipping zones')
  await click(
    page,
    page.getByRole('button', { name: 'Add shipping zone' }),
    'Open another shipping zone',
  )
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('checkbox', { name: 'Canada' })).toBeDisabled()
  await click(
    page,
    dialog.getByRole('button', { name: 'Cancel' }),
    'Close new zone editor',
  )
  await click(
    page,
    page.getByRole('button', {
      name: 'Edit shipping zone Core international destinations',
    }),
    'Edit core zone',
  )
  await fill(
    page,
    page
      .getByRole('dialog')
      .getByRole('spinbutton', { name: 'Standard free over (USD)' }),
    '100',
    'Set free delivery threshold',
  )
  await click(
    page,
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save shipping zone' }),
    'Save free delivery threshold',
  )
  await expect(page.getByTestId('preview-shipping')).toHaveText('$0.00')
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Sample subtotal (USD)' }),
    '50',
    'Check below threshold',
  )
  await expect(page.getByTestId('preview-shipping')).toHaveText('$18.00')
})

test('tax preview rule rejects duplicates and shows simulated tax only', async ({
  page,
}) => {
  await go(page, '/shipping', 'Open tax rules')
  await expect(page.getByTestId('preview-tax')).toHaveText('Not configured')
  await click(
    page,
    page.getByRole('tab', { name: 'Tax preview rules' }),
    'Open tax preview rules',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add tax preview rule' }),
    'Add illustrative rule',
  )
  const dialog = page.getByRole('dialog')
  await select(
    page,
    dialog.getByRole('combobox', { name: 'Tax destination' }),
    'United States',
    'Choose United States',
  )
  await fill(
    page,
    dialog.getByRole('spinbutton', { name: 'Illustrative tax percent' }),
    '7.5',
    'Set example percent',
  )
  await click(
    page,
    dialog.getByRole('checkbox', {
      name: 'Enable illustration in preview calculator',
    }),
    'Enable tax illustration',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save tax preview rule' }),
    'Save example tax',
  )
  await expect(page.getByTestId('preview-tax')).toHaveText('$11.25')
  await click(
    page,
    page.getByRole('button', { name: 'Add tax preview rule' }),
    'Attempt duplicate tax rule',
  )
  await select(
    page,
    page.getByRole('dialog').getByRole('combobox', { name: 'Tax destination' }),
    'United States',
    'Select duplicate destination',
  )
  await click(
    page,
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save tax preview rule' }),
    'Validate duplicate',
  )
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'already exists',
  )
})

test('payment report is clearly simulated, filterable and read-only', async ({
  page,
}) => {
  await go(page, '/payments', 'Open payment preview')
  await expect(
    page.getByRole('heading', { name: 'Payment reporting' }),
  ).toBeVisible()
  await expect(page.getByText('Not Stripe reporting.')).toBeVisible()
  await expect(page.getByTestId('payment-count')).toHaveText('6')
  await select(
    page,
    page.getByRole('combobox', { name: 'Payment status' }),
    'Failed',
    'Filter failed examples',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Search order or destination' }),
    'KB-1045',
    'Search sample order',
  )
  await expect(page.getByRole('row', { name: /KB-1045/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /KB-1048/ })).toHaveCount(0)
  await click(
    page,
    page.getByRole('button', { name: 'Inspect sample payment KB-1045' }),
    'Inspect example payment',
  )
  await expect(page.getByRole('dialog')).toContainText(
    'No payment provider data',
  )
  await click(
    page,
    page.getByRole('dialog').getByRole('button', { name: 'Close details' }),
    'Close example report',
  )
})
