'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Category, Product, ProductInput, Customer, Order, OrderStatus, StockEvent } from './types'
import { seedCategories, seedProducts, seedCustomers, seedOrders } from './fixtures'

type AdminState = {
 products:Product[]; categories:Category[]; orders:Order[]; customers:Customer[]; stockEvents:StockEvent[]
 addProduct:(p:ProductInput)=>string; editProduct:(id:string,p:ProductInput)=>void; deleteProduct:(id:string)=>void
 addCategory:(name:string,description:string)=>boolean; deleteCategory:(id:string)=>boolean
 adjustStock:(productId:string,delta:number,note:string)=>boolean
 updateOrderStatus:(id:string,status:OrderStatus)=>void; resetPreview:()=>void
}
const newId = (prefix:string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
const base = () => ({products:seedProducts.map(p=>({...p})), categories:seedCategories.map(c=>({...c})),orders:seedOrders.map(o=>({...o,items:o.items.map(i=>({...i}))})),customers:seedCustomers.map(c=>({...c})),stockEvents:[] as StockEvent[]})
export const useAdminStore = create<AdminState>()(persist((set,get)=>({
 ...base(),
 addProduct:(input)=>{const id=newId('product');set(s=>({products:[{...input,id,createdAt:new Date().toISOString()},...s.products]}));return id},
 editProduct:(id,input)=>set(s=>({products:s.products.map(p=>p.id===id?{...p,...input}:p)})),
 deleteProduct:(id)=>set(s=>({products:s.products.filter(p=>p.id!==id)})),
 addCategory:(name,description)=>{
  const clean=name.trim(); if(!clean||get().categories.some(c=>c.name.toLowerCase()===clean.toLowerCase()))return false
  const slug=clean.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  set(s=>({categories:[...s.categories,{id:newId('cat'),name:clean,slug,description:description.trim(),color:'#e5e7eb'}]}));return true
 },
 deleteCategory:(id)=>{if(get().products.some(p=>p.categoryId===id))return false;set(s=>({categories:s.categories.filter(c=>c.id!==id)}));return true},
 adjustStock:(productId,delta,note)=>{
  const p=get().products.find(item=>item.id===productId); if(!p||!Number.isInteger(delta)||p.stock+delta<0||delta===0)return false
  set(s=>({products:s.products.map(item=>item.id===productId?{...item,stock:item.stock+delta}:item), stockEvents:[{id:newId('stock'),productId,delta,note:note.trim()||'Manual adjustment',at:new Date().toISOString()},...s.stockEvents].slice(0,100)}));return true
 },
 updateOrderStatus:(id,status)=>set(s=>({orders:s.orders.map(o=>o.id===id?{...o,status}:o)})),
 resetPreview:()=>set(base()),
}),{name:'kookaburra-admin-local-preview-v1',storage:createJSONStorage(()=>localStorage),skipHydration:true,version:1,partialize:(s)=>({products:s.products,categories:s.categories,orders:s.orders,customers:s.customers,stockEvents:s.stockEvents})}))
