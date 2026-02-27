"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={className}
    style={{
      display: "inline-flex",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-md)",
      background: "var(--card)",
      padding: 4,
      gap: 4,
      border: "1px solid var(--border-subtle)",
    }}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={className}
    style={{
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-sm)",
      padding: "6px 12px",
      fontSize: "var(--text-base)",
      fontWeight: 600,
      color: "var(--muted)",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={className}
    style={{ marginTop: "var(--space-md)", outline: "none" }}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
