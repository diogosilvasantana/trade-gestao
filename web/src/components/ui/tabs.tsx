import * as React from "react"
import { cn } from "../../lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue: string; onValueChange?: (val: string) => void }
>(({ className, defaultValue, onValueChange, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue);

    // Allow controlled or uncontrolled
    const handleValueChange = (val: string) => {
        setValue(val);
        if (onValueChange) onValueChange(val);
    }

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div ref={ref} className={cn("", className)} {...props} />
        </TabsContext.Provider>
    )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, onClick, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-background text-foreground shadow-sm",
                className
            )}
            onClick={(e) => {
                context.onValueChange(value);
                if (onClick) onClick(e);
            }}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

// Simple Context
const TabsContext = React.createContext<{ value: string, onValueChange: (v: string) => void }>({
    value: "",
    onValueChange: () => { }
});

export { Tabs, TabsList, TabsTrigger, TabsContent }
