import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties } from "react";

// Sent to the CLIENT after they sign — their signed copy.
// Security: signerIp is NOT included here (agency-only).

type ContractSignedClientCopyProps = {
  contractTitle: string;
  signerName: string;
  signedAt: string;
  pdfUrl: string;
  orgName: string;
};

export function ContractSignedClientCopy({
  contractTitle,
  signerName,
  signedAt,
  pdfUrl,
  orgName,
}: ContractSignedClientCopyProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your signed copy of {contractTitle} is ready.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{orgName}</Text>
          </Section>

          <Section style={content}>
            <div style={badge}>✅ Successfully Signed</div>

            <Heading style={heading}>Your signed document is ready</Heading>

            <Text style={paragraph}>Hi {signerName},</Text>
            <Text style={paragraph}>
              You have successfully signed <strong>{contractTitle}</strong> on{" "}
              <strong>{signedAt}</strong>. Your copy of the signed PDF is ready
              to download below.
            </Text>

            <div style={docBox}>
              <Text style={docTitle}>{contractTitle}</Text>
              <Text style={docMeta}>Signed on {signedAt}</Text>
            </div>

            <Section style={buttonContainer}>
              <Button href={pdfUrl} style={button}>
                Download Your Signed Copy
              </Button>
            </Section>

            <Text style={muted}>
              Please save this document for your records. If you have any
              questions about this contract, please contact {orgName} directly.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent on behalf of {orgName} via ClientSpace.
            </Text>
            <Text style={footerText}>
              Your signature was recorded electronically. The signed PDF contains
              a digital audit record.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
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
  margin: "0 0 16px",
};

const docBox: CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderLeft: "4px solid #22c55e",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const docTitle: CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const docMeta: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  margin: 0,
};

const buttonContainer: CSSProperties = { textAlign: "center", margin: "0 0 20px" };

const button: CSSProperties = {
  backgroundColor: "#16a34a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const muted: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
};

const divider: CSSProperties = { borderColor: "#e2e8f0", margin: 0 };

const footer: CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "24px 40px",
  textAlign: "center",
};

const footerText: CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 6px",
};
