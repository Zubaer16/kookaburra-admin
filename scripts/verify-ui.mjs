import { existsSync, readFileSync } from 'node:fs'
const checks = [
  [
    'components/layout/admin-shell.tsx',
    [
      'Skip to main content',
      'Admin navigation',
      '<Dialog.Root',
      '<QuickNavigation',
      'tabIndex={-1}',
    ],
  ],
  [
    'components/layout/quick-navigation.tsx',
    [
      'Control+K Meta+K',
      "event.key === 'ArrowDown'",
      'aria-activedescendant',
      'No matching sections',
    ],
  ],
  [
    'components/admin/reports.tsx',
    [
      'onTabKeyDown',
      'ArrowRight',
      'ArrowLeft',
      'tabIndex={view === id ? 0 : -1}',
    ],
  ],
  ['components/ui/modal.tsx', ['100dvh']],
  [
    'e2e/08-ui-quality.spec.mjs',
    [
      'mobile navigation traps focus',
      'report tabs support arrow',
      'quick navigation keyboard shortcut',
    ],
  ],
  ['docs/ADMIN_UI_QA.md', ['Manual acceptance list']],
]
for (const [path, phrases] of checks) {
  if (!existsSync(path)) throw new Error(`Missing file: ${path}`)
  const src = readFileSync(path, 'utf8')
  for (const phrase of phrases) {
    if (!src.includes(phrase))
      throw new Error(`Expected UI marker not found in ${path}: ${phrase}`)
  }
}
console.log(
  `Admin UI source structure verified (${checks.length} files). This is NOT a browser or accessibility conformance test.`,
)
