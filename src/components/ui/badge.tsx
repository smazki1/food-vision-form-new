import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-500/80",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80",
        blue:
          "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        purple:
          "border-transparent bg-purple-500 text-white hover:bg-purple-500/80",
        "new-lead": "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        "initial-contact": "border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
        "interested": "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        "not-interested": "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        "meeting-scheduled": "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        "demo-completed": "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        "quote-sent": "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
        "awaiting-response": "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        "converted": "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
        green:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200/80",
        yellow:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
