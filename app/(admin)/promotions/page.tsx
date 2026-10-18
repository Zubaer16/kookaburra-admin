import type { Metadata } from 'next'
import { Promotions } from '@/components/admin/promotions'
export const metadata: Metadata = { title: 'Promotions' }
export default function Page() { return <Promotions /> }
