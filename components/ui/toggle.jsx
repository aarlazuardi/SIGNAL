import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "../../lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
