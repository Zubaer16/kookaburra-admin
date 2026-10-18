import type { Metadata } from 'next'
import { Settings } from '@/components/admin/settings'
export const metadata: Metadata = { title: 'Store Settings' }
export default function Page() {
  return <Settings />
}
