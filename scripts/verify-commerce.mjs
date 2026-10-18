import { readFileSync } from 'node:fs'
import ts from 'typescript'
import assert from 'node:assert/strict'

// Compile a pure TS rules module without invoking Next.js or a browser.
const source = readFileSync(
  new URL('../lib/commerce-policy.ts', import.meta.url),
  'utf8',
)
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText
const mod = { exports: {} }
new Function('module', 'exports', js)(mod, mod.exports)
const { shippingZoneError, taxRuleError, previewQuote, destinationCountries } =
  mod.exports
const service = (kind, feeUsd, freeOverUsd = 0) => ({
  kind,
  feeUsd,
  freeOverUsd,
  etaNote: 'Example only',
  enabled: true,
})
const zone = (id, countries) => ({
  id,
  name: id,
  countries,
  enabled: true,
  services: [service('standard', 18, 100), service('express', 35)],
})
const core = zone('Primary destinations', ['United States', 'Other country'])
assert.equal(destinationCountries.length, 9)
assert.equal(shippingZoneError(core, []), null)
assert.match(
  shippingZoneError(zone('Duplicate', ['United States']), [core]),
  /already assigned/,
)
assert.match(
  shippingZoneError({ ...core, services: [service('standard', 18)] }, []),
  /each be configured/,
)
assert.match(
  shippingZoneError(
    { ...core, services: [service('standard', -1), service('express', 35)] },
    [],
  ),
  /valid USD/,
)
assert.equal(
  taxRuleError(
    {
      id: 'a',
      country: 'United States',
      ratePercent: 7.5,
      note: '',
      enabled: true,
    },
    [],
  ),
  null,
)
assert.match(
  taxRuleError(
    {
      id: 'b',
      country: 'United States',
      ratePercent: 7.5,
      note: '',
      enabled: true,
    },
    [
      {
        id: 'a',
        country: 'United States',
        ratePercent: 5,
        note: '',
        enabled: true,
      },
    ],
  ),
  /already exists/,
)
assert.match(
  taxRuleError(
    {
      id: 'a',
      country: 'United States',
      ratePercent: 101,
      note: '',
      enabled: true,
    },
    [],
  ),
  /0–100/,
)
const tax = [
  {
    id: 'us',
    country: 'United States',
    ratePercent: 7.5,
    enabled: true,
    note: '',
  },
]
assert.deepEqual(previewQuote([core], tax, 'United States', 'standard', 150), {
  country: 'United States',
  method: 'standard',
  subtotalUsd: 150,
  zoneName: 'Primary destinations',
  deliveryUsd: 0,
  taxUsd: 11.25,
  subtotalAndDeliveryUsd: 150,
})
assert.equal(
  previewQuote([core], tax, 'United States', 'express', 50).deliveryUsd,
  35,
)
assert.equal(
  previewQuote([core], tax, 'United Kingdom', 'standard', 50).taxUsd,
  null,
)
assert.equal(previewQuote([], tax, 'Canada', 'standard', 50).deliveryUsd, null)
console.log(
  'International shipping & tax preview rules OK (fixtures/rules only, no real checkout or payment).',
)
