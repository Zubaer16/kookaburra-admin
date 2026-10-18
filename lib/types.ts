export type ProductStatus = 'Active' | 'Draft'
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
export type Product = { id:string; name:string; sku:string; categoryId:string; price:number; stock:number; status:ProductStatus; color:string; createdAt:string }
export type Category = { id:string; name:string; slug:string; description:string; color:string }
export type Customer = { id:string; name:string; email:string; location:string; joinedAt:string }
export type Order = { id:string; customerId:string; items:{productId:string; name:string; qty:number; price:number}[]; status:OrderStatus; createdAt:string; channel:'Web'|'Mobile'; country:string }
export type StockEvent = { id:string; productId:string; delta:number; note:string; at:string }
export type ProductInput = Omit<Product,'id'|'createdAt'>
