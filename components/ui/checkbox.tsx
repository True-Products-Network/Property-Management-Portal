"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    const id = props.id || React.useId()
    
    return (
      <div className="flex items-center space-x-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            ref={ref}
            id={id}
            className={cn(
              "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--border)] ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--teal)] data-[state=checked]:text-white",
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
