import { format } from "date-fns";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCents, type Currency } from "@/features/invoices/schemas";
import { cn } from "@/lib/utils";

interface ClientInvoiceListProps {
  invoices: Array<{
    id: string;
    number: number;
    status: string;
    dueDate: string | null;
    amountCents: number;
    currency: string;
    pdfSignedUrl?: string | null;
  }>;
  emptyMessage?: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "overdue":
      return "destructive" as const;
    case "sent":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

export function ClientInvoiceList({
  invoices,
  emptyMessage = "No invoices to show right now.",
}: ClientInvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Invoice</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Due</th>
            <th className="px-4 py-3 text-left font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">PDF</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className={cn(
                "bg-card border-t",
                inv.status === "overdue" && "bg-destructive/5",
              )}
            >
              <td className="px-4 py-3 font-medium">INV-{inv.number}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={statusVariant(inv.status)}
                  className="capitalize"
                >
                  {inv.status}
                </Badge>
              </td>
              <td className="text-muted-foreground px-4 py-3">
                {inv.dueDate
                  ? format(new Date(inv.dueDate), "MMM d, yyyy")
                  : "-"}
              </td>
              <td className="px-4 py-3">
                {formatCents(inv.amountCents, inv.currency as Currency)}
              </td>
              <td className="px-4 py-3 text-right">
                {inv.pdfSignedUrl ? (
                  <a
                    href={inv.pdfSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download PDF"
                    className="hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-md"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Unavailable
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
