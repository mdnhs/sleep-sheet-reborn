"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { IconCheck, IconMinus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<CheckboxPrimitive.Root.Props, "checked"> {
  checked?: boolean | "mixed"
}

function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  const isIndeterminate = checked === "mixed"
  const isChecked = checked === true

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={isIndeterminate ? false : isChecked}
      indeterminate={isIndeterminate}
      onCheckedChange={onCheckedChange}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <IconCheck
          className="size-3 data-[state=indeterminate]:hidden data-[state=unchecked]:hidden"
          strokeWidth={3}
        />
        <IconMinus
          className="size-3 data-[state=checked]:hidden data-[state=unchecked]:hidden"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
