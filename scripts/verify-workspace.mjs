import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import ts from 'typescript'
const file = 'lib/workspace-policy.ts'
const result = ts.transpileModule(readFileSync(file, 'utf8'), {
  fileName: file,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
})
assert.equal(
  result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error)
    .length ?? 0,
  0,
)
const compiledModule = { exports: {} }
new Function('module', 'exports', result.outputText)(
  compiledModule,
  compiledModule.exports,
)
const x = compiledModule.exports
assert.equal(x.staffRoles.length, 5)
assert.equal(x.allPermissions.length, 11)
assert.equal(x.seedRolePermissions.Owner.length, x.allPermissions.length)
assert.equal(x.staffError(x.seedStaff[0], x.seedStaff), null)
assert.match(
  x.staffError({ ...x.seedStaff[0], role: 'Support' }, x.seedStaff),
  /active Owner/,
)
assert.match(
  x.staffError(
    { ...x.seedStaff[0], id: 'new', email: 'operations@example.test' },
    x.seedStaff,
  ),
  /already exists/,
)
assert.match(
  x.staffError(
    { ...x.seedStaff[0], id: 'new', email: 'no-email' },
    x.seedStaff,
  ),
  /valid staff email/,
)
assert.equal(x.settingsError(x.defaultStoreSettings), null)
assert.match(
  x.settingsError({
    ...x.defaultStoreSettings,
    websiteUrl: 'javascript:alert(1)',
  }),
  /HTTPS/,
)
assert.match(
  x.settingsError({ ...x.defaultStoreSettings, orderPrefix: 'bad prefix' }),
  /uppercase/,
)
assert.match(
  x.settingsError({ ...x.defaultStoreSettings, timezone: 'unknown' }),
  /time zone/,
)
assert.equal(x.rolePermissionsError('Manager', ['dashboard.view']), null)
assert.match(x.rolePermissionsError('Owner', ['dashboard.view']), /fixed/)
assert.match(
  x.rolePermissionsError('Analyst', ['dashboard.view', 'dashboard.view']),
  /duplicate/,
)
console.log(
  'Workspace rules OK: staff, roles, settings and owner protection. These are UI-only rules.',
)
