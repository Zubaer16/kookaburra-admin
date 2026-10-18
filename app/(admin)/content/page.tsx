import type { Metadata } from 'next'
import { StoreContent } from '@/components/admin/store-content'
export const metadata: Metadata = { title: 'Store content' }
export default function Page() {
  return <StoreContent />
}
