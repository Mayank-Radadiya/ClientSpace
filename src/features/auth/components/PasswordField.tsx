"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordFieldProps extends React.ComponentProps<typeof Input> {}

export function PasswordField(props: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center justify-between">
      <Input
        {...props}
        className={cn(
          "bg-background border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-10 items-center rounded-lg px-3 pr-10 transition-all focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          props.className,
        )}
        type={show ? "text" : "password"}
        placeholder={props.placeholder || "Enter your password"}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground absolute top-0 right-0 h-full w-10 rounded-r-lg pt-1.5 hover:bg-transparent"
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
