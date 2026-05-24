import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { invoiceKeys } from "./queryKeys";
import { revalidateTagAction } from "@/lib/actions";

const GC_TIME = 10 * 60 * 1000;

/**
 * Hook to fetch project invoices list with staleTime: Infinity.
 */
export function useInvoiceList(
  orgId: string,
  filters?: { status?: "draft" | "sent" | "paid" | "overdue"; clientId?: string }
) {
  return trpc.invoices.list.useQuery(
    { status: filters?.status, clientId: filters?.clientId },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
    }
  );
}

/**
 * Hook to fetch a single invoice by ID with staleTime: Infinity.
 */
export function useInvoiceDetail(orgId: string, invoiceId: string) {
  return trpc.invoices.byId.useQuery(
    { id: invoiceId },
    {
      staleTime: Infinity,
      gcTime: GC_TIME,
      enabled: !!invoiceId,
    }
  );
}

/**
 * Mutation hook to create an invoice.
 */
export function useCreateInvoiceMutation(orgId: string) {
  const queryClient = useQueryClient();

  return trpc.invoices.create.useMutation({
    onSuccess: async () => {
      // Invalidate invoice lists
      await queryClient.invalidateQueries({
        queryKey: invoiceKeys.list(orgId),
      });

      // Revalidate server-side caches
      await revalidateTagAction(`org-${orgId}-invoices`);
    },
  });
}

/**
 * Mutation hook to update invoice status. Performs optimistic update on the invoice detail cache.
 */
export function useUpdateInvoiceStatusMutation(orgId: string, invoiceId: string) {
  const queryClient = useQueryClient();

  return trpc.invoices.update.useMutation({
    onMutate: async (variables) => {
      const detailKey = invoiceKeys.detail(orgId, invoiceId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailKey });

      // Snapshot previous value
      const previousInvoice = queryClient.getQueryData(detailKey);

      // Optimistically update invoice detail cache
      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: variables.status,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousInvoice };
    },
    onError: (err, variables, context) => {
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          invoiceKeys.detail(orgId, invoiceId),
          context.previousInvoice
        );
      }
    },
    onSuccess: async () => {
      // Invalidate lists and detail
      await queryClient.invalidateQueries({
        queryKey: invoiceKeys.list(orgId),
      });
      await queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(orgId, invoiceId),
      });

      // Revalidate Next.js cache tags
      await revalidateTagAction(`org-${orgId}-invoices`);
      await revalidateTagAction(`org-${orgId}-invoice-${invoiceId}`);
    },
  });
}

/**
 * Mutation hook to delete invoices.
 */
export function useDeleteInvoicesMutation(orgId: string, invoiceIds: string[]) {
  const queryClient = useQueryClient();

  return trpc.invoices.delete.useMutation({
    onSuccess: async () => {
      // Invalidate lists
      await queryClient.invalidateQueries({
        queryKey: invoiceKeys.list(orgId),
      });

      // Remove specific invoice detail caches
      for (const id of invoiceIds) {
        queryClient.removeQueries({
          queryKey: invoiceKeys.detail(orgId, id),
        });
      }

      // Revalidate Next.js cache tags
      await revalidateTagAction(`org-${orgId}-invoices`);
      for (const id of invoiceIds) {
        await revalidateTagAction(`org-${orgId}-invoice-${id}`);
      }
    },
  });
}
