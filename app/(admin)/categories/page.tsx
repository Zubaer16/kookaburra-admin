import type {Metadata} from 'next'
import {Categories} from '@/components/admin/categories'
export const metadata:Metadata={title:'Categories'}
export default function Page(){return <Categories/>}
