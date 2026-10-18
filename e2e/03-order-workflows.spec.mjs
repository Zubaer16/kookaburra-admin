import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

const openOrder = async (page, id) => {
  await go(page, '/orders', `Open orders to inspect ${id}`)
  await click(
    page,
    page
      .getByRole('row', { name: new RegExp(id) })
      .getByRole('button', { name: 'View' }),
    `Open ${id}`,
  )
  return page.getByRole('dialog')
}

test('order fulfillment is forward-only and shipment tracking persists', async ({
  page,
}) => {
  const dialog = await openOrder(page, 'KB-1047')
  const picker = dialog.getByRole('combobox', { name: 'Change order status' })
  await expect(picker.locator('option[value="Pending"]')).toHaveCount(0)
  await select(page, picker, 'Shipped', 'Mark order shipped in preview')
  await expect(picker).toHaveValue('Shipped')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Carrier' }),
    'Global Parcel',
    'Enter sample carrier',
  )
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Tracking number' }),
    'GP-TEST-2047',
    'Enter sample tracking',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Save shipment' }),
    'Save shipment preview',
  )
  await expect(dialog.getByRole('status')).toContainText(
    'Shipment preview saved',
  )
  await expect(
    dialog.getByRole('region', { name: 'Order activity timeline' }),
  ).toContainText('GP-TEST-2047')
  await click(
    page,
    dialog.getByRole('button', { name: 'Done' }),
    'Close order details',
  )
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  const row = page.getByRole('row', { name: /KB-1047/ })
  await expect(row).toContainText('GP-TEST-2047')
  await click(
    page,
    row.getByRole('button', { name: 'View' }),
    'Reopen persisted order',
  )
  await expect(
    page.getByRole('dialog').getByRole('textbox', { name: 'Tracking number' }),
  ).toHaveValue('GP-TEST-2047')
})

test('pending cancellation requires a reason and is terminal', async ({
  page,
}) => {
  const dialog = await openOrder(page, 'KB-1045')
  await click(
    page,
    dialog.getByRole('button', { name: 'Cancel order' }),
    'Start cancellation',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Confirm cancellation' }),
    'Attempt cancellation without reason',
  )
  await expect(dialog.getByRole('alert')).toContainText('at least 5 characters')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Cancellation reason' }),
    'Customer requested cancellation',
    'Enter cancellation reason',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Confirm cancellation' }),
    'Record cancellation preview',
  )
  await expect(
    dialog.getByRole('combobox', { name: 'Change order status' }),
  ).toHaveValue('Cancelled')
  await expect(
    dialog.getByRole('button', { name: 'Cancel order' }),
  ).toHaveCount(0)
  await expect(
    dialog
      .getByRole('combobox', { name: 'Change order status' })
      .locator('option'),
  ).toHaveCount(1)
  await expect(
    dialog.getByRole('region', { name: 'Order activity timeline' }),
  ).toContainText('Customer requested cancellation')
})

test('delivered order supports return approval and capped preview refunds', async ({
  page,
}) => {
  const dialog = await openOrder(page, 'KB-1048')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Return reason' }),
    'Product does not meet expectations',
    'Describe return',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Request return' }),
    'Create return preview',
  )
  await expect(dialog.getByText('Requested', { exact: true })).toBeVisible()
  await click(
    page,
    dialog.getByRole('button', { name: 'Approve return' }),
    'Approve preview return',
  )
  await expect(dialog.getByText('Approved', { exact: true })).toBeVisible()
  const refund = dialog.getByRole('spinbutton', { name: 'Refund amount (USD)' })
  await fill(page, refund, '115', 'Attempt over-limit refund')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Refund note' }),
    'Over limit attempt',
    'Enter refund note',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Record preview refund' }),
    'Reject excessive refund',
  )
  await expect(dialog.getByRole('alert')).toContainText('remaining balance')
  await fill(page, refund, '50', 'Enter partial refund')
  await click(
    page,
    dialog.getByRole('button', { name: 'Record preview refund' }),
    'Record local partial refund',
  )
  await expect(
    dialog.getByText(/Recorded preview refunds: \$50\.00/),
  ).toBeVisible()
  await expect(dialog.getByText(/Remaining refundable: \$64\.00/)).toBeVisible()
  await expect(
    dialog.getByRole('region', { name: 'Order activity timeline' }),
  ).toContainText('Refund preview recorded')
})

test('return rejection cannot create refund preview', async ({ page }) => {
  const dialog = await openOrder(page, 'KB-1044')
  await fill(
    page,
    dialog.getByRole('textbox', { name: 'Return reason' }),
    'Customer has changed their mind',
    'Enter return request',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Request return' }),
    'Create return request',
  )
  await click(
    page,
    dialog.getByRole('button', { name: 'Reject return' }),
    'Reject return',
  )
  await expect(dialog.getByText('Rejected', { exact: true })).toBeVisible()
  await expect(
    dialog.getByRole('spinbutton', { name: 'Refund amount (USD)' }),
  ).toHaveCount(0)
})

test('shipment validation requires both carrier and tracking', async ({
  page,
}) => {
  const dialog = await openOrder(page, 'KB-1047')
  await click(
    page,
    dialog.getByRole('button', { name: 'Save shipment' }),
    'Try empty shipment',
  )
  await expect(dialog.getByRole('alert')).toContainText(
    'Carrier and tracking number',
  )
  await expect(
    dialog.getByRole('combobox', { name: 'Change order status' }),
  ).toHaveValue('Processing')
})
