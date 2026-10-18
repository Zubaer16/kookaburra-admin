import type { Metadata } from 'next'
import { Activity } from '@/components/admin/activity'
export const metadata: Metadata = { title: 'Local Activity' }
export default function Page() {
  return <Activity />
}
