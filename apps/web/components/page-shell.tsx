import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

/** Standard content wrapper for all dashboard pages. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-4 md:p-6", className)}>
      {children}
    </div>
  )
}
