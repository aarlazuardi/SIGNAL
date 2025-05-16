import * as React from "react";

const Input = React.forwardRef(({ type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    {...props}
    className={
      "block w-full rounded-md border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500" +
      (props.className ? " " + props.className : "")
    }
  />
));
Input.displayName = "Input";

export { Input };
