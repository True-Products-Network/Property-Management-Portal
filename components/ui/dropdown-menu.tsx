"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenu components must be used within DropdownMenu")
  return context
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const { setOpen } = useDropdownMenu()
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick } as any)
  }
  
  return <button onClick={handleClick}>{children}</button>
}

const DropdownMenuContent = ({ children, align = "center", className }: { 
  children: React.ReactNode; 
  align?: "start" | "center" | "end";
  className?: string 
}) => {
  const { open, setOpen } = useDropdownMenu()
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])
  
  if (!open) return null
  
  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
        alignClass[align],
        className
      )}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem = ({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) => {
  const { setOpen } = useDropdownMenu()
  
  return (
    <button
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100",
        className
      )}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

const DropdownMenuLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
