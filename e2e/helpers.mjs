import { expect } from '@playwright/test'
export const pause = Number(process.env.E2E_DELAY_MS ?? 900)
export async function go(page, path, description) {
  await page.goto(path)
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await page.waitForTimeout(pause)
  await expect(page.locator('main')).toBeVisible()
  if (description) console.log('✓', description)
}
export async function action(page, description, fn) {
  await fn()
  await page.waitForTimeout(pause)
  console.log('✓', description)
}
export const click = (page, locator, description) =>
  action(page, description, () => locator.click())
export const fill = (page, locator, value, description) =>
  action(page, description, () => locator.fill(value))
export const select = (page, locator, value, description) =>
  action(page, description, () => locator.selectOption(value))
