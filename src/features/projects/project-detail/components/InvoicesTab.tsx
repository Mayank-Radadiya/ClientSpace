"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Invoice } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Plus } from "lucide-react";
import Link from "next/link";

interface InvoicesTabProps {
  projectId: string;
  invoices: Invoice[];
  budget: number | null;
}

export function InvoicesTab({ projectId, invoices, budget }: InvoicesTabProps) {
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + inv.amount_cents, 0);
  }, [invoices]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "sent":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Total invoiced:{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(totalInvoiced)}
            </span>{" "}
            / Budget: {budget ? formatCurrency(budget) : "Unset"} ·{" "}
            {invoices.length} invoices
          </p>
        </div>
        <Link href={`/invoices/new?projectId=${projectId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  No invoices created for this project yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    INV-{inv.number.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell>{formatCurrency(inv.amount_cents)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(inv.status) as any}
                      className="capitalize"
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inv.due_date
                      ? format(new Date(inv.due_date), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {inv.pdf_url && (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Download PDF"
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="outline" size="sm">
                        View <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
