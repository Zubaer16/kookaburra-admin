import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('coupon creation validates duplicates and persists a USD discount preview', async ({
  page,
}) => {
  await go(page, '/promotions', 'Open promotions')
  await expect(page.getByText('WELCOME10')).toBeVisible()
  await click(
    page,
    page.getByRole('button', { name: 'Add coupon' }),
    'Open coupon editor',
  )
  const dialog = page.getByRole('dialog')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Coupon code' }),
    'WELCOME10',
    'Try existing code',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save coupon' }),
    'Validate duplicate',
  )
  await expect(dialog.getByRole('alert')).toContainText('already exists')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Coupon code' }),
    'FRESH20',
    'Set unique coupon code',
  )
  await fill(
    page,
    dialog.getByRole('spinbutton', { name: 'Discount (%)' }),
    '20',
    'Set twenty percent',
  )
  await fill(
    page,
    dialog.getByRole('spinbutton', { name: 'Minimum order (USD)' }),
    '50',
    'Set minimum order',
  )
  await fill(
    page,
    dialog.getByRole('spinbutton', { name: 'Maximum discount (USD)' }),
    '12',
    'Set capped discount',
  )
  await click(
    page,
    dialog.getByRole('checkbox', { name: 'Enabled in local preview' }),
    'Enable preview coupon',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save coupon' }),
    'Save new coupon',
  )
  await expect(page.getByText('FRESH20')).toBeVisible()
  await expect(page.getByTestId('saving-FRESH20')).toHaveText('$12.00')
  await fill(
    page,
    page.getByRole('spinbutton', { name: 'Sample subtotal USD' }),
    '40',
    'Check below-minimum subtotal',
  )
  await expect(page.getByTestId('saving-FRESH20')).toHaveText('$0.00')
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await expect(page.getByText('FRESH20')).toBeVisible()
})

test('campaign scheduling enforces dates and supports edit', async ({
  page,
}) => {
  await go(page, '/promotions', 'Open promotions')
  await click(
    page,
    page.getByRole('tab', { name: /Campaigns/ }),
    'Switch to campaigns',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add campaign' }),
    'Create campaign',
  )
  const dialog = page.getByRole('dialog')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Campaign name' }),
    'Holiday Specials',
    'Enter campaign name',
  )
  await select(
    page,
    dialog.getByRole('combobox', { name: 'Campaign status' }),
    'Scheduled',
    'Schedule campaign',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save campaign' }),
    'Check missing dates',
  )
  await expect(dialog.getByRole('alert')).toContainText('require both dates')
  await fill(page, dialog.getByLabel('Start date'), '2026-11-01', 'Start date')
  await fill(page, dialog.getByLabel('End date'), '2026-11-30', 'End date')
  await click(
    page,
    dialog.getByRole('button', { name: 'Save campaign' }),
    'Save scheduled campaign',
  )
  await expect(page.getByText('Holiday Specials')).toBeVisible()
  await click(
    page,
    page.getByRole('button', { name: 'Edit campaign Holiday Specials' }),
    'Edit campaign',
  )
  await select(
    page,
    page.getByRole('dialog').getByRole('combobox', { name: 'Campaign status' }),
    'Paused',
    'Pause campaign',
  )
  await click(
    page,
    page.getByRole('dialog').getByRole('button', { name: 'Save campaign' }),
    'Save campaign change',
  )
  await expect(page.getByText('Paused')).toBeVisible()
})

test('banner editor rejects external destination and keeps updated content', async ({
  page,
}) => {
  await go(page, '/content', 'Open store content')
  await click(
    page,
    page.getByRole('button', { name: 'Add banner' }),
    'Add hero banner',
  )
  const dialog = page.getByRole('dialog')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Banner headline' }),
    'New season arrivals',
    'Enter headline',
  )
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'CTA link' }),
    'https://example.org',
    'Try unsafe external CTA',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save banner' }),
    'Reject external CTA',
  )
  await expect(dialog.getByRole('alert')).toContainText('internal store path')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'CTA link' }),
    '/shop',
    'Set internal destination',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save banner' }),
    'Save banner',
  )
  await expect(page.getByText('New season arrivals')).toBeVisible()
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await expect(page.getByText('New season arrivals')).toBeVisible()
})

test('featured collection needs products and preserves selected items', async ({
  page,
}) => {
  await go(page, '/content', 'Open content')
  await click(
    page,
    page.getByRole('tab', { name: /Featured collections/ }),
    'Open collections',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Add collection' }),
    'Open collection editor',
  )
  const dialog = page.getByRole('dialog')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Collection title' }),
    'Weekend inspiration',
    'Name the collection',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save collection' }),
    'Validate empty selection',
  )
  await expect(dialog.getByRole('alert')).toContainText(
    'Select at least one product',
  )
  await click(
    page,
    dialog.getByRole('checkbox', { name: /Sonic Wireless Headphones/ }),
    'Select headphones',
  )
  await click(
    page,
    dialog.getByRole('checkbox', { name: /Motion Everyday Sneakers/ }),
    'Select sneakers',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save collection' }),
    'Save collection',
  )
  await expect(page.getByText('Weekend inspiration')).toBeVisible()
  await click(
    page,
    page.getByRole('button', { name: 'Edit collection Weekend inspiration' }),
    'Edit saved collection',
  )
  await expect(
    page
      .getByRole('dialog')
      .getByRole('checkbox', { name: /Sonic Wireless Headphones/ }),
  ).toBeChecked()
  await expect(
    page
      .getByRole('dialog')
      .getByRole('checkbox', { name: /Motion Everyday Sneakers/ }),
  ).toBeChecked()
})
