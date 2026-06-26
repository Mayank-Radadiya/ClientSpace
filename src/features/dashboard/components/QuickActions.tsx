"use client";

import { Plus, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline" className="gap-2 text-sm">
        <Link href="/clients">
          <UserPlus size={14} />
          Add Client
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-2 text-sm">
        <Link href="/invoices">
          <FileText size={14} />
          New Invoice
        </Link>
      </Button>
      <Button asChild size="sm" className="gap-2 text-sm">
        <Link href="/projects">
          <Plus size={14} />
          New Project
        </Link>
      </Button>
    </div>
  );
}
