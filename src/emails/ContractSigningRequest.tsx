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

type ContractSigningRequestProps = {
  contractTitle: string;
  clientName: string;
  orgName: string;
  signingUrl: string;
  expiresInDays: number;
};

export function ContractSigningRequest({
  contractTitle,
  clientName,
  orgName,
  signingUrl,
  expiresInDays,
}: ContractSigningRequestProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{orgName} sent you a contract to review and sign.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{orgName}</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>You have a document to sign</Heading>

            <Text style={paragraph}>Hi {clientName},</Text>
            <Text style={paragraph}>
              <strong>{orgName}</strong> has sent you a contract for your
              electronic signature:
            </Text>

            <div style={contractBox}>
              <Text style={contractTitle_}>{contractTitle}</Text>
            </div>

            <Text style={paragraph}>
              Please review the full document carefully before signing. You can
              sign electronically by clicking the button below — no account or
              download required.
            </Text>

            <Section style={buttonContainer}>
              <Button href={signingUrl} style={button}>
                Review &amp; Sign Document
              </Button>
            </Section>

            <Text style={muted}>
              This link expires in <strong>{expiresInDays} days</strong>. If you
              have any questions, please reply to this email or contact{" "}
              {orgName} directly.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This is a secure signing link. Do not share it with anyone.
            </Text>
            <Text style={footerText}>
              If you were not expecting this contract, you can safely ignore
              this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: CSSProperties = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
  padding: "40px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "32px 40px",
  textAlign: "center",
};

const logoText: CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: 0,
};

const content: CSSProperties = { padding: "40px" };

const heading: CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.3px",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const paragraph: CSSProperties = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const contractBox: CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "8px",
  margin: "20px 0",
  padding: "16px 20px",
};

const contractTitle_: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "600",
  margin: 0,
};

const buttonContainer: CSSProperties = {
  margin: "28px 0 20px",
  textAlign: "center",
};

const button: CSSProperties = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const muted: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
  textAlign: "center",
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
