'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {LayoutDashboard,Package,Layers3,Boxes,ShoppingCart,Users,Search,Menu,X,ChevronRight,Bell,Globe2,ShieldCheck,RotateCcw} from 'lucide-react'
import {cn} from '@/lib/utils'
import {useAdminStore} from '@/lib/store'
import {Button} from '@/components/ui/button'
const links=[
 {href:'/dashboard',label:'Overview',icon:LayoutDashboard},
 {href:'/products',label:'Products',icon:Package},
 {href:'/categories',label:'Categories',icon:Layers3},
 {href:'/inventory',label:'Inventory',icon:Boxes},
 {href:'/orders',label:'Orders',icon:ShoppingCart},
 {href:'/customers',label:'Customers',icon:Users},
]
function Logo(){return <Link href="/dashboard" className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-[0_7px_17px_rgba(36,89,232,.22)]">K</span><span><span className="block text-base font-black tracking-tight text-ink">kookaburra<span className="text-primary">.</span></span><span className="block text-[10px] font-bold tracking-[.18em] text-muted">ADMIN WORKSPACE</span></span></Link>}
function Sidebar({close}:{close?:()=>void}){
 const pathname=usePathname();const reset=useAdminStore(s=>s.resetPreview)
 return <div className="flex h-full flex-col bg-white px-5 py-6"><Logo/><div className="mt-11 px-3 text-[11px] font-extrabold uppercase tracking-[.18em] text-slate-400">Workspace</div><nav aria-label="Admin navigation" className="mt-3 space-y-1.5">{links.map(({href,label,icon:Icon})=>{const active=pathname===href||pathname.startsWith(href+'/');return <Link onClick={close} key={href} href={href} aria-current={active?'page':undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition',active?'bg-blue-50 text-primary':'text-slate-600 hover:bg-slate-50 hover:text-ink')}><Icon size={19} strokeWidth={active?2.3:1.9}/><span>{label}</span>{active&&<span className="ml-auto size-1.5 rounded-full bg-primary"/>}</Link>})}</nav><div className="mt-auto space-y-3 border-t border-line pt-5"><div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4"><ShieldCheck size={19} className="text-primary"/><p className="mt-2 text-xs font-extrabold">Frontend preview</p><p className="mt-1 text-xs leading-relaxed text-muted">Changes are saved in this browser only. No backend or payment is connected.</p></div><Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={()=>{if(window.confirm('Reset all local preview changes?'))reset()}}><RotateCcw size={15}/>Reset sample data</Button></div></div>
}
export function AdminShell({children}:{children:React.ReactNode}){
 const [open,setOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false)
 const pathname=usePathname()
 useEffect(()=>{setOpen(false)},[pathname])
 useEffect(()=>{if(!open)return;const fn=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[open])
 return <div className="min-h-screen lg:pl-[254px]"><aside className="fixed inset-y-0 left-0 z-30 hidden w-[254px] border-r border-line bg-white lg:block"><Sidebar/></aside>{open&&<div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={()=>setOpen(false)}/><aside className="relative h-full w-[min(84vw,270px)] shadow-2xl"><Sidebar close={()=>setOpen(false)}/><button aria-label="Close navigation" onClick={()=>setOpen(false)} className="absolute right-3 top-4 rounded-lg bg-white p-2"><X size={18}/></button></aside></div>}
  <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-8"><button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu size={22}/></button><div className="hidden items-center gap-2 text-sm text-muted sm:flex"><Globe2 size={16}/><span>Global Store</span><ChevronRight size={14}/><span className="font-bold capitalize text-ink">{pathname.split('/')[1]||'Overview'}</span></div><div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 text-muted md:flex"><Search size={16}/>{searchOpen?<input autoFocus className="w-40 bg-transparent text-sm outline-none" aria-label="Quick navigation" placeholder="Type a section..." onKeyDown={e=>{if(e.key==='Escape')setSearchOpen(false);if(e.key==='Enter'){const target=links.find(l=>l.label.toLowerCase().includes(e.currentTarget.value.toLowerCase()));if(target){window.location.href=target.href}}}}/>:<button onClick={()=>setSearchOpen(true)} className="text-xs">Jump to section</button>}</div><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">USD only</span><button aria-label="Notifications unavailable in preview" title="Notifications will be connected to the backend later" disabled className="rounded-xl border border-line p-2 text-muted opacity-50"><Bell size={19}/></button><div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-label="Admin preview profile">AD</div></div></header>
  <main id="main-content" className="mx-auto max-w-[1550px] px-4 pb-14 pt-7 sm:px-8 sm:pt-9">{children}</main>
 </div>
}
