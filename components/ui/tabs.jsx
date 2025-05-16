import * as React from "react";

const Tabs = ({ value, defaultValue, onTabChange, children, ...props }) => {
  const [active, setActive] = React.useState(value || defaultValue || "");

  React.useEffect(() => {
    if (typeof value === "string") setActive(value);
  }, [value]);

  const handleTabChange = (val) => {
    setActive(val);
    if (onTabChange) onTabChange(val);
  };

  // Inject context for children
  return (
    <TabsContext.Provider value={{ active, onTabChange: handleTabChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsContext = React.createContext({ active: "", onTabChange: () => {} });

const TabsList = ({ children, ...props }) => <div {...props}>{children}</div>;

const TabsTrigger = React.forwardRef(({ value, children, ...props }, ref) => {
  const { active, onTabChange } = React.useContext(TabsContext);
  return (
    <button
      ref={ref}
      type="button"
      aria-selected={active === value}
      className={active === value ? "font-bold border-b-2 border-emerald-500" : ""}
      onClick={() => onTabChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = ({ value, children, ...props }) => {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div {...props}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
