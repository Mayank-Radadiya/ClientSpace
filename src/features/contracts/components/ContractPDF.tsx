// src/features/contracts/components/ContractPDF.tsx
// @react-pdf/renderer PDF document for signed contracts.
// Used ONLY by the Inngest background function — never rendered in the browser.
//
// The PDF includes:
//   - Agency branding header
//   - Full contract body (plain text)
//   - Signature (image or typed name rendered as cursive-style text)
//   - Audit footer: signer name, email, IP, timestamp, hash

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContractPDFProps {
  contract: {
    id: string;
    title: string;
    bodyPlainText: string;
    signerName: string;
    signerEmail: string;
    signerIp: string | null;
    signedAt: Date | string;
    signatureHash: string;
    signatureImageUrl: string | null;
  };
  org: {
    name: string;
    logoUrl: string | null;
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    paddingVertical: 48,
    paddingHorizontal: 56,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  headerMeta: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 24,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.7,
    color: "#334155",
    marginBottom: 40,
  },
  signatureSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 24,
    marginTop: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 24,
    fontFamily: "Helvetica-Oblique",
    color: "#1e3a5f",
    marginBottom: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    marginBottom: 4,
    width: 240,
  },
  auditFooter: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  auditTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  auditRow: {
    fontSize: 7,
    color: "#94a3b8",
    marginBottom: 2,
  },
  auditHash: {
    fontSize: 6,
    color: "#94a3b8",
    fontFamily: "Courier",
    marginTop: 4,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractPDF({ contract, org }: ContractPDFProps) {
  const signedDate = typeof contract.signedAt === "string"
    ? contract.signedAt
    : contract.signedAt.toISOString();

  return (
    <Document
      title={contract.title}
      author={org.name}
      subject="Signed Contract"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.orgName}>{org.name}</Text>
          <Text style={s.headerMeta}>Electronically signed document{"\n"}{new Date(signedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</Text>
        </View>

        {/* Contract Title */}
        <Text style={s.title}>{contract.title}</Text>

        {/* Body */}
        <Text style={s.body}>{contract.bodyPlainText}</Text>

        {/* Signature section */}
        <View style={s.signatureSection}>
          <Text style={s.signatureLabel}>Electronic Signature</Text>

          {contract.signatureImageUrl ? (
            // Drawn signature — render image
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              src={contract.signatureImageUrl}
              style={{ height: 60, width: 200, objectFit: "contain", marginBottom: 8 }}
            />
          ) : (
            // Typed name — render in oblique (italic) Helvetica
            <>
              <Text style={s.signatureName}>{contract.signerName}</Text>
              <View style={s.signatureLine} />
            </>
          )}

          <Text style={{ fontSize: 8, color: "#64748b", marginTop: 4 }}>
            {contract.signerName} — {contract.signerEmail}
          </Text>
        </View>

        {/* Audit footer */}
        <View style={s.auditFooter} fixed>
          <Text style={s.auditTitle}>Document Audit Record</Text>
          <Text style={s.auditRow}>Signed by: {contract.signerName} &lt;{contract.signerEmail}&gt;</Text>
          <Text style={s.auditRow}>Timestamp: {signedDate}</Text>
          {contract.signerIp && (
            <Text style={s.auditRow}>IP Address: {contract.signerIp}</Text>
          )}
          <Text style={s.auditRow}>Document ID: {contract.id}</Text>
          <Text style={s.auditHash}>
            Integrity hash (SHA-256): {contract.signatureHash}
          </Text>
          <Text style={{ ...s.auditRow, marginTop: 4, fontFamily: "Helvetica-Oblique" }}>
            This document was electronically signed. The hash above is an integrity proof, not a legal signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
