import * as React from "react";

// Only pass valid HTML props to the div
const Sheet = ({ children, open, onOpenChange, ...props }) => (
  <div {...props}>{children}</div>
);
const SheetContent = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
const SheetTrigger = React.forwardRef(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ref, ...props });
    }
    return (
      <button ref={ref} type="button" {...props}>
        {children}
      </button>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

export { Sheet, SheetContent, SheetTrigger };
