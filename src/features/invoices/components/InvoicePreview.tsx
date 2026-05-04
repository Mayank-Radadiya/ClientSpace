"use client";

import React from "react";
import { type CreateInvoiceInput, formatCents } from "../schemas";

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface InvoicePreviewProps {
  data: Partial<CreateInvoiceInput>;
  clients: Client[];
}

export function InvoicePreview({ data, clients }: InvoicePreviewProps) {
  const {
    clientId,
    currency = "USD",
    taxRateBasisPoints = 0,
    dueDate,
    notes,
    items = [],
  } = data;

  const client = clients.find((c) => c.id === clientId);
  
  const clientName = client?.companyName ?? client?.contactName ?? "Client Name";
  const clientEmail = client?.email ?? "client@example.com";

  const safeItems = items.map((item) => ({
    description: item.description ?? "",
    quantity: Number(item.quantity) || 0,
    unitPriceCents: Number(item.unitPriceCents) || 0,
  }));

  const subtotal = safeItems.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
  const tax = Math.round((subtotal * taxRateBasisPoints) / 10000);
  const total = subtotal + tax;

  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  return (
    <div className="w-full h-full bg-[#E5E7EB] dark:bg-[#1A1A24] p-4 sm:p-8 overflow-y-auto flex justify-center items-start rounded-r-xl">
      <div className="w-full max-w-[600px] bg-white text-black p-8 sm:p-12 shadow-lg min-h-[700px] flex flex-col font-sans">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-bold text-xl mb-4">
              O
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black font-syne">INVOICE</h1>
            <p className="text-gray-500 mt-1 font-dm-mono text-sm">#INV-1002</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-lg">Obsidian Inc.</h2>
            <p className="text-gray-500 text-sm">hello@obsidian.luxury</p>
            <p className="text-gray-500 text-sm">123 Design St, NY</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex justify-between mb-12 border-b border-gray-100 pb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Billed To</p>
            <h3 className="font-bold text-black">{clientName}</h3>
            <p className="text-gray-600 text-sm">{clientEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Due Date</p>
            <p className="font-bold text-black">{formattedDate}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="flex-grow">
          <div className="grid grid-cols-[1fr_80px_100px_100px] border-b border-gray-200 pb-2 mb-4 text-xs text-gray-400 uppercase tracking-wider font-bold font-dm-mono">
            <div>Description</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Rate</div>
            <div className="text-right">Amount</div>
          </div>
          
          <div className="space-y-4">
            {safeItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px] text-sm">
                <div className="text-gray-800">{item.description || "—"}</div>
                <div className="text-right text-gray-600">{item.quantity}</div>
                <div className="text-right text-gray-600">{formatCents(item.unitPriceCents, currency)}</div>
                <div className="text-right text-gray-800 font-medium">{formatCents(item.quantity * item.unitPriceCents, currency)}</div>
              </div>
            ))}
            {safeItems.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4 italic">No items added yet</div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-12 flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800">{formatCents(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-3">
              <span className="text-gray-500">Tax ({taxRateBasisPoints / 100}%)</span>
              <span className="text-gray-800">{formatCents(tax, currency)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 items-end">
              <span>Total</span>
              <span className="text-2xl font-barlow-condensed tracking-tight">{formatCents(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
