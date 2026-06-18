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
      <div className="relative flex w-full items-center justify-between">
        {leftIcon && (
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {leftIcon}
          </div>
        )}
        <Input
          {...props}
          ref={ref}
          className={cn(
            "bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_1px_theme(colors.primary/40%)] border border-zinc-200/50 dark:border-zinc-800/50 placeholder:text-zinc-300 dark:placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
            "h-11 items-center rounded-xl px-3 pr-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out",
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
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 h-full w-10 rounded-r-xl hover:bg-transparent transition-colors duration-300 ease-out"
          onClick={() => setShow((v) => !v)}
        >
          <span className="flex items-center justify-center transition-transform duration-200 data-[show=true]:rotate-12" data-show={show}>
            {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </span>
        </Button>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
