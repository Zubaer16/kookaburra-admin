import type {Metadata} from 'next'
import {Customers} from '@/components/admin/customers'
export const metadata:Metadata={title:'Customers'}
export default function Page(){return <Customers/>}
