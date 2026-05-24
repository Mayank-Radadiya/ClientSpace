export const invoiceKeys = {
  all: (orgId: string) => ["invoices", orgId] as const,
  list: (orgId: string, filters?: Record<string, any>) =>
    [...invoiceKeys.all(orgId), "list", filters ?? {}] as const,
  detail: (orgId: string, id: string) =>
    [...invoiceKeys.all(orgId), "detail", id] as const,
};
