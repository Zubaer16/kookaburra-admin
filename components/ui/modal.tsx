'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
export function Modal({open,onOpenChange,title,description,children}:{open:boolean;onOpenChange:(v:boolean)=>void;title:string;description?:string;children:React.ReactNode}){
 return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/50 data-[state=open]:animate-in"/><Dialog.Content className="fixed left-1/2 top-1/2 z-[90] max-h-[88vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"><Dialog.Title className="text-xl font-extrabold tracking-tight">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted">{description??'Edit the details below.'}</Dialog.Description><Dialog.Close className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close dialog"><X size={18}/></Dialog.Close><div className="mt-6">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
}
