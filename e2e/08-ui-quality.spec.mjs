import { test, expect } from '@playwright/test'
import { go, click, fill, action } from './helpers.mjs'

test('quick navigation keyboard shortcut opens searchable sections', async ({
  page,
}) => {
  await go(page, '/dashboard', 'Open dashboard for quick navigation')
  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await skip.focus()
  await action(page, 'Skip directly to main content', () => skip.press('Enter'))
  await expect(page.locator('#main-content')).toBeFocused()
  await action(page, 'Open quick navigation with Ctrl+K', () =>
    page.keyboard.press('Control+k'),
  )
  const dialog = page.getByRole('dialog', { name: 'Jump to section' })
  await expect(dialog).toBeVisible()
  const search = dialog.getByRole('combobox', { name: 'Find an admin page' })
  await expect(search).toBeFocused()
  await fill(page, search, 'inventory', 'Search inventory')
  await expect(dialog.getByRole('option', { name: 'Inventory' })).toBeVisible()
  await action(page, 'Select inventory using Enter', () =>
    search.press('Enter'),
  )
  await expect(page).toHaveURL(/\/inventory$/)
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible()
})

test('quick navigation arrow keys, empty search and Escape are accessible', async ({
  page,
}) => {
  await go(page, '/dashboard', 'Open workspace')
  await click(
    page,
    page.getByRole('button', { name: 'Jump to section' }),
    'Open quick navigation',
  )
  const dialog = page.getByRole('dialog', { name: 'Jump to section' })
  const search = dialog.getByRole('combobox', { name: 'Find an admin page' })
  await fill(page, search, 'not-a-real-admin-page', 'Search unknown section')
  await expect(dialog.getByRole('status')).toContainText('No matching sections')
  await fill(page, search, 'store', 'Find store sections')
  await expect(dialog.getByRole('option')).toHaveCount(2)
  await action(page, 'Move to second result', () => search.press('ArrowDown'))
  await expect(
    dialog.getByRole('option', { name: 'Store settings' }),
  ).toHaveAttribute('aria-selected', 'true')
  await action(page, 'Close quick navigation with Escape', () =>
    search.press('Escape'),
  )
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Jump to section' }),
  ).toBeFocused()
})

test('mobile navigation traps focus, closes with Escape and restores focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 760 })
  await go(page, '/dashboard', 'Open mobile dashboard')
  const trigger = page.getByRole('button', { name: 'Open navigation' })
  await click(page, trigger, 'Open mobile navigation')
  const dialog = page.getByRole('dialog', { name: 'Admin navigation' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('link', { name: 'Customers', exact: true }),
  ).toBeVisible()
  await action(page, 'Close mobile navigation with Escape', () =>
    page.keyboard.press('Escape'),
  )
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await click(page, trigger, 'Reopen mobile navigation')
  await click(
    page,
    dialog.getByRole('link', { name: 'Products', exact: true }),
    'Navigate to products',
  )
  await expect(page).toHaveURL(/\/products$/)
  await expect(dialog).toHaveCount(0)
})

test('report tabs support arrow, Home and End keyboard navigation', async ({
  page,
}) => {
  await go(page, '/reports', 'Open reports')
  const sales = page.getByRole('tab', { name: 'Sales & orders' })
  await sales.focus()
  await action(page, 'Move to product report with ArrowRight', () =>
    sales.press('ArrowRight'),
  )
  const products = page.getByRole('tab', { name: 'Product performance' })
  await expect(products).toHaveAttribute('aria-selected', 'true')
  await expect(products).toBeFocused()
  await action(page, 'Move to final report with End', () =>
    products.press('End'),
  )
  const customers = page.getByRole('tab', { name: 'Customers' })
  await expect(customers).toHaveAttribute('aria-selected', 'true')
  await action(page, 'Return to first report with Home', () =>
    customers.press('Home'),
  )
  await expect(sales).toHaveAttribute('aria-selected', 'true')
  await expect(sales).toBeFocused()
})

test('small screen keeps modal and scrollable product table keyboard reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 680 })
  await go(page, '/products', 'Open products at 320px')
  const region = page.getByRole('region', { name: /Products table/ })
  await expect(region).toBeVisible()
  await action(page, 'Focus horizontally scrollable table', () =>
    region.focus(),
  )
  await expect(region).toBeFocused()
  await click(
    page,
    page.getByRole('button', { name: 'Add product' }),
    'Open product editor',
  )
  const dialog = page.getByRole('dialog', { name: 'Add a new product' })
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(321)
  await action(page, 'Close editor with Escape', () =>
    page.keyboard.press('Escape'),
  )
  await expect(dialog).toHaveCount(0)
})
