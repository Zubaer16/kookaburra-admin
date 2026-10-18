import type {Metadata} from 'next'
import {Orders} from '@/components/admin/orders'
export const metadata:Metadata={title:'Orders'}
export default function Page(){return <Orders/>}
