import * as React from "react";
import * as DrawerPrimitive from "@radix-ui/react-dialog";

const Drawer = ({ shouldScaleBackground = true, ...props }) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef(({ ...props }, ref) => (
  <DrawerPrimitive.Trigger {...props} ref={ref} />
));
DrawerTrigger.displayName = DrawerPrimitive.Trigger.displayName;

const DrawerClose = React.forwardRef(({ ...props }, ref) => (
  <DrawerPrimitive.Close {...props} ref={ref} />
));
DrawerClose.displayName = DrawerPrimitive.Close.displayName;

const DrawerPortal = ({ className, children, ...props }) => (
  <DrawerPrimitive.Portal {...props}>
    <div className={className}>{children}</div>
  </DrawerPrimitive.Portal>
);

const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay className={className} {...props} ref={ref} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content ref={ref} className={className} {...props}>
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
);
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

const DrawerHeader = ({ className, ...props }) => (
  <div className={className} {...props} />
);

const DrawerFooter = ({ className, ...props }) => (
  <div className={className} {...props} />
);

const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={className} {...props} />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={className} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
