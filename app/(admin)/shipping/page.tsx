import type { Metadata } from 'next'
import { Shipping } from '@/components/admin/shipping'
export const metadata: Metadata = { title: 'Shipping & taxes' }
export default function Page() {
  return <Shipping />
}
