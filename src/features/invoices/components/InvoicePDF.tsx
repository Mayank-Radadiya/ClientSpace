// src/features/invoices/components/InvoicePDF.tsx
// Server-side PDF template using @react-pdf/renderer.
// NO "use client" — this is rendered server-side only.
// Used by: GET /api/invoices/[invoiceId]/pdf

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { type Currency, formatCents, type InvoiceTotals } from "../schemas";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePDFProps {
  invoice: {
    id: string;
    number: number;
    status: string;
    currency: Currency;
    dueDate: string | null;
    notes: string | null;
    createdAt: Date;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  totals: InvoiceTotals;
  client: {
    companyName: string | null;
    email: string;
    contactName: string | null;
  };
  org: {
    name: string;
    logoUrl: string | null;
    accentColor: string;
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Dynamic styles based on org accent color are created at render time
const baseStyles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  orgSection: {
    flexDirection: "column",
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  invoiceSection: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 10,
    color: "#777",
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 24,
  },
  billSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  billDetail: {
    fontSize: 10,
    color: "#555",
    marginBottom: 1,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colDescription: { flex: 1 },
  colQty: { width: 60, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCellText: {
    fontSize: 10,
    color: "#374151",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 28,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#777",
    width: 100,
    textAlign: "right",
    marginRight: 16,
  },
  totalsValue: {
    fontSize: 10,
    color: "#1a1a1a",
    width: 90,
    textAlign: "right",
  },
  totalRowBorder: {
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
    marginRight: 16,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 90,
    textAlign: "right",
  },
  notesSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesText: {
    fontSize: 10,
    color: "#555",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: "#aaa",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePDF({
  invoice,
  items,
  totals,
  client,
  org,
}: InvoicePDFProps) {
  const accentColor = org.accentColor ?? "#3b82f6";

  const billTo = client.companyName ?? client.contactName ?? client.email;
  const createdDate = invoice.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Document
      title={`INV-${invoice.number}`}
      author={org.name}
      subject={`Invoice #${invoice.number} from ${org.name}`}
    >
      <Page size="A4" style={baseStyles.page}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={baseStyles.header}>
          <View style={baseStyles.orgSection}>
            <Text style={[baseStyles.orgName, { color: accentColor }]}>
              {org.name}
            </Text>
          </View>
          <View style={baseStyles.invoiceSection}>
            <Text style={baseStyles.invoiceTitle}>INVOICE</Text>
            <Text style={baseStyles.invoiceNumber}>
              #{invoice.number} · INV-{invoice.number}
            </Text>
            <Text style={baseStyles.invoiceDate}>Issued: {createdDate}</Text>
            {dueDate && (
              <Text style={baseStyles.invoiceDate}>Due: {dueDate}</Text>
            )}
          </View>
        </View>

        <View style={baseStyles.divider} />

        {/* ── Bill To ──────────────────────────────────────────────── */}
        <View style={baseStyles.billSection}>
          <Text style={baseStyles.sectionLabel}>Bill To</Text>
          <Text style={baseStyles.billName}>{billTo}</Text>
          {client.contactName && client.companyName && (
            <Text style={baseStyles.billDetail}>{client.contactName}</Text>
          )}
          <Text style={baseStyles.billDetail}>{client.email}</Text>
        </View>

        {/* ── Line Items Table ─────────────────────────────────────── */}
        <View style={baseStyles.table}>
          {/* Table Header */}
          <View style={baseStyles.tableHeader}>
            <Text
              style={[baseStyles.colDescription, baseStyles.tableHeaderText]}
            >
              Description
            </Text>
            <Text style={[baseStyles.colQty, baseStyles.tableHeaderText]}>
              Qty
            </Text>
            <Text style={[baseStyles.colPrice, baseStyles.tableHeaderText]}>
              Unit Price
            </Text>
            <Text style={[baseStyles.colTotal, baseStyles.tableHeaderText]}>
              Total
            </Text>
          </View>

          {/* Table Rows */}
          {items.map((item, idx) => {
            const lineTotal = Math.round(item.quantity * item.unitPriceCents);
            return (
              <View
                key={idx}
                style={[
                  baseStyles.tableRow,
                  idx % 2 === 1 ? baseStyles.tableRowAlt : {},
                ]}
              >
                <Text
                  style={[baseStyles.colDescription, baseStyles.tableCellText]}
                >
                  {item.description}
                </Text>
                <Text style={[baseStyles.colQty, baseStyles.tableCellText]}>
                  {item.quantity % 1 === 0
                    ? item.quantity.toString()
                    : item.quantity.toFixed(2)}
                </Text>
                <Text style={[baseStyles.colPrice, baseStyles.tableCellText]}>
                  {formatCents(item.unitPriceCents, invoice.currency)}
                </Text>
                <Text style={[baseStyles.colTotal, baseStyles.tableCellText]}>
                  {formatCents(lineTotal, invoice.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Totals ──────────────────────────────────────────────── */}
        <View style={baseStyles.totalsSection}>
          <View style={baseStyles.totalsRow}>
            <Text style={baseStyles.totalsLabel}>Subtotal</Text>
            <Text style={baseStyles.totalsValue}>
              {formatCents(totals.subtotal, invoice.currency)}
            </Text>
          </View>
          {totals.tax > 0 && (
            <View style={baseStyles.totalsRow}>
              <Text style={baseStyles.totalsLabel}>Tax</Text>
              <Text style={baseStyles.totalsValue}>
                {formatCents(totals.tax, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={[baseStyles.totalsRow, baseStyles.totalRowBorder]}>
            <Text style={[baseStyles.totalLabel, { color: accentColor }]}>
              Total
            </Text>
            <Text style={[baseStyles.totalValue, { color: accentColor }]}>
              {formatCents(totals.total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────────────── */}
        {invoice.notes && (
          <View style={baseStyles.notesSection}>
            <Text style={[baseStyles.sectionLabel, { marginBottom: 6 }]}>
              Notes
            </Text>
            <Text style={baseStyles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>
            INV-{invoice.number} · {org.name}
          </Text>
          <Text style={baseStyles.footerText}>Generated via ClientSpace</Text>
        </View>
      </Page>
    </Document>
  );
}
