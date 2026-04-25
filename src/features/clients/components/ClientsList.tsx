import { trpc } from "@/lib/trpc/client";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientListItem } from "../client.types";
import { STATUS_DOT } from "../constants";
import { statusLabel, formatCents, formatRelative } from "../utils/formatters";
import { PaddedNumber } from "./PaddedNumber";

type ClientsListProps = {
  visibleClients: ClientListItem[];
  openClient: (id: string) => void;
  permissions: {
    canEditClient: boolean;
  };
  onClientArchived: () => void;
};

export function ClientsList({
  visibleClients,
  openClient,
  permissions,
  onClientArchived,
}: ClientsListProps) {
  const archiveMutation = trpc.clients.archiveClient.useMutation({
    onSuccess: () => {
      onClientArchived();
    },
  });

  return (
    <div className="border-border bg-muted/20 overflow-hidden rounded-2xl border backdrop-blur-md">
      <Table>
        <TableHeader className="border-border border-b hover:bg-transparent">
          <TableRow className="border-none hover:bg-transparent">
            {[
              "Client",
              "Status",
              "Projects",
              "Outstanding",
              "Last Activity",
            ].map((h) => (
              <TableHead
                key={h}
                className="text-muted-foreground h-12 text-[10px] font-semibold tracking-[0.2em] uppercase"
              >
                {h}
              </TableHead>
            ))}
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleClients.map((client) => (
            <TableRow
              key={client.id}
              onClick={() => openClient(client.id)}
              className="group border-border/50 hover:bg-muted/40 cursor-pointer border-b transition-colors"
            >
              <TableCell className="py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-foreground group-hover:text-primary text-base font-bold transition-colors">
                    {client.companyName ?? client.contactName ?? client.email}
                  </span>
                  <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                    {client.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_DOT[client.displayStatus],
                    )}
                  />
                  <span className="text-foreground text-[10px] tracking-widest uppercase">
                    {statusLabel(client.displayStatus)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-foreground text-xl">
                <PaddedNumber value={client.activeProjectCount} />
              </TableCell>
              <TableCell className="text-primary text-xl">
                {formatCents(client.outstandingAmountCents)}
              </TableCell>
              <TableCell className="text-muted-foreground text-[10px] tracking-widest uppercase">
                {formatRelative(client.lastActivityAt)}
              </TableCell>
              <TableCell>
                {permissions.canEditClient && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground h-8 w-8 rounded-full border border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-border bg-popover text-xs tracking-wider uppercase shadow-2xl"
                    >
                      <DropdownMenuItem
                        className="focus:bg-primary/10 focus:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveMutation.mutate({ clientId: client.id });
                        }}
                      >
                        Archive Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
