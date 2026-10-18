'use client'
import {useState,type FormEvent} from 'react'
import {Layers3,Plus,Trash2,Package} from 'lucide-react'
import {useAdminStore} from '@/lib/store'
import {useAdminReady} from '@/components/providers'
import {PageHeading} from './page-heading'
import {Panel} from '@/components/ui/panel'
import {Button} from '@/components/ui/button'
import {Modal} from '@/components/ui/modal'
import {Field,controlClass} from '@/components/ui/field'
export function Categories(){const ready=useAdminReady(),categories=useAdminStore(s=>s.categories),products=useAdminStore(s=>s.products),add=useAdminStore(s=>s.addCategory),remove=useAdminStore(s=>s.deleteCategory)
 const [open,setOpen]=useState(false),[name,setName]=useState(''),[description,setDescription]=useState(''),[error,setError]=useState('')
 function submit(e:FormEvent){e.preventDefault();if(!add(name,description)){setError('Category name is empty or already exists.');return}setOpen(false);setName('');setDescription('');setError('')}
 return <><PageHeading eyebrow="ORGANIZE YOUR STORE" title="Categories" description="Create a flexible catalog across any product type." action={<Button disabled={!ready} onClick={()=>setOpen(true)}><Plus size={17}/>Add category</Button>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categories.map(c=>{const count=products.filter(p=>p.categoryId===c.id).length;return <Panel key={c.id} className="p-5"><div className="flex items-start justify-between"><div className="flex size-12 items-center justify-center rounded-2xl" style={{background:c.color}}><Layers3 size={20} className="text-slate-700"/></div><Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} disabled={count>0} title={count>0?'Move or remove category products first':'Delete category'} onClick={()=>{if(window.confirm(`Delete ${c.name}?`))remove(c.id)}}><Trash2 size={16}/></Button></div><h2 className="mt-5 font-extrabold">{c.name}</h2><p className="mt-1 min-h-9 text-xs leading-relaxed text-muted">{c.description||'No description'}</p><div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs font-bold text-muted"><Package size={15}/>{count} {count===1?'product':'products'}</div></Panel>})}</div>
 {open&&<Modal open={open} onOpenChange={setOpen} title="Create category" description="Categories can hold products and subcategories in the future backend model."><form className="space-y-4" onSubmit={submit}><Field label="Category name"><input className={controlClass} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Outdoor & Travel" required/></Field><Field label="Description"><textarea className={controlClass+' min-h-24 py-3'} value={description} onChange={e=>setDescription(e.target.value)} placeholder="A short description"/></Field>{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit">Create category</Button></div></form></Modal>}</>
}
