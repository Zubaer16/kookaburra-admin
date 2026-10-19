import type { Metadata } from 'next'
import { Alignment } from '@/components/admin/alignment'
export const metadata: Metadata = { title: 'Frontend Compatibility' }
export default function Page() {
  return <Alignment />
}
