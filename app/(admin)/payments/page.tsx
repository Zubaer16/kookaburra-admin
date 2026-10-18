import type { Metadata } from 'next'
import { Payments } from '@/components/admin/payments'
export const metadata: Metadata = { title: 'Payment reporting preview' }
export default function Page() { return <Payments /> }
