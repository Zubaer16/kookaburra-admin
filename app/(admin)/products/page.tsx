import type { Metadata } from 'next'
import { Products } from '@/components/admin/products'
export const metadata: Metadata = { title: 'Products' }
export default function Page() {
  return <Products />
}
