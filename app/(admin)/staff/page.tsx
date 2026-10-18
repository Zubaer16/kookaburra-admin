import type { Metadata } from 'next'
import { Staff } from '@/components/admin/staff'
export const metadata: Metadata = { title: 'Staff & Permissions' }
export default function Page() {
  return <Staff />
}
