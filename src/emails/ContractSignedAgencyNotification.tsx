import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties } from "react";

type ContractSignedAgencyNotificationProps = {
  contractTitle: string;
  contractId: string;
  signerName: string;
  signerEmail: string;
  signerIp: string;      // Shown only to agency
  signedAt: string;
  signatureHash: string;
  pdfUrl: string;
  orgName: string;
};

export function ContractSignedAgencyNotification({
  contractTitle,
  contractId,
  signerName,
  signerEmail,
  signerIp,
  signedAt,
  signatureHash,
  pdfUrl,
  orgName,
}: ContractSignedAgencyNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{signerName} has signed {contractTitle}.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{orgName}</Text>
          </Section>

          <Section style={content}>
            <div style={badge}>✅ Contract Signed</div>
            <Heading style={heading}>
              {signerName} signed your contract
            </Heading>

            <Text style={paragraph}>
              <strong>{signerName}</strong> has electronically signed{" "}
              <em>{contractTitle}</em>. The signed PDF is attached below.
            </Text>

            {/* Audit table */}
            <div style={auditBox}>
              <Text style={auditTitle}>Signing Audit Record</Text>
              <AuditRow label="Signer name"  value={signerName} />
              <AuditRow label="Signer email" value={signerEmail} />
              <AuditRow label="Signed at"    value={signedAt} />
              <AuditRow label="IP address"   value={signerIp} mono />
              <AuditRow label="Contract ID"  value={contractId} mono />
              <AuditRow
                label="Integrity hash"
                value={signatureHash.slice(0, 32) + "…"}
                mono
              />
            </div>

            <Section style={buttonContainer}>
              <Button href={pdfUrl} style={button}>
                Download Signed PDF
              </Button>
            </Section>

            <Text style={disclaimer}>
              The signature hash is a SHA-256 integrity proof. It is not a legal
              signature by itself — consult your jurisdiction&apos;s e-signing laws
              (ESIGN Act, eIDAS, etc.).
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>ClientSpace · Secure document management</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function AuditRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Row style={auditRow}>
      <Column style={auditLabel}>{label}</Column>
      <Column style={mono ? { ...auditValue, fontFamily: "Courier New, monospace", fontSize: "11px" } : auditValue}>
        {value}
      </Column>
    </Row>
  );
}

const main: CSSProperties = {
  backgroundColor: "#f1f5f9",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  padding: "40px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "28px 40px",
  textAlign: "center",
};

const logoText: CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "800",
  margin: 0,
};

const content: CSSProperties = { padding: "40px" };

const badge: CSSProperties = {
  display: "inline-block",
  backgroundColor: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: "600",
  borderRadius: "20px",
  padding: "4px 12px",
  marginBottom: "16px",
};

const heading: CSSProperties = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const paragraph: CSSProperties = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const auditBox: CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const auditTitle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 12px",
};

const auditRow: CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  padding: "8px 0",
};

const auditLabel: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  width: "140px",
  verticalAlign: "top",
};

const auditValue: CSSProperties = {
  color: "#0f172a",
  fontSize: "12px",
  wordBreak: "break-all",
};

const buttonContainer: CSSProperties = { textAlign: "center", margin: "0 0 20px" };

const button: CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const disclaimer: CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  fontStyle: "italic",
  margin: 0,
};

const divider: CSSProperties = { borderColor: "#e2e8f0", margin: 0 };

const footer: CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "20px 40px",
  textAlign: "center",
};

const footerText: CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: 0,
};
