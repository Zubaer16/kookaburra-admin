import type { Category, Product, Customer, Order } from './types'
export const seedCategories: Category[] = [
 {id:'cat-electronics',name:'Electronics',slug:'electronics',description:'Connected living and smart essentials',color:'#dbeafe'},
 {id:'cat-fashion',name:'Fashion',slug:'fashion',description:'Everyday style and clothing',color:'#fce7f3'},
 {id:'cat-footwear',name:'Shoes & Footwear',slug:'footwear',description:'Footwear for every destination',color:'#fef3c7'},
 {id:'cat-home',name:'Home & Living',slug:'home',description:'Refresh every room',color:'#d1fae5'},
 {id:'cat-beauty',name:'Beauty',slug:'beauty',description:'Care and self-expression',color:'#ede9fe'},
 {id:'cat-accessories',name:'Accessories',slug:'accessories',description:'The finishing details',color:'#e0e7ff'},
]
export const seedProducts: Product[] = [
 {id:'p-101',name:'Sonic Wireless Headphones',sku:'EL-SNC-101',categoryId:'cat-electronics',price:89,stock:34,status:'Active',color:'#dceaff',createdAt:'2026-10-01'},
 {id:'p-102',name:'Motion Everyday Sneakers',sku:'FW-MTN-102',categoryId:'cat-footwear',price:110,stock:12,status:'Active',color:'#f5e6d3',createdAt:'2026-10-03'},
 {id:'p-103',name:'Daybreak Cotton Tee',sku:'FS-DBK-103',categoryId:'cat-fashion',price:29,stock:83,status:'Active',color:'#ffe6ea',createdAt:'2026-10-04'},
 {id:'p-104',name:'Dew Hydrating Face Serum',sku:'BT-DEW-104',categoryId:'cat-beauty',price:38,stock:6,status:'Active',color:'#efe8fd',createdAt:'2026-10-05'},
 {id:'p-105',name:'Orbit Classic Watch',sku:'AC-ORB-105',categoryId:'cat-accessories',price:139,stock:21,status:'Active',color:'#e7ecf5',createdAt:'2026-10-05'},
 {id:'p-106',name:'Everyday Canvas Tote',sku:'AC-CNV-106',categoryId:'cat-accessories',price:25,stock:41,status:'Active',color:'#fff0da',createdAt:'2026-10-06'},
 {id:'p-107',name:'Aurora Desk Lamp',sku:'HM-ARO-107',categoryId:'cat-home',price:65,stock:8,status:'Active',color:'#e1f4ea',createdAt:'2026-10-07'},
 {id:'p-108',name:'Echo Mini Speaker',sku:'EL-ECH-108',categoryId:'cat-electronics',price:59,stock:0,status:'Draft',color:'#e9edff',createdAt:'2026-10-08'},
]
export const seedCustomers: Customer[] = [
 {id:'c-1',name:'Olivia Bennett',email:'olivia@example.com',location:'United Kingdom',joinedAt:'2026-09-21'},
 {id:'c-2',name:'Noah Cooper',email:'noah@example.com',location:'Canada',joinedAt:'2026-09-25'},
 {id:'c-3',name:'Sophia Wilson',email:'sophia@example.com',location:'United States',joinedAt:'2026-10-02'},
 {id:'c-4',name:'Leo Martin',email:'leo@example.com',location:'France',joinedAt:'2026-10-08'},
 {id:'c-5',name:'Emma Harris',email:'emma@example.com',location:'Australia',joinedAt:'2026-10-10'},
]
export const seedOrders: Order[] = [
 {id:'KB-1048',customerId:'c-1',status:'Delivered',createdAt:'2026-10-17',channel:'Web',country:'United Kingdom',items:[{productId:'p-101',name:'Sonic Wireless Headphones',qty:1,price:89},{productId:'p-106',name:'Everyday Canvas Tote',qty:1,price:25}]},
 {id:'KB-1047',customerId:'c-2',status:'Processing',createdAt:'2026-10-16',channel:'Web',country:'Canada',items:[{productId:'p-102',name:'Motion Everyday Sneakers',qty:1,price:110}]},
 {id:'KB-1046',customerId:'c-3',status:'Shipped',createdAt:'2026-10-16',channel:'Web',country:'United States',items:[{productId:'p-105',name:'Orbit Classic Watch',qty:1,price:139}]},
 {id:'KB-1045',customerId:'c-4',status:'Pending',createdAt:'2026-10-15',channel:'Mobile',country:'France',items:[{productId:'p-103',name:'Daybreak Cotton Tee',qty:2,price:29},{productId:'p-104',name:'Dew Hydrating Face Serum',qty:1,price:38}]},
 {id:'KB-1044',customerId:'c-5',status:'Delivered',createdAt:'2026-10-14',channel:'Web',country:'Australia',items:[{productId:'p-107',name:'Aurora Desk Lamp',qty:1,price:65}]},
 {id:'KB-1043',customerId:'c-1',status:'Cancelled',createdAt:'2026-10-12',channel:'Web',country:'United Kingdom',items:[{productId:'p-106',name:'Everyday Canvas Tote',qty:1,price:25}]},
]
export const orderTotal = (order:Order) => order.items.reduce((sum,item)=>sum+item.price*item.qty,0)
