import * as React from "react";

const Label = React.forwardRef(({ children, ...props }, ref) => (
  <label
    ref={ref}
    {...props}
    className={
      "block text-sm font-medium text-gray-700" +
      (props.className ? " " + props.className : "")
    }
  >
    {children}
  </label>
));
Label.displayName = "Label";

export { Label };
