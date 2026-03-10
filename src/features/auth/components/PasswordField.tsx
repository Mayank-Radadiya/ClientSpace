"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PasswordFieldProps extends React.ComponentProps<typeof Input> {
  leftIcon?: React.ReactNode;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ leftIcon, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative flex items-center justify-between">
        {leftIcon && (
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {leftIcon}
          </div>
        )}
        <Input
          {...props}
          ref={ref}
          className={cn(
            "bg-muted/40 hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
            "h-11 items-center rounded-xl border-transparent px-3 pr-10 shadow-sm transition-all focus-visible:ring-2",
            leftIcon && "pl-10",
            props.className,
          )}
          type={show ? "text" : "password"}
          placeholder={props.placeholder || "Enter your password"}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1 h-full w-10 rounded-r-xl hover:bg-transparent"
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
